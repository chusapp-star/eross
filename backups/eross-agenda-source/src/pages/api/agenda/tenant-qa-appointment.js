import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
const COOKIE="eross_identity_qa";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Read-only IDOR probe. No client PII is returned.
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 const appointmentId=String(req.query?.id||"");
 if(!UUID.test(appointmentId))return res.status(400).json({error:"Identificador inválido"});
 const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
 const session=verifyIdentitySession(token);
 if(!session)return res.status(401).json({error:"Sesión individual requerida"});
 try{
  const sql=getSql(),m=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!m||m.membership_id!==session.membership||m.role!==session.role)return res.status(403).json({error:"Acceso no autorizado"});
  const rows=await sql`SELECT id::text,status FROM agenda_appointments WHERE id=${appointmentId}::uuid AND company_id=${m.company_id}::uuid LIMIT 1`;
  if(!rows.length)return res.status(404).json({error:"Cita no encontrada"});
  return res.status(200).json({ok:true,appointment:rows[0]});
 }catch(e){console.error("tenant appointment probe",e);return res.status(500).json({error:"Error al verificar cita"})}
}
