import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
const cookie="eross_identity_qa";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(cookie+"="))?.slice(cookie.length+1);
 const session=verifyIdentitySession(token);
 if(!session)return res.status(401).json({error:"Iniciá sesión con tu cuenta de empresa"});
 try{
  const sql=getSql(),m=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!m||m.membership_id!==session.membership||m.role!==session.role||!roleCan(m.role,"appointments.read"))return res.status(403).json({error:"Acceso denegado"});
  const company=await sql`SELECT name,timezone FROM agenda_companies WHERE id=${m.company_id}::uuid AND active=true`;
  const appointments=await sql`SELECT id::text,status,starts_at,ends_at,comments FROM agenda_appointments WHERE company_id=${m.company_id}::uuid ORDER BY starts_at DESC LIMIT 100`;
  return res.status(200).json({ok:true,company:company[0],role:m.role,appointments});
 }catch(e){console.error("tenant calendar qa",e);return res.status(500).json({error:"No se pudo cargar el calendario"})}
}