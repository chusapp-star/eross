import {requireAgendaAdmin} from "../../../lib/agenda-auth";
import {getSql} from "../../../lib/agenda-db";
import {hashIdentityPassword} from "../../../lib/agenda-identity-auth";
const accounts={"sol":"a3f8b72a-d1ef-4264-a5b1-ecbfbe7f4001","luna":"a3f8b72a-d1ef-4264-a5b1-ecbfbe7f4002"};
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 if(!requireAgendaAdmin(req,res))return;
 const account=String(req.body?.account||"");
 if(!Object.prototype.hasOwnProperty.call(accounts,account))return res.status(400).json({error:"Cuenta no permitida"});
 let hash;
 try{hash=hashIdentityPassword(req.body?.password)}catch{return res.status(400).json({error:"Usá una contraseña de entre 12 y 256 caracteres"})}
 try{
  const sql=getSql();
  await sql`INSERT INTO eross_identity_credentials(identity_id,password_hash,password_salt,password_algorithm,password_updated_at)
   VALUES(${accounts[account]}::uuid,${hash.password_hash},${hash.password_salt},${hash.password_algorithm},now())
   ON CONFLICT(identity_id) DO UPDATE SET password_hash=excluded.password_hash,password_salt=excluded.password_salt,
   password_algorithm=excluded.password_algorithm,password_updated_at=now(),login_disabled=false`;
  return res.status(200).json({ok:true,account});
 }catch(e){console.error("QA identity provisioning",e);return res.status(500).json({error:"No fue posible configurar la cuenta"})}
}
