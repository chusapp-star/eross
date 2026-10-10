import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";
import {roleCan} from "../../../lib/agenda-role-policy";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const token=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="))?.slice(18);
 const session=verifyIdentitySession(token);
 if(!session)return res.status(401).json({error:"Sesión individual requerida"});
 try{
  const sql=getSql();
  const m=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!m||m.membership_id!==session.membership||m.role!==session.role||!roleCan(m.role,"appointments.read"))return res.status(403).json({error:"Acceso denegado"});
  const company=(await sql`SELECT name,timezone FROM agenda_companies WHERE id=${m.company_id}::uuid AND active=true`)[0];
  const currentYear=new Date().getUTCFullYear();
  const from=String(req.query.from||`${currentYear}-01-01`),to=String(req.query.to||`${currentYear+1}-01-01`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>=to)return res.status(400).json({error:"Rango inválido"});
  const records=await sql`SELECT a.status, to_char(a.starts_at AT TIME ZONE c.timezone ,'YYYY-MM') AS month_key,
   COALESCE(u.name,'Sin asignar') responsible,COALESCE(l.name,'Sin sede') location
   FROM agenda_appointments a JOIN agenda_companies c ON c.id=a.company_id
   LEFT JOIN agenda_users u ON u.id=a.responsible_user_id AND u.company_id=a.company_id
   LEFT JOIN agenda_locations l ON l.id=a.location_id AND l.company_id=a.company_id
   WHERE a.company_id=${m.company_id}::uuid
   AND (a.starts_at AT TIME ZONE c.timezone)::date>=${from}::date
   AND (a.starts_at AT TIME ZONE c.timezone)::date<${to}::date`;
  const statuses={pending:0,confirmed:0,rescheduled:0,attended:0,no_show:0,cancelled:0};
  const byMonth={},byResponsible={},byLocation={};
  for(const r of records){statuses[r.status]=(statuses[r.status]||0)+1;byMonth[r.month_key]=(byMonth[r.month_key]||0)+1;byResponsible[r.responsible]=(byResponsible[r.responsible]||0)+1;byLocation[r.location]=(byLocation[r.location]||0)+1;}
  res.status(200).json({ok:true,company:company?.name||"Empresa",role:m.role,from,to,total:records.length,statuses,byMonth,byResponsible,byLocation});
 }catch(e){console.error("tenant management report",e);res.status(500).json({error:"No se pudo generar el reporte"})}
}