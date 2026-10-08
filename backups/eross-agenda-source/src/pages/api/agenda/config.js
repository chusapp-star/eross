import {getSql,getCompanyId} from "../../../lib/agenda-db";
const dayMap={Domingo:0,Lunes:1,Martes:2,"Miércoles":3,Miercoles:3,Jueves:4,Viernes:5,"Sábado":6,Sabado:6};
export default async function handler(req,res){
  if(req.method!=="POST" && req.method!=="GET") {
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({error:"Método no permitido"});
  }
  try{
    const sql=getSql(),companyId=getCompanyId();
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
    const body=req.body||{};
    if(body.timezone) await sql`UPDATE agenda_companies SET timezone=${String(body.timezone)},updated_at=now() WHERE id=${companyId}::uuid`;
    if(Array.isArray(body.types)) for(const t of body.types){
      const name=String(t.name||"").trim();
      const duration=Number(t.duration);
      const before=Number(t.bufferBefore||0),after=Number(t.bufferAfter||0);
      if(!name || !Number.isInteger(duration) || duration<1 || duration>1440
          || !Number.isInteger(before) || before<0 || before>1440
          || !Number.isInteger(after) || after<0 || after>1440)
        return res.status(400).json({error:"Datos de tipo de cita inválidos"});
      const modality=String(t.mode||"Presencial / virtual");
      const color=String(t.color||"#C89B3C");
      const active=t.active!==false;
      if(typeof t.id==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t.id)){
        const updated=await sql`UPDATE agenda_appointment_types SET name=${name},duration_min=${duration},
          modality=${modality},color=${color},buffer_before_min=${before},
          buffer_after_min=${after},active=${active},updated_at=now()
          WHERE id=${t.id}::uuid AND company_id=${companyId}::uuid RETURNING id`;
        if(!updated.length)return res.status(404).json({error:"Tipo de cita no encontrado en esta empresa"});
      }else{
        await sql`INSERT INTO agenda_appointment_types(company_id,name,duration_min,modality,color,buffer_before_min,buffer_after_min,active)
          VALUES(${companyId}::uuid,${name},${duration},${modality},${color},${before},${after},${active})
          ON CONFLICT(company_id,name) DO UPDATE SET duration_min=EXCLUDED.duration_min,modality=EXCLUDED.modality,
          color=EXCLUDED.color,buffer_before_min=EXCLUDED.buffer_before_min,buffer_after_min=EXCLUDED.buffer_after_min,
          active=EXCLUDED.active,updated_at=now()`;
      }
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
