import {createHash} from 'node:crypto';
import {getSql} from '../../../lib/agenda-db';
import {sameOrigin} from '../../../lib/agenda-auth';
import {hashIdentityPassword,signIdentitySession} from '../../../lib/agenda-identity-auth';
import {activationQAEnabled} from '../../../lib/agenda-qa-activation';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!activationQAEnabled())return res.status(404).json({error:'No disponible'});
 if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
 if(!sameOrigin(req))return res.status(403).json({error:'Origen no autorizado'});
 const token=req.body?.token;
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return res.status(400).json({error:'Invitación inválida'});
 const digest=createHash('sha256').update(token).digest('hex');
 try{
  const sql=getSql();
  const rows=await sql`SELECT i.id::text,i.email,i.display_name,m.id::text AS membership_id,m.company_id::text,m.role,c.name AS company
   FROM eross_qa_activation_tokens t JOIN eross_identities i ON i.id=t.identity_id
   JOIN eross_company_memberships m ON m.identity_id=i.id JOIN agenda_companies c ON c.id=m.company_id
   WHERE t.token_hash=${digest} AND t.used_at IS NULL AND t.expires_at>now() AND i.active AND m.active AND c.active
   AND i.email LIKE '%@eross.invalid' AND NOT EXISTS(SELECT 1 FROM eross_identity_credentials cr WHERE cr.identity_id=i.id)
   ORDER BY c.name`;
  if(!rows.length)return res.status(410).json({error:'La invitación expiró o ya fue utilizada'});
  if(req.body.action==='inspect')return res.status(200).json({email:rows[0].email,name:rows[0].display_name,companies:rows.map(r=>({id:r.company_id,name:r.company,role:r.role}))});
  const membership=rows.find(r=>r.company_id===req.body.company_id);
  if(!membership)return res.status(403).json({error:'Empresa no autorizada'});
  if(req.body.password!==req.body.confirm)return res.status(400).json({error:'Las contraseñas no coinciden'});
  let password;try{password=hashIdentityPassword(req.body.password)}catch{return res.status(400).json({error:'Usá entre 12 y 256 caracteres'})}
  const claimed=await sql`WITH ticket AS (
   UPDATE eross_qa_activation_tokens SET used_at=now() WHERE token_hash=${digest} AND used_at IS NULL AND expires_at>now()
   AND identity_id=${membership.id}::uuid AND NOT EXISTS(SELECT 1 FROM eross_identity_credentials WHERE identity_id=${membership.id}::uuid)
   RETURNING identity_id
  ), credential AS (
   INSERT INTO eross_identity_credentials(identity_id,password_hash,password_salt,password_algorithm)
   SELECT identity_id,${password.password_hash},${password.password_salt},${password.password_algorithm} FROM ticket RETURNING identity_id
  ) SELECT identity_id::text FROM credential`;
  if(!claimed.length)return res.status(410).json({error:'La invitación ya fue utilizada'});
  const session=signIdentitySession({identityId:membership.id,companyId:membership.company_id,membershipId:membership.membership_id,role:membership.role});
  res.setHeader('Set-Cookie','eross_identity_qa='+session+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800');
  return res.status(201).json({ok:true});
 }catch(e){console.error('QA activation failed',e?.code||'internal');return res.status(500).json({error:'No se pudo activar la cuenta'})}
}
