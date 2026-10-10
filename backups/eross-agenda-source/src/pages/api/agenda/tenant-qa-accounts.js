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
  if(!m||m.membership_id!==session.membership||m.role!==session.role||!roleCan(m.role,"users.manage"))return res.status(403).json({error:"Acceso de administrador requerido"});
  const accounts=await sql`SELECT m.id::text AS id,i.display_name AS name,i.email,m.role,(i.active AND m.active) AS active FROM eross_company_memberships m JOIN eross_identities i ON i.id=m.identity_id WHERE m.company_id=${m.company_id}::uuid ORDER BY i.display_name LIMIT 1000`;
  return res.status(200).json({ok:true,accounts,readonly:true});
 }catch(e){console.error("QA account directory",e);return res.status(500).json({error:"No se pudieron consultar cuentas"})}
}