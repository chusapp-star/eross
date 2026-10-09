import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql,getCompanyId} from "../../../lib/agenda-db";

// QA ONLY: simulate CRM delivery inside one isolated Neon database.
// Real CRM will use an independently authenticated HTTPS receiver.
export default async function handler(req,res){
  if(!requireAgendaAdmin(req,res))return;
  if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
  if(process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")
    return res.status(403).json({error:"Simulador QA desactivado"});
  const sql=getSql(),companyId=getCompanyId();
  try{
    const result=await sql`
      WITH eligible AS (
       SELECT id,event_type,payload FROM agenda_integration_outbox
       WHERE company_id=${companyId}::uuid AND destination='eross_crm' AND delivery_status IN ('pending','retry')
         AND (payload->>'event_id') IS NOT NULL
       ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED
      ), received AS (
       INSERT INTO eross_crm_qa_received(event_id,company_id,event_type,payload)
       SELECT (payload->>'event_id')::uuid,${companyId}::uuid,event_type,payload FROM eligible
       ON CONFLICT (event_id) DO NOTHING RETURNING event_id
      ), acknowledged AS (
       UPDATE agenda_integration_outbox o SET delivery_status='delivered',delivered_at=now(),updated_at=now(),
        last_error=NULL,attempt_count=attempt_count+1
       WHERE o.id IN (SELECT e.id FROM eligible e)
         AND EXISTS(SELECT 1 FROM eross_crm_qa_received r WHERE r.event_id=(o.payload->>'event_id')::uuid)
       RETURNING o.id
      )
      SELECT (SELECT count(*)::int FROM eligible) AS selected,
             (SELECT count(*)::int FROM received) AS newly_received,
             (SELECT count(*)::int FROM acknowledged) AS acknowledged`;
    return res.status(200).json({ok:true,mode:"qa_same_database_simulation",...result[0]});
  }catch(e){console.error("qa receiver",e);return res.status(500).json({error:"Fallo del simulador QA"})}
}
