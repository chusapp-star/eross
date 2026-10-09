// Future per-user authentication primitives. Not connected to legacy admin access.
// Passwords never go into membership records and sessions require a separate secret.
import {randomBytes,scryptSync,timingSafeEqual,createHmac} from "node:crypto";
const FORMAT="scrypt-v1",MAX_AGE_MS=8*60*60*1000;
export function hashIdentityPassword(password){
 if(typeof password!=="string"||password.length<12||password.length>256)throw new Error("Contraseña inválida");
 const salt=randomBytes(24).toString("base64url");
 return {password_hash:scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024}).toString("base64url"),password_salt:salt,password_algorithm:FORMAT};
}
export function verifyIdentityPassword(password,credential){
 if(typeof password!=="string"||password.length>256||!credential||credential.password_algorithm!==FORMAT||credential.login_disabled)return false;
 try{
  const expected=Buffer.from(credential.password_hash,"base64url");
  if(expected.length!==64)return false;
  const actual=scryptSync(password,credential.password_salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
  return timingSafeEqual(actual,expected);
 }catch{return false}
}
function key(){
 const s=process.env.EROSS_IDENTITY_SESSION_SECRET||"";
 if(s.length<48)throw new Error("User sessions not configured");
 return s;
}
export function signIdentitySession({identityId,companyId,role,membershipId}){
 if(!identityId||!companyId||!membershipId||!["admin","supervisor","collaborator"].includes(role))throw new Error("Invalid identity context");
 const body=Buffer.from(JSON.stringify({v:1,sub:identityId,tenant:companyId,membership:membershipId,role,exp:Date.now()+MAX_AGE_MS})).toString("base64url");
 const sig=createHmac("sha256",key()).update(body).digest("base64url");
 return body+"."+sig;
}
export function verifyIdentitySession(token){
 try{
  const [body,sig,extra]=String(token||"").split(".");
  if(!body||!sig||extra)return null;
  const expected=createHmac("sha256",key()).update(body).digest("base64url");
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b))return null;
  const obj=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
  if(obj.v!==1||!obj.sub||!obj.tenant||!obj.membership||!["admin","supervisor","collaborator"].includes(obj.role)||!Number.isSafeInteger(obj.exp)||obj.exp<=Date.now())return null;
  return obj;
 }catch{return null}
}
