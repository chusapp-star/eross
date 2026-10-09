import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql,getCompanyId} from "../../../lib/agenda-db";

// Read-only dashboard for the EROSS Event Hub, scoped to the project tenant.
export default async function handler(req,res){
  if(!requireAgendaAdmin(req,res))return;
  if(req.method!=="GET")return res.status(405).json({error:"Método no permitido"});
  try{
    const sql=getSql(),companyId=getCompanyId();
    const summary=await sql`
      SELECT delivery_status,count(*)::int AS total FROM agenda_integration_outbox
      WHERE company_id=${companyId}::uuid AND destination='eross_crm'
      GROUP BY delivery_status ORDER BY delivery_status`;
    const latest=await sql`
      SELECT id::text,event_type,delivery_status,attempt_count,created_at,
             next_attempt_at,delivered_at,last_error,destination
      FROM agenda_integration_outbox
      WHERE company_id=${companyId}::uuid AND destination='eross_crm'
      ORDER BY created_at DESC LIMIT 30`;
    const alerts=await sql`
      SELECT
        count(*) FILTER (WHERE delivery_status='failed')::int AS failed,
        count(*) FILTER (WHERE delivery_status='retry')::int AS retry,
        count(*) FILTER (WHERE delivery_status IN ('pending','retry') AND created_at < now()-interval '24 hours')::int AS overdue,
        count(*) FILTER (WHERE delivery_status='processing' AND leased_until < now())::int AS stuck,
        count(*) FILTER (WHERE delivery_status IN ('pending','retry','processing'))::int AS open_total
      FROM agenda_integration_outbox
      WHERE company_id=${companyId}::uuid AND destination='eross_crm'`;
    const a=alerts[0]||{};
    const notices=[];
    if(a.failed>0)notices.push({level:"critical",code:"failed",count:a.failed,message:"Hay entregas fallidas que requieren intervención"});
    if(a.stuck>0)notices.push({level:"critical",code:"stuck",count:a.stuck,message:"Hay procesos cuyo tiempo de ejecución expiró"});
    if(a.overdue>0)notices.push({level:"warning",code:"overdue",count:a.overdue,message:"Señales sin entregar desde hace más de 24 horas"});
    if(a.retry>0)notices.push({level:"warning",code:"retry",count:a.retry,message:"Hay entregas esperando un reintento"});
    if(a.open_total>=50)notices.push({level:"warning",code:"backlog",count:a.open_total,message:"La cola acumuló 50 o más eventos"});
    return res.status(200).json({ok:true,summary,latest,alerts:{...a,notices},delivery_enabled:false});
  }catch(error){
    console.error("event hub status",error);
    return res.status(500).json({error:"No se pudo consultar Event Hub"});
  }
}
