import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {navigationForRole} from "../../../lib/agenda-role-policy";
const COOKIE="eross_identity_qa";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
 const session=verifyIdentitySession(token);
 if(!session)return res.status(401).json({error:"Sesión individual requerida"});
 try{
  const sql=getSql();
  const membership=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!membership||membership.membership_id!==session.membership||membership.role!==session.role)return res.status(403).json({error:"Membresía no autorizada"});
  const row=(await sql`SELECT c.id::text,c.name,
    (SELECT count(*)::int FROM agenda_appointments WHERE company_id=c.id) AS appointments,
    (SELECT count(*)::int FROM agenda_integration_outbox WHERE company_id=c.id) AS signals
    FROM agenda_companies c WHERE c.id=${membership.company_id}::uuid AND c.active=true`)[0];
  if(!row)return res.status(404).json({error:"Empresa no encontrada"});
  return res.status(200).json({ok:true,company:{id:row.id,name:row.name},role:membership.role,navigation:navigationForRole(membership.role),counts:{appointments:row.appointments,signals:row.signals}});
 }catch(e){console.error("tenant overview qa",e);return res.status(500).json({error:"No se pudo consultar empresa"})}
}
