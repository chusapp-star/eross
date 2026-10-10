import {authorizeAgendaWrite} from '../../../lib/agenda-write-auth';
import {hashIdentityPassword} from '../../../lib/agenda-identity-auth';
import {randomUUID} from 'node:crypto';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=='true'||process.env.EROSS_EVENT_HUB_QA_ENABLED!=='true')return res.status(404).json({error:'No disponible'});
 try{
 const auth=await authorizeAgendaWrite(req,res,{action:'users.manage'});if(!auth)return;
 const {sql,companyId}=auth;
 const email=String(req.body?.email||'').trim().toLowerCase(),name=String(req.body?.name||'').trim(),role=req.body?.role;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!name||name.length>100||!['admin','supervisor','collaborator'].includes(role))return res.status(400).json({error:'Nombre, correo o rol inválidos'});
 let hash;try{hash=hashIdentityPassword(req.body.password)}catch{return res.status(400).json({error:'La contraseña debe tener entre 12 y 256 caracteres'})}
 const id=randomUUID();
 // New account only. Never overwrite credentials owned by another company.
 await sql.transaction([
 sql`INSERT INTO eross_identities(id,email,display_name,active) VALUES(${id}::uuid,${email},${name},true)`,
 sql`INSERT INTO eross_company_memberships(identity_id,company_id,role,active) VALUES(${id}::uuid,${companyId}::uuid,${role},true)`,
 sql`INSERT INTO eross_identity_credentials(identity_id,password_hash,password_salt,password_algorithm) VALUES(${id}::uuid,${hash.password_hash},${hash.password_salt},${hash.password_algorithm})`
 ]);
 return res.status(201).json({ok:true,identity_id:id});
 }catch(e){if(e?.code==='23505')return res.status(409).json({error:'Este correo ya tiene una cuenta. Su acceso requiere una membresía autorizada, sin cambiar su contraseña.'});console.error('agenda accounts',e);return res.status(500).json({error:'No se pudo crear la cuenta'})}
}
