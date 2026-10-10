import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="));
 const session=verifyIdentitySession(cookie?.slice("eross_identity_qa=".length));
 if(!session)return res.status(401).json({error:"Sesión requerida"});
 try{
  const sql=getSql();
  const m=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!m||m.membership_id!==session.membership||m.role!==session.role||!roleCan(m.role,"appointments.read"))return res.status(403).json({error:"Acceso denegado"});
  const rows=await sql`SELECT c.id::text AS id,c.name,c.email,c.phone,c.source,c.created_at,
   count(a.id)::int AS appointments, max(a.starts_at) AS last_appointment
   FROM agenda_clients c LEFT JOIN agenda_appointments a ON a.client_id=c.id AND a.company_id=c.company_id
   WHERE c.company_id=${m.company_id}::uuid
   GROUP BY c.id,c.name,c.email,c.phone,c.source,c.created_at ORDER BY c.name LIMIT 1000`;
  return res.status(200).json({ok:true,clients:rows});
 }catch(e){console.error("qa clients list",e);return res.status(500).json({error:"No se pudo cargar clientes"})}
}
