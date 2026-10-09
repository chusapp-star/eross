import {authorizeAgendaWrite} from "../../../lib/agenda-write-auth";
import {statusToDb,statusToUi} from "../../../lib/agenda-db";
const clean=v=>String(v??"").trim();

async function resolveContext(sql,companyId,body){
  const typeRows=body.appointment_type_id
    ? await sql`SELECT * FROM agenda_appointment_types WHERE id=${body.appointment_type_id}::uuid AND company_id=${companyId}::uuid AND active=true`
    : await sql`SELECT * FROM agenda_appointment_types WHERE company_id=${companyId}::uuid AND lower(name)=lower(${clean(body.type)}) AND active=true LIMIT 1`;
  if(!typeRows[0]) throw new Error("TYPE_NOT_FOUND");
  let user=null;
  if(body.responsible_user_id){
    user=(await sql`SELECT id::text,name FROM agenda_users WHERE id=${body.responsible_user_id}::uuid AND company_id=${companyId}::uuid AND active=true`)[0]||null;
  }else if(clean(body.responsible)&&clean(body.responsible)!=="Sin asignar"){
    user=(await sql`SELECT id::text,name FROM agenda_users WHERE company_id=${companyId}::uuid AND lower(name)=lower(${clean(body.responsible)}) AND active=true LIMIT 1`)[0]||null;
  }
  let location=null;
  if(body.location_id){
    location=(await sql`SELECT id::text,name FROM agenda_locations WHERE id=${body.location_id}::uuid AND company_id=${companyId}::uuid AND active=true`)[0]||null;
  }else{
    location=(await sql`SELECT id::text,name FROM agenda_locations WHERE company_id=${companyId}::uuid AND active=true ORDER BY created_at LIMIT 1`)[0]||null;
  }
  // Never silently replace an explicitly selected cross-company or inactive assignment.
  if(body.responsible_user_id&&!user)throw new Error("USER_NOT_FOUND");
  if(body.location_id&&!location)throw new Error("LOCATION_NOT_FOUND");
  if(!body.responsible_user_id&&clean(body.responsible)&&clean(body.responsible)!=="Sin asignar"&&!user)throw new Error("USER_NOT_FOUND");
  return {type:typeRows[0],user,location};
}

async function validateWindow(sql,companyId,body,type,userId,ignoreId){
  const date=clean(body.date),time=clean(body.time);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error("DATE_REQUIRED");
  const weekday=(await sql`SELECT EXTRACT(DOW FROM ${date}::date)::int weekday`)[0].weekday;
  const rule=(await sql`SELECT active,all_day,slots FROM agenda_availability_rules WHERE company_id=${companyId}::uuid AND weekday=${weekday} AND user_id IS NULL AND location_id IS NULL LIMIT 1`)[0];
  if(!rule||!rule.active) throw new Error("OUTSIDE_AVAILABILITY");
  const mins=Number(time.slice(0,2))*60+Number(time.slice(3,5));
  // No confiar solo en el calendario del navegador: aplicar reglas también en el servidor.
  let bookingSettings=[];
  try{
    bookingSettings=await sql`SELECT slot_interval_min,min_notice_min
      FROM agenda_booking_settings WHERE company_id=${companyId}::uuid`;
  }catch(error){
    // Compatibilidad de despliegues anteriores mientras la migración 001 sigue pendiente.
    if(error?.code!=="42P01"&&!String(error?.message||"").includes("agenda_booking_settings"))throw error;
  }
  const interval=Number(bookingSettings[0]?.slot_interval_min??30);
  const minNotice=Number(bookingSettings[0]?.min_notice_min??120);
  const startRows=await sql`SELECT ((${date}::date+${time}::time) AT TIME ZONE c.timezone) start_at,
    now() server_now FROM agenda_companies c WHERE id=${companyId}::uuid`;
  if(!startRows.length)throw new Error("COMPANY_NOT_FOUND");
  if(new Date(startRows[0].start_at).getTime()-new Date(startRows[0].server_now).getTime()<minNotice*60000)
    throw new Error("MIN_NOTICE");
  if(!Number.isInteger(interval)||interval<1||mins%interval!==0)throw new Error("INVALID_SLOT_INTERVAL");
  const dur=Number(type.duration_min),before=Number(type.buffer_before_min||0),after=Number(type.buffer_after_min||0);
  let fits=!!rule.all_day;
  if(!fits){
    for(const slot of (rule.slots||[])){
      const sm=Number(slot.start.slice(0,2))*60+Number(slot.start.slice(3,5));
      let em=Number(slot.end.slice(0,2))*60+Number(slot.end.slice(3,5)); if(em<=sm) em+=1440;
      let candidate=mins; if(candidate<sm&&em>1440) candidate+=1440;
      if(candidate-before>=sm && candidate+dur+after<=em){fits=true;break;}
    }
  }
  if(!fits) throw new Error("OUTSIDE_AVAILABILITY");
  const block=await sql`SELECT reason FROM agenda_blocks b JOIN agenda_companies c ON c.id=b.company_id
                         WHERE b.company_id=${companyId}::uuid
                         AND tstzrange(b.starts_at,b.ends_at,'[)') &&
                         tstzrange(((${date}::date+${time}::time) AT TIME ZONE c.timezone)-make_interval(mins=>${before}),
                                   ((${date}::date+${time}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${dur+after}),'[)')
                         LIMIT 1`;
  if(block[0]) throw new Error("BLOCKED:"+block[0].reason);
  if(userId){
    const conflict=await sql`SELECT a.id::text FROM agenda_appointments a JOIN agenda_companies c ON c.id=a.company_id
                             WHERE a.company_id=${companyId}::uuid AND a.responsible_user_id=${userId}::uuid AND a.status<>'cancelled'
                             AND (${ignoreId||null}::uuid IS NULL OR a.id<>${ignoreId||null}::uuid)
                             AND tstzrange(a.reserved_starts_at,a.reserved_ends_at,'[)') &&
                             tstzrange(((${date}::date+${time}::time) AT TIME ZONE c.timezone)-make_interval(mins=>${before}),
                                       ((${date}::date+${time}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${dur+after}),'[)')
                             LIMIT 1`;
    if(conflict[0]) throw new Error("DOUBLE_BOOKING");
  }
}

export default async function handler(req,res){
  if(!["POST","PATCH"].includes(req.method)) return res.status(405).json({error:"Método no permitido"});
  let authorization;
  try{authorization=await authorizeAgendaWrite(req,res,{action:req.method==="POST"?"appointments.create":"appointments.edit"})}catch(error){console.error("agenda authorization",error);return res.status(500).json({error:"No se pudo verificar el acceso"})}
  if(!authorization)return;
  const {sql,companyId}=authorization,body=req.body||{};
  try{
    // Reject cross-tenant edits before touching client records or appointment context.
    if(req.method==="PATCH"){
      const id=String(body.id||"");
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
        return res.status(400).json({error:"ID de cita inválido"});
      const owned=await sql`SELECT id FROM agenda_appointments WHERE id=${id}::uuid AND company_id=${companyId}::uuid LIMIT 1`;
      if(!owned.length)return res.status(404).json({error:"Cita no encontrada"});
    }
    const {type,user,location}=await resolveContext(sql,companyId,body);
    let status=statusToDb(body.status);const userId=user?.id||null;
    // Keep the existing status on edits when the client omits the status field.
    if(req.method==="PATCH"&&(body.status===undefined||body.status===null||String(body.status).trim()==="")){
      const existing=await sql`SELECT status FROM agenda_appointments WHERE id=${body.id}::uuid AND company_id=${companyId}::uuid`;
      if(!existing.length)return res.status(404).json({error:"Cita no encontrada"});
      status=existing[0].status;
    }
    await validateWindow(sql,companyId,body,type,userId,req.method==="PATCH"?body.id:null);
    if(!clean(body.name))throw new Error("CLIENT_REQUIRED");
    // Appointment duration comes from the company-owned service type, never an untrusted browser override.
    const duration=Number(type.duration_min);
    const tags=Array.isArray(body.tags)?body.tags:clean(body.tags).split(",").map(x=>x.trim()).filter(Boolean);
    let row;
    if(req.method==="POST"){
      row=(await sql`WITH matched AS (SELECT id FROM agenda_clients WHERE company_id=${companyId}::uuid AND (
        (${clean(body.client_id)||null}::uuid IS NOT NULL AND id=${clean(body.client_id)||null}::uuid)
        OR (nullif(${clean(body.email)},'') IS NOT NULL AND lower(email)=lower(${clean(body.email)}))
        OR (nullif(${clean(body.phone)},'') IS NOT NULL AND phone=${clean(body.phone)})
      ) ORDER BY CASE WHEN id=${clean(body.client_id)||null}::uuid THEN 0 ELSE 1 END LIMIT 1),
      updated_client AS (UPDATE agenda_clients SET name=${clean(body.name)},phone=${clean(body.phone)||null},email=${clean(body.email)||null},source=${clean(body.source)||null},updated_at=now()
       WHERE id=(SELECT id FROM matched) AND company_id=${companyId}::uuid RETURNING id),
      inserted_client AS (INSERT INTO agenda_clients(company_id,name,phone,email,source)
       SELECT ${companyId}::uuid,${clean(body.name)},${clean(body.phone)||null},${clean(body.email)||null},${clean(body.source)||null}
       WHERE NOT EXISTS(SELECT 1 FROM updated_client) RETURNING id),
      resolved_client AS (SELECT id FROM updated_client UNION ALL SELECT id FROM inserted_client), changed AS (INSERT INTO agenda_appointments(company_id,client_id,appointment_type_id,responsible_user_id,location_id,external_crm_lead_id,starts_at,ends_at,reserved_starts_at,reserved_ends_at,status,modality,source,comments,confirmation_channel,reminder_minutes,tags,color)
        SELECT ${companyId}::uuid,(SELECT id FROM resolved_client),${type.id}::uuid,${userId}::uuid,${location?.id||null}::uuid,${clean(body.external_crm_lead_id)||null},
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone),
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration}),
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)-make_interval(mins=>${Number(type.buffer_before_min||0)}),
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration+Number(type.buffer_after_min||0)}),
          ${status},${clean(body.modality||body.location)||null},${clean(body.source)||null},${clean(body.comments)||null},
          ${clean(body.confirmation_channel)||null},${body.reminder_minutes?Number(body.reminder_minutes):null},${tags},${type.color}
        FROM agenda_companies c WHERE c.id=${companyId}::uuid RETURNING id,company_id,client_id,status
      ), logged AS (INSERT INTO agenda_appointment_events(company_id,appointment_id,event_type,payload)
       SELECT company_id,id,'appointment.created',jsonb_build_object('schema_version',1,'client_id',client_id::text,'status',status,'source',${clean(body.source)}::text) FROM changed
       RETURNING id,company_id,appointment_id,event_type,payload
      ), queued AS (INSERT INTO agenda_integration_outbox(company_id,appointment_id,event_type,destination,payload)
       SELECT company_id,appointment_id,event_type,'eross_crm',payload||jsonb_build_object('event_id',id::text,'occurred_at',now()) FROM logged RETURNING id
      ) SELECT id::text,status,(SELECT count(*) FROM queued) AS events_queued FROM changed`)[0];
    }else{
      if(!body.id) return res.status(400).json({error:"Falta id de cita"});
      const old=(await sql`SELECT status FROM agenda_appointments WHERE id=${body.id}::uuid AND company_id=${companyId}::uuid`)[0];
      if(!old) return res.status(404).json({error:"Cita no encontrada"});
      row=(await sql`WITH matched AS (SELECT id FROM agenda_clients WHERE company_id=${companyId}::uuid AND (
        (${clean(body.client_id)||null}::uuid IS NOT NULL AND id=${clean(body.client_id)||null}::uuid)
        OR (nullif(${clean(body.email)},'') IS NOT NULL AND lower(email)=lower(${clean(body.email)}))
        OR (nullif(${clean(body.phone)},'') IS NOT NULL AND phone=${clean(body.phone)})
      ) ORDER BY CASE WHEN id=${clean(body.client_id)||null}::uuid THEN 0 ELSE 1 END LIMIT 1),
      updated_client AS (UPDATE agenda_clients SET name=${clean(body.name)},phone=${clean(body.phone)||null},email=${clean(body.email)||null},source=${clean(body.source)||null},updated_at=now()
       WHERE id=(SELECT id FROM matched) AND company_id=${companyId}::uuid RETURNING id),
      inserted_client AS (INSERT INTO agenda_clients(company_id,name,phone,email,source)
       SELECT ${companyId}::uuid,${clean(body.name)},${clean(body.phone)||null},${clean(body.email)||null},${clean(body.source)||null}
       WHERE NOT EXISTS(SELECT 1 FROM updated_client) RETURNING id),
      resolved_client AS (SELECT id FROM updated_client UNION ALL SELECT id FROM inserted_client), previous AS (SELECT id,status,starts_at FROM agenda_appointments WHERE id=${body.id}::uuid AND company_id=${companyId}::uuid), changed AS (UPDATE agenda_appointments a SET
          client_id=(SELECT id FROM resolved_client),appointment_type_id=${type.id}::uuid,responsible_user_id=${userId}::uuid,location_id=${location?.id||null}::uuid,
          external_crm_lead_id=${clean(body.external_crm_lead_id)||null},
          starts_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone),
          ends_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration}),
          reserved_starts_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)-make_interval(mins=>${Number(type.buffer_before_min||0)}),
          reserved_ends_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration+Number(type.buffer_after_min||0)}),
          status=${status},modality=${clean(body.modality||body.location)||null},source=${clean(body.source)||null},comments=${clean(body.comments)||null},
          confirmation_channel=${clean(body.confirmation_channel)||null},reminder_minutes=${body.reminder_minutes?Number(body.reminder_minutes):null},
          tags=${tags},color=${type.color},updated_at=now()
        FROM agenda_companies c WHERE a.id=${body.id}::uuid AND a.company_id=${companyId}::uuid AND c.id=a.company_id RETURNING a.id,a.company_id,a.client_id,a.status,a.starts_at
      ), logged AS (INSERT INTO agenda_appointment_events(company_id,appointment_id,event_type,payload)
       SELECT c.company_id,c.id,
       CASE WHEN p.starts_at IS DISTINCT FROM c.starts_at THEN 'appointment.rescheduled'
            WHEN p.status IS DISTINCT FROM c.status THEN 'appointment.'||c.status ELSE 'appointment.updated' END,
       jsonb_build_object('schema_version',1,'client_id',c.client_id::text,'previous_status',p.status,'status',c.status,
         'previous_starts_at',p.starts_at,'starts_at',c.starts_at,'source','eross_agenda')
       FROM changed c JOIN previous p ON p.id=c.id RETURNING id,company_id,appointment_id,event_type,payload
      ), queued AS (INSERT INTO agenda_integration_outbox(company_id,appointment_id,event_type,destination,payload)
       SELECT company_id,appointment_id,event_type,'eross_crm',payload||jsonb_build_object('event_id',id::text,'occurred_at',now())
       FROM logged RETURNING id
      ) SELECT id::text,status,(SELECT count(*) FROM queued) AS events_queued FROM changed`)[0];
    }
    return res.status(200).json({ok:true,id:row.id,status:statusToUi(row.status)});
  }catch(error){
    console.error("agenda appointment",error);
    const m=String(error?.message||error);
    if(m.includes("TYPE_NOT_FOUND")) return res.status(400).json({error:"Tipo de cita inválido"});
    if(m.includes("USER_NOT_FOUND")) return res.status(400).json({error:"El responsable seleccionado no pertenece a esta empresa o está inactivo"});
    if(m.includes("LOCATION_NOT_FOUND")) return res.status(400).json({error:"La sede seleccionada no pertenece a esta empresa o está inactiva"});
    if(m.includes("CLIENT_REQUIRED")) return res.status(400).json({error:"Nombre del cliente requerido"});
    if(m.includes("DATE_REQUIRED")) return res.status(400).json({error:"Fecha y hora requeridas"});
    if(m.includes("MIN_NOTICE")) return res.status(409).json({error:"La cita no cumple la anticipación mínima configurada"});
    if(m.includes("INVALID_SLOT_INTERVAL")) return res.status(409).json({error:"La hora debe coincidir con el intervalo de reserva configurado"});
    if(m.includes("OUTSIDE_AVAILABILITY")) return res.status(409).json({error:"Ese horario está fuera de la disponibilidad configurada"});
    if(m.includes("BLOCKED:")) return res.status(409).json({error:m.split("BLOCKED:")[1]||"Horario bloqueado"});
    if(m.includes("DOUBLE_BOOKING")||m.includes("agenda_no_buffer_overlap_responsible")||m.includes("agenda_no_double_booking_responsible")||m.includes("agenda_no_overlapping_active_responsible")) return res.status(409).json({error:"Ese responsable ya tiene una cita que choca con ese horario"});
    return res.status(500).json({error:"No se pudo guardar la cita"});
  }
}
