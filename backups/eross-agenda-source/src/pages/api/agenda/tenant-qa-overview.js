import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
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
  const company=await sql`SELECT id::text,name FROM agenda_companies WHERE id=${membership.company_id}::uuid AND active=true`;
  const totals=await sql`SELECT count(*)::int AS appointments FROM agenda_appointments WHERE company_id=${membership.company_id}::uuid`;
  const signals=await sql`SELECT count(*)::int AS signals FROM agenda_integration_outbox WHERE company_id=${membership.company_id}::uuid`;
  return res.status(200).json({ok:true,company:company[0],role:membership.role,counts:{appointments:totals[0]?.appointments||0,signals:signals[0]?.signals||0}});
 }catch(e){console.error("tenant overview qa",e);return res.status(500).json({error:"No se pudo consultar empresa"})}
}
