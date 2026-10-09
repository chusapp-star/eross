import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql,getCompanyId} from "../../../lib/agenda-db";

const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""));
const validTime=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||""));
const validUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||""));

export default async function handler(req,res){
  if(!requireAgendaAdmin(req,res))return;
  res.setHeader("Cache-Control","no-store");
  if(!["GET","POST","DELETE"].includes(req.method)){
    res.setHeader("Allow","GET, POST, DELETE");
    return res.status(405).json({error:"Método no permitido"});
  }
  try{
    const sql=getSql(),companyId=getCompanyId();
    if(req.method==="GET"){
      const rows=await sql`SELECT b.id::text,
        to_char(b.starts_at AT TIME ZONE c.timezone,'YYYY-MM-DD') date,
        to_char(b.starts_at AT TIME ZONE c.timezone,'HH24:MI') "from",
        to_char(b.ends_at AT TIME ZONE c.timezone,'HH24:MI') "to",
        to_char(b.ends_at AT TIME ZONE c.timezone,'YYYY-MM-DD') end_date,
        b.reason FROM agenda_blocks b JOIN agenda_companies c ON c.id=b.company_id
        WHERE b.company_id=${companyId}::uuid ORDER BY b.starts_at`;
      return res.status(200).json({ok:true,blocks:rows});
    }
    if(req.method==="DELETE"){
      const id=req.body?.id;
      if(!validUuid(id))return res.status(400).json({error:"Bloqueo inválido"});
      const result=await sql`DELETE FROM agenda_blocks WHERE id=${id}::uuid
        AND company_id=${companyId}::uuid RETURNING id::text`;
      if(!result.length)return res.status(404).json({error:"Bloqueo no encontrado"});
      return res.status(200).json({ok:true});
    }
    const {date,from,to,reason}=req.body||{};
    if(!validDate(date)||!validTime(from)||!validTime(to)||!String(reason||"").trim()||from===to)
      return res.status(400).json({error:"Revisá fecha, horas y motivo del bloqueo"});
    if(String(reason).trim().length>250)return res.status(400).json({error:"Motivo demasiado largo"});
    const endDate=to<from?await sql`SELECT to_char(${date}::date+1,'YYYY-MM-DD') date`:null;
    const ending=endDate?endDate[0].date:date;
    // Evitar crear un bloqueo global que invalide citas ya confirmadas o pendientes.
    const conflicts=await sql`SELECT a.id::text FROM agenda_appointments a
      JOIN agenda_companies c ON c.id=a.company_id
      WHERE a.company_id=${companyId}::uuid AND a.status<>'cancelled'
      AND tstzrange(a.starts_at,a.ends_at,'[)') &&
        tstzrange((${date}::date+${from}::time) AT TIME ZONE c.timezone,
          (${ending}::date+${to}::time) AT TIME ZONE c.timezone,'[)')
      LIMIT 1`;
    if(conflicts.length)return res.status(409).json({
      error:"Ya existe una cita en ese horario. Reprogramala antes de bloquearlo."
    });
    const inserted=await sql`INSERT INTO agenda_blocks(company_id,starts_at,ends_at,reason)
      SELECT c.id,(${date}::date+${from}::time) AT TIME ZONE c.timezone,
        (${ending}::date+${to}::time) AT TIME ZONE c.timezone,${String(reason).trim()}
      FROM agenda_companies c WHERE c.id=${companyId}::uuid AND c.active=true
      RETURNING id::text`;
    if(!inserted.length)return res.status(404).json({error:"Empresa no encontrada"});
    return res.status(201).json({ok:true,id:inserted[0].id});
  }catch(error){
    console.error("agenda blocks",error);
    return res.status(500).json({error:"No se pudo procesar el bloqueo"});
  }
}
