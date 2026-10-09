import {sessionValid,validAdminPassword,issueSession,clearSession,sameOrigin} from "../../../lib/agenda-auth";
export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method==="GET")return res.status(200).json({authenticated:sessionValid(req),configured:!!process.env.AGENDA_ADMIN_PASSWORD});
  if(!sameOrigin(req))return res.status(403).json({error:"Origen no autorizado"});
  if(req.method==="DELETE"){clearSession(res);return res.status(200).json({ok:true});}
  if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
  if(!process.env.AGENDA_ADMIN_PASSWORD)return res.status(503).json({error:"Acceso administrativo no configurado"});
  if(!validAdminPassword(req.body?.password))return res.status(401).json({error:"Contraseña incorrecta"});
  issueSession(res);return res.status(200).json({ok:true});
}
