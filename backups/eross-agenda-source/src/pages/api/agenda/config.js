import {getSql,getCompanyId} from "../../../lib/agenda-db";
const dayMap={Domingo:0,Lunes:1,Martes:2,"Miércoles":3,Miercoles:3,Jueves:4,Viernes:5,"Sábado":6,Sabado:6};
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Método no permitido"});
  const sql=getSql(),companyId=getCompanyId(),body=req.body||{};
  try{
    if(body.timezone) await sql`UPDATE agenda_companies SET timezone=${String(body.timezone)},updated_at=now() WHERE id=${companyId}::uuid`;
    if(Array.isArray(body.types)) for(const t of body.types){
      await sql`INSERT INTO agenda_appointment_types(company_id,name,duration_min,modality,color,buffer_before_min,buffer_after_min,active)
                VALUES(${companyId}::uuid,${String(t.name)},${Number(t.duration||30)},${String(t.mode||"Presencial / virtual")},${String(t.color||"#C89B3C")},${Number(t.bufferBefore||0)},${Number(t.bufferAfter||0)},${t.active!==false})
                ON CONFLICT(company_id,name) DO UPDATE SET duration_min=EXCLUDED.duration_min,modality=EXCLUDED.modality,color=EXCLUDED.color,
                buffer_before_min=EXCLUDED.buffer_before_min,buffer_after_min=EXCLUDED.buffer_after_min,active=EXCLUDED.active,updated_at=now()`;
    }
    if(Array.isArray(body.days)) for(const d of body.days){
      const weekday=dayMap[d.day]; if(weekday===undefined) continue;
      await sql`INSERT INTO agenda_availability_rules(company_id,weekday,active,all_day,slots)
                VALUES(${companyId}::uuid,${weekday},${d.active!==false},${!!d.allDay},${JSON.stringify(d.slots||[])}::jsonb)
                ON CONFLICT (company_id,COALESCE(user_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(location_id,'00000000-0000-0000-0000-000000000000'::uuid),weekday)
                DO UPDATE SET active=EXCLUDED.active,all_day=EXCLUDED.all_day,slots=EXCLUDED.slots,updated_at=now()`;
    }
    return res.status(200).json({ok:true});
  }catch(error){
    console.error("agenda config",error); return res.status(500).json({error:"No se pudo guardar la configuración"});
  }
}
