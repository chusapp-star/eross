import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql,getCompanyId,statusToDb,statusToUi} from "../../../lib/agenda-db";
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
  return {type:typeRows[0],user,location};
}

async function resolveClient(sql,companyId,body){
  const name=clean(body.name),email=clean(body.email),phone=clean(body.phone),source=clean(body.source);
  if(!name) throw new Error("CLIENT_REQUIRED");
  let rows=[];
  if(body.client_id) rows=await sql`SELECT id::text FROM agenda_clients WHERE id=${body.client_id}::uuid AND company_id=${companyId}::uuid`;
  if(!rows[0]&&email) rows=await sql`SELECT id::text FROM agenda_clients WHERE company_id=${companyId}::uuid AND lower(email)=lower(${email}) LIMIT 1`;
  if(!rows[0]&&phone) rows=await sql`SELECT id::text FROM agenda_clients WHERE company_id=${companyId}::uuid AND phone=${phone} LIMIT 1`;
  if(rows[0]){
    await sql`UPDATE agenda_clients SET name=${name},phone=${phone||null},email=${email||null},source=${source||null},updated_at=now() WHERE id=${rows[0].id}::uuid`;
    return rows[0].id;
  }
  const inserted=await sql`INSERT INTO agenda_clients(company_id,name,phone,email,source) VALUES(${companyId}::uuid,${name},${phone||null},${email||null},${source||null}) RETURNING id::text`;
  return inserted[0].id;
}

async function validateWindow(sql,companyId,body,type,userId,ignoreId){
  const date=clean(body.date),time=clean(body.time);
  if(!date||!time) throw new Error("DATE_REQUIRED");
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
  if(mins%interval!==0)throw new Error("INVALID_SLOT_INTERVAL");
  const dur=Number(body.duration||type.duration_min||30),before=Number(type.buffer_before_min||0),after=Number(type.buffer_after_min||0);
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

async function emitEvent(sql,companyId,appointmentId,eventType,payload,status){
  await sql`INSERT INTO agenda_appointment_events(company_id,appointment_id,event_type,payload) VALUES(${companyId}::uuid,${appointmentId}::uuid,${eventType},${JSON.stringify(payload)}::jsonb)`;
  await sql`INSERT INTO agenda_integration_outbox(company_id,appointment_id,event_type,destination,payload) VALUES(${companyId}::uuid,${appointmentId}::uuid,${eventType},'eross_crm',${JSON.stringify(payload)}::jsonb)`;
  // Meta signals are selected and delivered by the future CRM, never by Agenda directly.
}

export default async function handler(req,res){
  if(!requireAgendaAdmin(req,res))return;
  if(!["POST","PATCH"].includes(req.method)) return res.status(405).json({error:"Método no permitido"});
  const sql=getSql(),companyId=getCompanyId(),body=req.body||{};
  try{
    const {type,user,location}=await resolveContext(sql,companyId,body);
    const clientId=await resolveClient(sql,companyId,body);
    const status=statusToDb(body.status),userId=user?.id||null;
    await validateWindow(sql,companyId,body,type,userId,req.method==="PATCH"?body.id:null);
    const duration=Number(body.duration||type.duration_min||30);
    const tags=Array.isArray(body.tags)?body.tags:clean(body.tags).split(",").map(x=>x.trim()).filter(Boolean);
    let row;
    if(req.method==="POST"){
      row=(await sql`INSERT INTO agenda_appointments(company_id,client_id,appointment_type_id,responsible_user_id,location_id,external_crm_lead_id,starts_at,ends_at,reserved_starts_at,reserved_ends_at,status,modality,source,comments,confirmation_channel,reminder_minutes,tags,color)
        SELECT ${companyId}::uuid,${clientId}::uuid,${type.id}::uuid,${userId}::uuid,${location?.id||null}::uuid,${clean(body.external_crm_lead_id)||null},
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone),
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration}),
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)-make_interval(mins=>${Number(type.buffer_before_min||0)}),
          ((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration+Number(type.buffer_after_min||0)}),
          ${status},${clean(body.modality||body.location)||null},${clean(body.source)||null},${clean(body.comments)||null},
          ${clean(body.confirmation_channel)||null},${body.reminder_minutes?Number(body.reminder_minutes):null},${tags},${type.color}
        FROM agenda_companies c WHERE c.id=${companyId}::uuid RETURNING id::text,status`)[0];
      await emitEvent(sql,companyId,row.id,"appointment.created",{source:clean(body.source),crm_lead_id:clean(body.external_crm_lead_id)},status);
    }else{
      if(!body.id) return res.status(400).json({error:"Falta id de cita"});
      const old=(await sql`SELECT status FROM agenda_appointments WHERE id=${body.id}::uuid AND company_id=${companyId}::uuid`)[0];
      if(!old) return res.status(404).json({error:"Cita no encontrada"});
      row=(await sql`UPDATE agenda_appointments a SET
          client_id=${clientId}::uuid,appointment_type_id=${type.id}::uuid,responsible_user_id=${userId}::uuid,location_id=${location?.id||null}::uuid,
          external_crm_lead_id=${clean(body.external_crm_lead_id)||null},
          starts_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone),
          ends_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration}),
          reserved_starts_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)-make_interval(mins=>${Number(type.buffer_before_min||0)}),
          reserved_ends_at=((${clean(body.date)}::date+${clean(body.time)}::time) AT TIME ZONE c.timezone)+make_interval(mins=>${duration+Number(type.buffer_after_min||0)}),
          status=${status},modality=${clean(body.modality||body.location)||null},source=${clean(body.source)||null},comments=${clean(body.comments)||null},
          confirmation_channel=${clean(body.confirmation_channel)||null},reminder_minutes=${body.reminder_minutes?Number(body.reminder_minutes):null},
          tags=${tags},color=${type.color},updated_at=now()
        FROM agenda_companies c WHERE a.id=${body.id}::uuid AND a.company_id=${companyId}::uuid AND c.id=a.company_id RETURNING a.id::text,a.status`)[0];
      await emitEvent(sql,companyId,row.id,old.status!==status?"appointment."+status:"appointment.updated",{previous_status:old.status},status);
    }
    return res.status(200).json({ok:true,id:row.id,status:statusToUi(row.status)});
  }catch(error){
    console.error("agenda appointment",error);
    const m=String(error?.message||error);
    if(m.includes("TYPE_NOT_FOUND")) return res.status(400).json({error:"Tipo de cita inválido"});
    if(m.includes("CLIENT_REQUIRED")) return res.status(400).json({error:"Nombre del cliente requerido"});
    if(m.includes("DATE_REQUIRED")) return res.status(400).json({error:"Fecha y hora requeridas"});
    if(m.includes("MIN_NOTICE")) return res.status(409).json({error:"La cita no cumple la anticipación mínima configurada"});
    if(m.includes("INVALID_SLOT_INTERVAL")) return res.status(409).json({error:"La hora debe coincidir con el intervalo de reserva configurado"});
    if(m.includes("OUTSIDE_AVAILABILITY")) return res.status(409).json({error:"Ese horario está fuera de la disponibilidad configurada"});
    if(m.includes("BLOCKED:")) return res.status(409).json({error:m.split("BLOCKED:")[1]||"Horario bloqueado"});
    if(m.includes("DOUBLE_BOOKING")||m.includes("agenda_no_buffer_overlap_responsible")||m.includes("agenda_no_double_booking_responsible")) return res.status(409).json({error:"Ese responsable ya tiene una cita que choca con ese horario"});
    return res.status(500).json({error:"No se pudo guardar la cita"});
  }
}
