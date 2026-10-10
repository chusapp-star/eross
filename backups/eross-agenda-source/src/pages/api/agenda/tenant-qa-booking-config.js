import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
const intervals=new Set([15,20,30,60]),notices=new Set([0,60,120,360,1440]);
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="PATCH")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const origin=req.headers.origin,host=req.headers.host;
 if(!origin||!host||new URL(origin).host!==host)return res.status(403).json({error:"Origen no autorizado"});
 const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="));
 const session=verifyIdentitySession(cookie?.slice("eross_identity_qa=".length));
 if(!session)return res.status(401).json({error:"Sesión requerida"});
 const interval=Number(req.body?.slotStep),notice=Number(req.body?.notice);
 if(!intervals.has(interval)||!notices.has(notice))return res.status(400).json({error:"Intervalo o anticipación inválidos"});
 try{
  const sql=getSql(),m=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!m||m.membership_id!==session.membership||m.role!==session.role||!roleCan(m.role,"companies.manage"))return res.status(403).json({error:"Permiso de administración requerido"});
  const rows=await sql`INSERT INTO agenda_booking_settings(company_id,slot_interval_min,min_notice_min) VALUES(${m.company_id}::uuid,${interval},${notice}) ON CONFLICT(company_id) DO UPDATE SET slot_interval_min=EXCLUDED.slot_interval_min,min_notice_min=EXCLUDED.min_notice_min,updated_at=now() RETURNING slot_interval_min,min_notice_min`;
  return res.status(200).json({ok:true,booking:rows[0]});
 }catch(e){console.error("QA booking configuration",e);return res.status(500).json({error:"No se pudo guardar la configuración"})}
}