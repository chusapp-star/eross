import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql,getCompanyId} from "../../../lib/agenda-db";

const VALID_INTERVALS=new Set([15,20,30,60]);
const VALID_NOTICES=new Set([0,60,120,360,1440]);

export default async function handler(req,res){
  if(!requireAgendaAdmin(req,res))return;
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET"&&req.method!=="POST"){
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({error:"Método no permitido"});
  }
  try{
    const sql=getSql(),companyId=getCompanyId();
    if(req.method==="GET"){
      const rows=await sql`SELECT slot_interval_min,min_notice_min
        FROM agenda_booking_settings WHERE company_id=${companyId}::uuid`;
      return res.status(200).json({ok:true,slotStep:rows[0]?.slot_interval_min??30,
        notice:rows[0]?.min_notice_min??120});
    }
    const slotStep=Number(req.body?.slotStep),notice=Number(req.body?.notice);
    if(!VALID_INTERVALS.has(slotStep)||!VALID_NOTICES.has(notice))
      return res.status(400).json({error:"Intervalo o anticipación inválidos"});
    await sql`INSERT INTO agenda_booking_settings(company_id,slot_interval_min,min_notice_min)
      VALUES(${companyId}::uuid,${slotStep},${notice})
      ON CONFLICT(company_id) DO UPDATE SET slot_interval_min=EXCLUDED.slot_interval_min,
        min_notice_min=EXCLUDED.min_notice_min,updated_at=now()`;
    return res.status(200).json({ok:true,slotStep,notice});
  }catch(error){
    console.error("agenda booking settings",error);
    return res.status(500).json({error:"No se pudo acceder a las reglas de reserva"});
  }
}
