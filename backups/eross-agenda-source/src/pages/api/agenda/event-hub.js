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
    return res.status(200).json({ok:true,summary,latest,delivery_enabled:false});
  }catch(error){
    console.error("event hub status",error);
    return res.status(500).json({error:"No se pudo consultar Event Hub"});
  }
}
