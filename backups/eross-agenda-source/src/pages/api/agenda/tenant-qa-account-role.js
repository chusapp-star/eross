import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
const ROLES=new Set(["admin","supervisor","collaborator"]);
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const origin=req.headers.origin,host=req.headers.host;
 if(!origin||!host||new URL(origin).host!==host)return res.status(403).json({error:"Origen no autorizado"});
 const raw=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="));
 const session=verifyIdentitySession(raw?.slice("eross_identity_qa=".length));
 if(!session)return res.status(401).json({error:"Sesión requerida"});
 const targetId=req.body?.membershipId,role=req.body?.role;
 if(!ROLES.has(role)||!/^[-0-9a-f]{36}$/i.test(String(targetId||"")))return res.status(400).json({error:"Solicitud inválida"});
 try{
  const sql=getSql(),actor=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!actor||actor.membership_id!==session.membership||actor.role!==session.role||!roleCan(actor.role,"users.manage"))return res.status(403).json({error:"Solo un administrador autorizado puede cambiar roles"});
  // One SQL statement ensures the update and audit record commit together.
  const result=await sql`
   WITH eligible AS (
    SELECT target.id,target.company_id,target.role AS old_role
    FROM eross_company_memberships target
    WHERE target.id=${targetId}::uuid AND target.company_id=${actor.company_id}::uuid
      AND target.active=true AND target.identity_id<>${session.sub}::uuid AND target.role<>${role}
      AND (target.role<>'admin' OR (SELECT count(*) FROM eross_company_memberships keep WHERE keep.company_id=target.company_id AND keep.active=true AND keep.role='admin')>1)
   ), changed AS (
    UPDATE eross_company_memberships target SET role=${role}
    FROM eligible e WHERE target.id=e.id AND target.company_id=e.company_id
    RETURNING target.id,target.company_id
   ), audited AS (
    INSERT INTO eross_membership_role_audit_qa(company_id,membership_id,actor_identity_id,old_role,new_role)
    SELECT e.company_id,e.id,${session.sub}::uuid,e.old_role,${role} FROM eligible e JOIN changed c ON c.id=e.id
    RETURNING id
   ) SELECT count(*)::int AS changes FROM audited`;
  if(!result[0]?.changes)return res.status(409).json({error:"No se aplicó el cambio. Verificá la cuenta, su estado o la protección de administradores"});
  return res.status(200).json({ok:true,role});
 }catch(e){console.error("QA membership role update",e);return res.status(500).json({error:"No se pudo guardar el rol"})}
}