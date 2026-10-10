import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const raw=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="));
 const s=verifyIdentitySession(raw?.slice("eross_identity_qa=".length));
 if(!s)return res.status(401).json({error:"Sesión requerida"});
 try{
  const sql=getSql(),m=await resolveTenantMembership(sql,{identityId:s.sub,companyId:s.tenant});
  if(!m||m.membership_id!==s.membership||m.role!==s.role||!roleCan(m.role,"companies.manage"))return res.status(403).json({error:"Solo administración puede consultar configuración"});
  const [company,settings,types,locations,availability]=await Promise.all([
   sql`SELECT name,timezone FROM agenda_companies WHERE id=${m.company_id}::uuid AND active=true`,
   sql`SELECT slot_interval_min,min_notice_min FROM agenda_booking_settings WHERE company_id=${m.company_id}::uuid`,
   sql`SELECT name,duration_min,buffer_before_min,buffer_after_min,active FROM agenda_appointment_types WHERE company_id=${m.company_id}::uuid ORDER BY name`,
   sql`SELECT name,timezone,active FROM agenda_locations WHERE company_id=${m.company_id}::uuid ORDER BY name`,
   sql`SELECT weekday,active,all_day,slots FROM agenda_availability_rules WHERE company_id=${m.company_id}::uuid AND user_id IS NULL AND location_id IS NULL ORDER BY weekday`
  ]);
  if(!company[0])return res.status(404).json({error:"Empresa no encontrada"});
  return res.status(200).json({ok:true,company:company[0],booking:settings[0]||null,types,locations,availability,readonly:true});
 }catch(e){console.error("QA tenant settings",e);return res.status(500).json({error:"No se pudo cargar configuración"})}
}