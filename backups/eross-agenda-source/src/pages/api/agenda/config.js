import {authorizeAgendaWrite} from "../../../lib/agenda-write-auth";
import {getSql,getCompanyId} from "../../../lib/agenda-db";
const dayMap={Domingo:0,Lunes:1,Martes:2,"Miércoles":3,Miercoles:3,Jueves:4,Viernes:5,"Sábado":6,Sabado:6};
export default async function handler(req,res){
  const auth=await authorizeAgendaWrite(req,res,{action:"companies.manage"});
  if(!auth)return;
  if(req.method!=="POST" && req.method!=="GET") {
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({error:"Método no permitido"});
  }
  try{
    const {sql,companyId}=auth;
    if(req.method==="GET"){
      res.setHeader("Cache-Control","no-store");
      const [companies,types,availability]=await Promise.all([
        sql`SELECT id::text,timezone FROM agenda_companies WHERE id=${companyId}::uuid AND active=true`,
        sql`SELECT id::text,name,duration_min,modality,color,buffer_before_min,buffer_after_min,active FROM agenda_appointment_types WHERE company_id=${companyId}::uuid ORDER BY created_at`,
        sql`SELECT id::text,weekday,active,all_day,slots,user_id::text,location_id::text FROM agenda_availability_rules WHERE company_id=${companyId}::uuid ORDER BY weekday`
      ]);
      if(!companies.length)return res.status(404).json({error:"Empresa no encontrada"});
      const names=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
      return res.status(200).json({
        ok:true,
        timezone:companies[0].timezone,
        types:types.map(t=>({
          id:t.id,name:t.name,duration:Number(t.duration_min),mode:t.modality,color:t.color,
          bufferBefore:Number(t.buffer_before_min),bufferAfter:Number(t.buffer_after_min),active:t.active
        })),
        days:availability.map(d=>({
          id:d.id,day:names[Number(d.weekday)],weekday:Number(d.weekday),active:d.active,
          allDay:d.all_day,slots:d.slots||[],user_id:d.user_id,location_id:d.location_id
        }))
      });
    }
    const body=req.body||{},queries=[];
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if(body.timezone){try{new Intl.DateTimeFormat("en",{timeZone:body.timezone}).format()}catch{return res.status(400).json({error:"Zona horaria inválida"})}}
    const types=body.types||[],days=body.days||[];
    if(!Array.isArray(types)||!Array.isArray(days)||types.length>100||days.length>7)return res.status(400).json({error:"Configuración inválida"});
    for(const t of types){
      if(!String(t.name||"").trim()||String(t.name).length>100||![t.duration,t.bufferBefore??0,t.bufferAfter??0].every(v=>Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=1440)||Number(t.duration)<1||!/^#[0-9a-f]{6}$/i.test(t.color||"#C89B3C"))return res.status(400).json({error:"Datos de tipo de cita inválidos"});
      if(t.id){
        if(!uuid.test(t.id))return res.status(400).json({error:"Identificador inválido"});
        const owned=await sql`SELECT id FROM agenda_appointment_types WHERE id=${t.id}::uuid AND company_id=${companyId}::uuid`;
        if(!owned.length)return res.status(404).json({error:"Tipo de cita no encontrado en esta empresa"});
      }
    }
    const used=new Set();
    for(const d of days){
      const n=dayMap[d.day];
      if(n===undefined||used.has(n)||!Array.isArray(d.slots)||d.slots.length>12)return res.status(400).json({error:"Días o franjas inválidos"});used.add(n);
      for(const slot of d.slots)if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end)||slot.start===slot.end)return res.status(400).json({error:"Horas inválidas; usá Todo el día para 24 horas"});
    }
    if(body.timezone)queries.push(sql`UPDATE agenda_companies SET timezone=${body.timezone},updated_at=now() WHERE id=${companyId}::uuid`);
    for(const t of types){
      if(t.id)queries.push(sql`UPDATE agenda_appointment_types SET name=${t.name.trim()},duration_min=${Number(t.duration)},modality=${t.mode||"Presencial"},color=${t.color||"#C89B3C"},buffer_before_min=${Number(t.bufferBefore||0)},buffer_after_min=${Number(t.bufferAfter||0)},active=${t.active!==false},updated_at=now() WHERE id=${t.id}::uuid AND company_id=${companyId}::uuid`);
      else queries.push(sql`INSERT INTO agenda_appointment_types(company_id,name,duration_min,modality,color,buffer_before_min,buffer_after_min,active) VALUES(${companyId}::uuid,${t.name.trim()},${Number(t.duration)},${t.mode||"Presencial"},${t.color||"#C89B3C"},${Number(t.bufferBefore||0)},${Number(t.bufferAfter||0)},${t.active!==false}) ON CONFLICT(company_id,name) DO UPDATE SET duration_min=excluded.duration_min,modality=excluded.modality,color=excluded.color,buffer_before_min=excluded.buffer_before_min,buffer_after_min=excluded.buffer_after_min,active=excluded.active,updated_at=now()`);
    }
    for(const d of days)queries.push(sql`INSERT INTO agenda_availability_rules(company_id,weekday,active,all_day,slots) VALUES(${companyId}::uuid,${dayMap[d.day]},${d.active!==false},${!!d.allDay},${JSON.stringify(d.slots)}::jsonb) ON CONFLICT (company_id,COALESCE(user_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(location_id,'00000000-0000-0000-0000-000000000000'::uuid),weekday) DO UPDATE SET active=excluded.active,all_day=excluded.all_day,slots=excluded.slots,updated_at=now()`);
    if(queries.length)await sql.transaction(queries);
    return res.status(200).json({ok:true});
  }catch(error){
    console.error("agenda config",error); return res.status(500).json({error:"No se pudo guardar la configuración"});
  }
}
