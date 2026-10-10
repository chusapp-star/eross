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
  if(!m||m.membership_id!==s.membership||m.role!==s.role) return res.status(403).json({error:"Membresía inválida"});
  const company=(await sql`SELECT id::text,name,slug,timezone,active FROM agenda_companies WHERE id=${m.company_id}::uuid AND active=true`)[0];
  if(!company)return res.status(404).json({error:"Empresa no encontrada"});
  const totals=(await sql`SELECT (SELECT count(*)::int FROM agenda_users WHERE company_id=${m.company_id}::uuid) AS users,(SELECT count(*)::int FROM agenda_locations WHERE company_id=${m.company_id}::uuid) AS locations,(SELECT count(*)::int FROM agenda_clients WHERE company_id=${m.company_id}::uuid) AS clients`)[0];
  return res.status(200).json({ok:true,company,totals,role:m.role});
 }catch(e){console.error("EROSS QA directory",e);return res.status(500).json({error:"No se pudo consultar Neon QA"})}
}