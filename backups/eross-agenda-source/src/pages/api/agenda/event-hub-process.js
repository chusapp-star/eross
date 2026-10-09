import {randomUUID,timingSafeEqual} from "crypto";
import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql,getCompanyId} from "../../../lib/agenda-db";

function equal(a,b){
  const x=Buffer.from(String(a||"")),y=Buffer.from(String(b||""));
  return x.length===y.length&&x.length>0&&timingSafeEqual(x,y);
}
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
  // A Vercel cron can invoke this using Bearer CRON_SECRET; admin session may invoke manually.
  const bearer=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!(process.env.CRON_SECRET&&equal(bearer,process.env.CRON_SECRET))&&!requireAgendaAdmin(req,res))return;
  const endpoint=process.env.EROSS_CRM_EVENTS_URL;
  const token=process.env.EROSS_CRM_EVENTS_TOKEN;
  // No configured receiver: do not consume or mark events as delivered.
  if(!endpoint||!token)return res.status(503).json({error:"Receptor CRM no configurado",delivery_enabled:false});
  let target;
  try{target=new URL(endpoint)}catch{return res.status(500).json({error:"URL CRM inválida"})}
  if(target.protocol!=="https:"||target.username||target.password||target.search||target.hash)
    return res.status(500).json({error:"Receptor debe utilizar HTTPS seguro"});
  const sql=getSql(),companyId=getCompanyId();
  const lease=randomUUID();
  try{
    const claimed=await sql`
      WITH due AS (
        SELECT id FROM agenda_integration_outbox
        WHERE company_id=${companyId}::uuid AND destination='eross_crm'
          AND attempt_count<8
          AND (${process.env.EROSS_EVENT_HUB_QA_ENABLED==='true'?'qa.delivery.test':'__no_qa_override__'} = '__no_qa_override__' OR event_type='qa.delivery.test')
          AND ((delivery_status IN ('pending','retry') AND next_attempt_at<=now())
            OR (delivery_status='processing' AND leased_until<now()))
        ORDER BY next_attempt_at,created_at LIMIT 10 FOR UPDATE SKIP LOCKED
      )
      UPDATE agenda_integration_outbox o
      SET delivery_status='processing',leased_until=now()+interval '90 seconds',
          lease_token=${lease}::uuid,attempt_count=attempt_count+1,updated_at=now()
      FROM due WHERE o.id=due.id
      RETURNING o.id::text,o.event_type,o.payload,o.attempt_count`;
    let delivered=0,retries=0,failed=0;
    for(const event of claimed){
      let error="";
      try{
        const result=await fetch(target.toString(),{
          method:"POST",
          headers:{"content-type":"application/json","authorization":"Bearer "+token,
            "idempotency-key":String(event.payload?.event_id||event.id),
            ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET?{"x-vercel-protection-bypass":process.env.VERCEL_AUTOMATION_BYPASS_SECRET}:{})},
          body:JSON.stringify({id:event.payload?.event_id||event.id,type:event.event_type,
            company_id:companyId,occurred_at:event.payload?.occurred_at||null,data:event.payload}),
          signal:AbortSignal.timeout(12000),redirect:"error"
        });
        if(!result.ok)throw new Error("CRM HTTP "+result.status);
        await sql`UPDATE agenda_integration_outbox SET delivery_status='delivered',delivered_at=now(),
          leased_until=NULL,lease_token=NULL,last_error=NULL,updated_at=now()
          WHERE id=${event.id}::uuid AND lease_token=${lease}::uuid`;
        delivered++;continue;
      }catch(e){error=String(e.message||"Error de entrega").slice(0,240)}
      const final=event.attempt_count>=8;
      const delay=Math.min(3600,Math.pow(2,Math.min(event.attempt_count,10))*30);
      await sql`UPDATE agenda_integration_outbox SET
        delivery_status=${final?"failed":"retry"},
        next_attempt_at=now()+make_interval(secs=>${delay}),
        leased_until=NULL,lease_token=NULL,last_error=${error},updated_at=now()
        WHERE id=${event.id}::uuid AND lease_token=${lease}::uuid`;
      if(final)failed++;else retries++;
    }
    return res.status(200).json({ok:true,claimed:claimed.length,delivered,retries,failed});
  }catch(e){
    console.error("EROSS Event Hub worker",e);
    return res.status(500).json({error:"No se pudo procesar cola"});
  }
}
