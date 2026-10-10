import {authorizeAgendaWrite} from '../../../lib/agenda-write-auth';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(req,res){
 if(!['POST','PATCH'].includes(req.method))return res.status(405).json({error:'Método no permitido'});
 try{
 const auth=await authorizeAgendaWrite(req,res,{action:'companies.manage'});if(!auth)return;
 const {sql,companyId}=auth,{kind,id,name,email,active}=req.body||{};
 if(!['responsible','location'].includes(kind)||!String(name||'').trim()||String(name).length>100||req.method==='PATCH'&&!uuid.test(id))return res.status(400).json({error:'Datos inválidos'});
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Correo inválido'});
 let rows;
 if(kind==='responsible')rows=req.method==='POST'?await sql`INSERT INTO agenda_users(id,company_id,name,email,role,active) VALUES(gen_random_uuid(),${companyId}::uuid,${name.trim()},${email||null},'collaborator',true) RETURNING id::text`:await sql`UPDATE agenda_users SET name=${name.trim()},email=${email||null},active=${active!==false} WHERE id=${id}::uuid AND company_id=${companyId}::uuid RETURNING id::text`;
 else rows=req.method==='POST'?await sql`INSERT INTO agenda_locations(id,company_id,name,active) VALUES(gen_random_uuid(),${companyId}::uuid,${name.trim()},true) RETURNING id::text`:await sql`UPDATE agenda_locations SET name=${name.trim()},active=${active!==false} WHERE id=${id}::uuid AND company_id=${companyId}::uuid RETURNING id::text`;
 if(!rows.length)return res.status(404).json({error:'Registro no encontrado'});
 return res.status(req.method==='POST'?201:200).json({ok:true,id:rows[0].id});
 }catch(e){console.error('agenda resources',e);return res.status(500).json({error:'No se pudo guardar el registro'})}
}
