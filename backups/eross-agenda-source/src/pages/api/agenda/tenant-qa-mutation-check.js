import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {sameOrigin} from "../../../lib/agenda-auth";
const COOKIE="eross_identity_qa";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=new Set(["confirmed","cancelled","rescheduled","pending","attended","no_show"]);
// Safe authorization dry run: never updates an appointment, client or outbox row.
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")
  return res.status(404).json({error:"No disponible"});
 if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
 if(!sameOrigin(req))return res.status(403).json({error:"Origen no autorizado"});
 const {id,status,action}=req.body||{};
 if(!UUID.test(String(id||""))||!allowed.has(String(status||""))||!["edit","change_status"].includes(action))
  return res.status(400).json({error:"Solicitud de prueba inválida"});
 const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
 const session=verifyIdentitySession(token);
 if(!session)return res.status(401).json({error:"Sesión individual requerida"});
 try{
  const sql=getSql();
  const membership=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant,roles:["admin","supervisor"]});
  if(!membership||membership.membership_id!==session.membership||membership.role!==session.role)
   return res.status(403).json({error:"Acción no autorizada"});
  const own=await sql`SELECT id::text FROM agenda_appointments WHERE id=${id}::uuid AND company_id=${membership.company_id}::uuid LIMIT 1`;
  if(!own.length)return res.status(404).json({error:"Cita no encontrada"});
  return res.status(200).json({ok:true,authorized:true,simulated:true,no_data_changed:true,action});
 }catch(e){console.error("tenant mutation dry run",e);return res.status(500).json({error:"Error de verificación"})}
}
