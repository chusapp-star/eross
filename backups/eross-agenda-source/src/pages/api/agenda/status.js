import {validateWindow} from "./appointments";
import {authorizeAgendaWrite} from "../../../lib/agenda-write-auth";
import {statusToDb,statusToUi} from "../../../lib/agenda-db";

const allowed=new Set(["confirmed","rescheduled","cancelled","attended","no_show","pending"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Atomic change + event + CRM outbox. No direct connection to Meta.
export default async function handler(req,res){
  if(req.method!=="PATCH")return res.status(405).json({error:"Método no permitido"});
  const id=String(req.body?.id||"");
  const requested=String(req.body?.status||"").trim().toLowerCase();
  const status=statusToDb(requested);
  if(!uuid.test(id)||!requested||!allowed.has(requested)&&!["confirmada","confirmado","reprogramada","cancelada","atendida","no asistió","no confirmada"].includes(requested))
    return res.status(400).json({error:"ID o estado inválido"});
  let authorization;
  try{authorization=await authorizeAgendaWrite(req,res,{action:"appointments.status"})}catch(error){console.error("agenda authorization",error);return res.status(500).json({error:"No se pudo verificar el acceso"})}
  if(!authorization)return;
  const {companyId,sql}=authorization;
  const eventType={
    confirmed:"appointment.confirmed",rescheduled:"appointment.rescheduled",
    cancelled:"appointment.cancelled",attended:"appointment.attended",
    no_show:"appointment.no_show",pending:"appointment.pending"
  }[status];
  try{
    if(status!=="cancelled"){
      const current=(await sql`SELECT a.status,a.responsible_user_id::text,a.location_id::text,
       to_char(a.starts_at AT TIME ZONE c.timezone,'YYYY-MM-DD') date,to_char(a.starts_at AT TIME ZONE c.timezone,'HH24:MI') time,
       t.duration_min,t.buffer_before_min,t.buffer_after_min,t.active AS type_active,u.active AS user_active,l.active AS location_active
       FROM agenda_appointments a JOIN agenda_companies c ON c.id=a.company_id
       JOIN agenda_appointment_types t ON t.id=a.appointment_type_id AND t.company_id=a.company_id
       JOIN agenda_users u ON u.id=a.responsible_user_id AND u.company_id=a.company_id
       JOIN agenda_locations l ON l.id=a.location_id AND l.company_id=a.company_id
       WHERE a.id=${id}::uuid AND a.company_id=${companyId}::uuid`)[0];
      if(current?.status==="cancelled"){
        if(!current.type_active||!current.user_active||!current.location_active)return res.status(409).json({error:"No se puede reactivar: servicio, responsable o sede inactivos"});
        await validateWindow(sql,companyId,current,current,current.responsible_user_id,current.location_id,id);
      }
    }
    const result=await sql`
      WITH changed AS (
        UPDATE agenda_appointments SET status=${status},updated_at=now()
        WHERE id=${id}::uuid AND company_id=${companyId}::uuid AND status IS DISTINCT FROM ${status}
        RETURNING id,company_id,client_id,external_crm_lead_id,status
      ), event_record AS (
        INSERT INTO agenda_appointment_events(company_id,appointment_id,event_type,payload)
        SELECT company_id,id,${eventType},jsonb_build_object(
          'schema_version',1,'appointment_id',id::text,'client_id',client_id::text,
          'crm_lead_id',external_crm_lead_id,'status',status,'source','eross_agenda')
        FROM changed RETURNING id,company_id,appointment_id,event_type,payload
      ), queued AS (
        INSERT INTO agenda_integration_outbox(company_id,appointment_id,event_type,destination,payload)
        SELECT company_id,appointment_id,event_type,'eross_crm',
          payload||jsonb_build_object('event_id',id::text,'occurred_at',now())
        FROM event_record RETURNING appointment_id
      )
      SELECT id::text,status,(SELECT count(*) FROM queued) AS queued_count FROM changed
    `;
    if(result.length)return res.status(200).json({ok:true,id:result[0].id,status:statusToUi(result[0].status),event_queued:true});
    const exists=await sql`SELECT status FROM agenda_appointments WHERE id=${id}::uuid AND company_id=${companyId}::uuid`;
    if(!exists.length)return res.status(404).json({error:"Cita no encontrada"});
    return res.status(200).json({ok:true,id,status:statusToUi(exists[0].status),unchanged:true,event_queued:false});
  }catch(error){
    console.error("agenda status",error);
    // Reopening a cancelled booking can violate the database exclusion constraint.
    // Return a meaningful conflict rather than an opaque server error.
    if(String(error?.message||"").includes("BLOCKED:"))return res.status(409).json({error:"No se puede reactivar: horario bloqueado"});
    if(["MIN_NOTICE","OUTSIDE_AVAILABILITY","INVALID_SLOT_INTERVAL","DOUBLE_BOOKING"].includes(error?.message))return res.status(409).json({error:"No se puede reactivar: horario no disponible según la configuración actual"});
    if(error?.code==="23P01"||String(error?.message||"").includes("agenda_qa_no_concurrent_responsible_overlap"))
      return res.status(409).json({error:"No se puede reactivar: el responsable ya tiene otra cita en ese horario"});
    return res.status(500).json({error:"No se pudo actualizar el estado"});
  }
}
