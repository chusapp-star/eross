import {sessionValid,sameOrigin} from "./agenda-auth";
import {getCompanyId,getSql} from "./agenda-db";
import {verifyIdentitySession} from "./agenda-identity-auth";
import {resolveTenantMembership} from "./agenda-tenant";
import {roleCan} from "./agenda-role-policy";
const COOKIE="eross_identity_qa";
export async function authorizeAgendaWrite(req,res,{action="appointments.edit"}={}){
 res.setHeader("Cache-Control","no-store");
 if(!sameOrigin(req)){res.status(403).json({error:"Origen no autorizado"});return null}
 const sql=getSql();
 // QA tenant session takes precedence over the legacy admin session.
 const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
 if(token && process.env.EROSS_MULTIEMPRESA_QA_ENABLED==="true"&&process.env.EROSS_EVENT_HUB_QA_ENABLED==="true"){
  const session=verifyIdentitySession(token);
  if(!session){res.status(401).json({error:"Sesión individual inválida"});return null}
  const membership=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!membership||membership.membership_id!==session.membership||membership.role!==session.role){
    res.status(403).json({error:"Permisos de empresa insuficientes"});return null;
  }
  if(!roleCan(membership.role,action)){res.status(403).json({error:"Permiso insuficiente"});return null;}
  return {sql,companyId:membership.company_id,role:membership.role,mode:"tenant"};
 }
 if(sessionValid(req)){
  if(!roleCan("admin",action)){res.status(403).json({error:"Permiso insuficiente"});return null;}
  return {sql,companyId:getCompanyId(),role:"admin",mode:"legacy"};
 }
 res.status(401).json({error:"Sesión requerida"});return null;
}
