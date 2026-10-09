import {timingSafeEqual} from "crypto";
import {getSql,getCompanyId} from "../../../lib/agenda-db";
function safeEqual(a,b){const x=Buffer.from(String(a||"")),y=Buffer.from(String(b||""));return x.length>0&&x.length===y.length&&timingSafeEqual(x,y)}
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
  // TEST ONLY; never accept external events unless explicitly enabled on QA.
  if(process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
  const auth=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!process.env.EROSS_CRM_EVENTS_TOKEN||!safeEqual(auth,process.env.EROSS_CRM_EVENTS_TOKEN))
    return res.status(401).json({error:"No autorizado"});
  const {id,type,company_id,data}=req.body||{};
  if(!/^[a-f0-9-]{36}$/i.test(String(id||""))||type!=="qa.delivery.test"||company_id!==getCompanyId())
    return res.status(400).json({error:"Evento de QA inválido"});
  if(data?.qa!==true||data?.event_id!==id)return res.status(400).json({error:"Carga de QA inválida"});
  try{
    const sql=getSql();
    const received=await sql`
      INSERT INTO eross_crm_qa_received(event_id,company_id,event_type,payload)
      VALUES(${id}::uuid,${company_id}::uuid,${type},${JSON.stringify(data)}::jsonb)
      ON CONFLICT(event_id) DO NOTHING RETURNING event_id`;
    return res.status(200).json({ok:true,received:received.length===1,duplicate:received.length===0});
  }catch(e){console.error("qa crm receive",e);return res.status(500).json({error:"No se pudo registrar evento"})}
}
