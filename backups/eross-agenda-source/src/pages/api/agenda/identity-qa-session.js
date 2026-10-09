import {createHash} from "node:crypto";
import {getSql} from "../../../lib/agenda-db";
import {hashIdentityPassword,verifyIdentityPassword,signIdentitySession,verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {sameOrigin} from "../../../lib/agenda-auth";
const COOKIE="eross_identity_qa";
const isQA=()=>process.env.EROSS_MULTIEMPRESA_QA_ENABLED==="true"&&process.env.EROSS_EVENT_HUB_QA_ENABLED==="true";
const getCookie=req=>String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="))?.slice(COOKIE.length+1)||"";
const setCookie=(res,token,maxAge)=>res.setHeader("Set-Cookie",COOKIE+"="+token+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+maxAge);
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!isQA())return res.status(404).json({error:"No disponible"});
 if(!["GET","POST","DELETE"].includes(req.method))return res.status(405).json({error:"Método no permitido"});
 if(req.method==="GET"){
  const s=verifyIdentitySession(getCookie(req));
  if(!s)return res.status(200).json({authenticated:false});
  try{const m=await resolveTenantMembership(getSql(),{identityId:s.sub,companyId:s.tenant});
   if(!m||m.membership_id!==s.membership||m.role!==s.role)return res.status(200).json({authenticated:false});
   return res.status(200).json({authenticated:true,identity_id:s.sub,company_id:s.tenant,role:s.role});
  }catch{return res.status(500).json({error:"Verificación no disponible"})}
 }
 if(!sameOrigin(req))return res.status(403).json({error:"Origen no autorizado"});
 if(req.method==="DELETE"){setCookie(res,"",0);return res.status(200).json({ok:true})}
 const email=String(req.body?.email||"").trim().toLowerCase(), password=req.body?.password,companyId=req.body?.company_id;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=="string"||password.length>256||typeof companyId!=="string")
  return res.status(400).json({error:"Datos inválidos"});
 const sql=getSql();
 try{
  const rows=await sql`SELECT i.id::text,cr.password_hash,cr.password_salt,cr.password_algorithm,cr.login_disabled
    FROM eross_identities i JOIN eross_identity_credentials cr ON cr.identity_id=i.id
    WHERE lower(i.email)=${email} AND i.active=true LIMIT 1`;
  const u=rows[0];const good=u&&verifyIdentityPassword(password,u);
  const m=good?await resolveTenantMembership(sql,{identityId:u.id,companyId}):null;
  const success=Boolean(m);
  await sql`INSERT INTO eross_identity_login_audit(identity_id,email_fingerprint,success,failure_reason)
   VALUES (${u?.id||null}::uuid,${createHash("sha256").update(email).digest("hex")},${success},${success?null:"credentials_or_membership"})`;
  if(!success)return res.status(401).json({error:"Credenciales o acceso a empresa inválidos"});
  setCookie(res,signIdentitySession({identityId:u.id,companyId:m.company_id,membershipId:m.membership_id,role:m.role}),28800);
  return res.status(200).json({ok:true,company_id:m.company_id,role:m.role});
 }catch(e){console.error("QA identity login",e);return res.status(500).json({error:"No se pudo iniciar sesión"})}
}
