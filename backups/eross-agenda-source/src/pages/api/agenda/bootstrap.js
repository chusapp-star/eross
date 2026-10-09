import {sessionValid} from "../../../lib/agenda-auth";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
import {getSql,getCompanyId,statusToUi} from "../../../lib/agenda-db";

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET") return res.status(405).json({error:"Método no permitido"});
  try{
    const sql=getSql();
    const tenantEnabled=process.env.EROSS_MULTIEMPRESA_QA_ENABLED==="true"&&process.env.EROSS_EVENT_HUB_QA_ENABLED==="true";
    const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="))?.slice("eross_identity_qa=".length);
    let companyId;
    if(tenantEnabled&&token){
      const session=verifyIdentitySession(token);
      if(!session)return res.status(401).json({error:"Sesión individual inválida"});
      const membership=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
      if(!membership||membership.membership_id!==session.membership||membership.role!==session.role||!roleCan(membership.role,"appointments.read"))return res.status(403).json({error:"Acceso denegado"});
      companyId=membership.company_id;
    }else if(sessionValid(req)){
      companyId=getCompanyId();
    }else return res.status(401).json({error:"Sesión requerida"});
    const [companyRows,userRows,locationRows,typeRows,availabilityRows,blockRows,appointmentRows]=await Promise.all([
      sql`SELECT id::text,name,slug,timezone FROM agenda_companies WHERE id=${companyId}::uuid AND active=true`,
      sql`SELECT id::text,name,email,role,active FROM agenda_users WHERE company_id=${companyId}::uuid AND active=true ORDER BY name`,
      sql`SELECT id::text,name,address,COALESCE(timezone,'') timezone,active FROM agenda_locations WHERE company_id=${companyId}::uuid AND active=true ORDER BY name`,
      sql`SELECT id::text,name,duration_min,modality,color,buffer_before_min,buffer_after_min,active FROM agenda_appointment_types WHERE company_id=${companyId}::uuid ORDER BY created_at`,
      sql`SELECT id::text,weekday,active,all_day,slots,user_id::text,location_id::text FROM agenda_availability_rules WHERE company_id=${companyId}::uuid ORDER BY weekday`,
      sql`SELECT b.id::text,to_char(b.starts_at AT TIME ZONE c.timezone,'YYYY-MM-DD') date,to_char(b.starts_at AT TIME ZONE c.timezone,'HH24:MI') "from",to_char(b.ends_at AT TIME ZONE c.timezone,'YYYY-MM-DD') end_date,to_char(b.ends_at AT TIME ZONE c.timezone,'HH24:MI') "to",b.reason,b.user_id::text,b.location_id::text
           FROM agenda_blocks b JOIN agenda_companies c ON c.id=b.company_id
           WHERE b.company_id=${companyId}::uuid ORDER BY b.starts_at`,
      sql`SELECT a.id::text,
                  to_char(a.starts_at AT TIME ZONE c.timezone,'YYYY-MM-DD') date,
                  to_char(a.starts_at AT TIME ZONE c.timezone,'HH24:MI') time,
                  cl.id::text client_id,COALESCE(cl.name,'') name,COALESCE(cl.phone,'') phone,COALESCE(cl.email,'') email,
                  t.id::text appointment_type_id,COALESCE(t.name,'Cita') type,
                  EXTRACT(EPOCH FROM (a.ends_at-a.starts_at))/60 duration,
                  u.id::text responsible_user_id,COALESCE(u.name,'Sin asignar') responsible,
                  l.id::text location_id,COALESCE(l.name,'') branch,
                  a.status,a.modality,COALESCE(a.source,'') source,COALESCE(a.comments,'') comments,
                  COALESCE(a.confirmation_channel,'') confirmation_channel,a.reminder_minutes,
                  COALESCE(a.tags,ARRAY[]::text[]) tags,COALESCE(a.color,t.color,'#C89B3C') color,
                  COALESCE(a.external_crm_lead_id,'') external_crm_lead_id
           FROM agenda_appointments a
           JOIN agenda_companies c ON c.id=a.company_id
           LEFT JOIN agenda_clients cl ON cl.id=a.client_id
           LEFT JOIN agenda_appointment_types t ON t.id=a.appointment_type_id
           LEFT JOIN agenda_users u ON u.id=a.responsible_user_id
           LEFT JOIN agenda_locations l ON l.id=a.location_id
           WHERE a.company_id=${companyId}::uuid
           ORDER BY a.starts_at`
    ]);
    const company=companyRows[0];
    if(!company) return res.status(404).json({error:"Empresa no encontrada"});
    const appointments=appointmentRows.map(a=>({...a,duration:Number(a.duration||30),status:statusToUi(a.status)}));
    return res.status(200).json({ok:true,company,users:userRows,locations:locationRows,
      types:typeRows.map(t=>({...t,duration:Number(t.duration_min),bufferBefore:Number(t.buffer_before_min),bufferAfter:Number(t.buffer_after_min)})),
      availability:availabilityRows,blocks:blockRows,appointments});
  }catch(error){
    console.error("agenda bootstrap",error);
    return res.status(500).json({error:"No se pudo cargar la agenda"});
  }
}
