import {createHmac,timingSafeEqual} from "node:crypto";

const COOKIE="eross_agenda_session";
const MAX_AGE=8*60*60;
const password=()=>process.env.AGENDA_ADMIN_PASSWORD||"";
const signingKey=()=>createHmac("sha256",password()).update("eross-agenda-cookie-v1").digest();
const sign=value=>createHmac("sha256",signingKey()).update(value).digest("base64url");
const safeEq=(a,b)=>{
  const x=Buffer.from(String(a)),y=Buffer.from(String(b));
  return x.length===y.length&&timingSafeEqual(x,y);
};
function parseCookie(req){
  const parts=String(req.headers.cookie||"").split(";");
  const v=parts.find(x=>x.trim().startsWith(COOKIE+"="));
  return v?decodeURIComponent(v.trim().slice(COOKIE.length+1)):"";
}
export function sessionValid(req){
  if(!password())return false;
  const token=parseCookie(req),i=token.lastIndexOf(".");
  if(i<1)return false;
  const body=token.slice(0,i),sig=token.slice(i+1);
  if(!safeEq(sig,sign(body)))return false;
  try{
    const data=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    return data.v===1&&data.role==="admin"&&Number.isInteger(data.exp)&&data.exp>Date.now();
  }catch{return false;}
}
export function validAdminPassword(candidate){
  if(!password()||typeof candidate!=="string")return false;
  // Hash both inputs to avoid length-dependent comparisons.
  const x=createHmac("sha256","eross-agenda-password-compare").update(candidate).digest();
  const y=createHmac("sha256","eross-agenda-password-compare").update(password()).digest();
  return timingSafeEqual(x,y);
}
export function issueSession(res){
  const payload=Buffer.from(JSON.stringify({v:1,role:"admin",exp:Date.now()+MAX_AGE*1000})).toString("base64url");
  res.setHeader("Set-Cookie",COOKIE+"="+payload+"."+sign(payload)+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+MAX_AGE);
}
export function clearSession(res){res.setHeader("Set-Cookie",COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");}
export function sameOrigin(req){
  if(["GET","HEAD","OPTIONS"].includes(req.method))return true;
  const origin=req.headers.origin;
  if(!origin)return false;
  try{const u=new URL(origin);return u.protocol==="https:"&&u.host===req.headers.host;}catch{return false;}
}
export function requireAgendaAdmin(req,res){
  res.setHeader("Cache-Control","no-store");
  if(!sessionValid(req)){res.status(401).json({error:"Sesión requerida"});return false;}
  if(!sameOrigin(req)){res.status(403).json({error:"Origen no autorizado"});return false;}
  return true;
}
