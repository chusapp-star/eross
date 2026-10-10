import {authorizeAgendaWrite} from '../../../lib/agenda-write-auth';
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(req.query.id)))return res.status(400).json({error:'Identificador inválido'});
 try{const auth=await authorizeAgendaWrite(req,res,{action:'appointments.read'});if(!auth)return;
 const {sql,companyId}=auth;
 const own=await sql`SELECT id FROM agenda_appointments WHERE id=${req.query.id}::uuid AND company_id=${companyId}::uuid`;
 if(!own.length)return res.status(404).json({error:'Cita no encontrada'});
 const events=await sql`SELECT id::text,event_type,created_at,payload FROM agenda_appointment_events WHERE company_id=${companyId}::uuid AND appointment_id=${req.query.id}::uuid ORDER BY created_at DESC LIMIT 100`;
 return res.status(200).json({ok:true,events});
 }catch(e){console.error('agenda history',e);return res.status(500).json({error:'No se pudo cargar el historial'})}
}
