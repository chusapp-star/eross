import {authorizeAgendaWrite} from '../../../lib/agenda-write-auth';
import {baseTags} from '../../../lib/agenda-visual';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=='true'||process.env.EROSS_EVENT_HUB_QA_ENABLED!=='true')return res.status(404).json({error:'No disponible'});
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Método no permitido'});
 try{
  const auth=await authorizeAgendaWrite(req,res,{action:req.method==='GET'?'appointments.read':'companies.manage'});if(!auth)return;
  const {sql,companyId}=auth;
  if(req.method==='POST'){
   const label=String(req.body?.label||'').trim().replace(/\s+/g,' ');
   if(!label||label.length>48||label.includes(',')||/[\u0000-\u001f]/.test(label))return res.status(400).json({error:'Etiqueta inválida: usá hasta 48 caracteres sin comas'});
   await sql`INSERT INTO agenda_company_tags_qa(company_id,label) VALUES(${companyId}::uuid,${label}) ON CONFLICT(company_id,label) DO NOTHING`;
   return res.status(201).json({ok:true,label});
  }
  const rows=await sql`SELECT label FROM agenda_company_tags_qa WHERE company_id=${companyId}::uuid UNION SELECT unnest(COALESCE(tags,ARRAY[]::text[])) AS label FROM agenda_appointments WHERE company_id=${companyId}::uuid ORDER BY label`;
  return res.status(200).json({ok:true,tags:[...new Set([...baseTags,...rows.map(r=>r.label).filter(Boolean)])],canManage:auth.role==='admin'});
 }catch(e){console.error('QA tag catalog',e);return res.status(500).json({error:'No se pudieron cargar las etiquetas'})}
}
