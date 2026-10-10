import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!["GET","PATCH"].includes(req.method))return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const raw=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="));
 const s=verifyIdentitySession(raw?.slice("eross_identity_qa=".length));
 if(!s)return res.status(401).json({error:"Sesión requerida"});
 try{
  const sql=getSql(),m=await resolveTenantMembership(sql,{identityId:s.sub,companyId:s.tenant});
  if(!m||m.membership_id!==s.membership||m.role!==s.role) return res.status(403).json({error:"Membresía inválida"});
  if(req.method==="PATCH"){
   const origin=req.headers.origin;
   if(!origin||!req.headers.host||new URL(origin).host!==req.headers.host)return res.status(403).json({error:"Origen no autorizado"});
   if(!roleCan(m.role,"companies.manage"))return res.status(403).json({error:"Solo administración puede editar la empresa"});
   const name=String(req.body?.name||"").trim().replace(/\\s+/g," ");
   if(name.length<2||name.length>100)return res.status(400).json({error:"Nombre requerido (2 a 100 caracteres)"});
   const changed=await sql`UPDATE agenda_companies SET name=${name},updated_at=now() WHERE id=${m.company_id}::uuid AND active=true RETURNING id::text,name,slug,timezone,active`;
   if(!changed.length)return res.status(404).json({error:"Empresa no encontrada"});
   return res.status(200).json({ok:true,company:changed[0]});
  }
  const company=(await sql`SELECT id::text,name,slug,timezone,active FROM agenda_companies WHERE id=${m.company_id}::uuid AND active=true`)[0];
  if(!company)return res.status(404).json({error:"Empresa no encontrada"});
  const totals=(await sql`SELECT (SELECT count(*)::int FROM agenda_users WHERE company_id=${m.company_id}::uuid) AS users,(SELECT count(*)::int FROM agenda_locations WHERE company_id=${m.company_id}::uuid) AS locations,(SELECT count(*)::int FROM agenda_clients WHERE company_id=${m.company_id}::uuid) AS clients`)[0];
  return res.status(200).json({ok:true,company,totals,role:m.role});
 }catch(e){console.error("EROSS QA directory",e);return res.status(500).json({error:"No se pudo consultar Neon QA"})}
}