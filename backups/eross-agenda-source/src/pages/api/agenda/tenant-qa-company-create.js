import {getSql} from "../../../lib/agenda-db";
import {verifyIdentitySession} from "../../../lib/agenda-identity-auth";
import {resolveTenantMembership} from "../../../lib/agenda-tenant";

// Explicit QA provisioning allowlist. Being a tenant admin alone is insufficient.
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!["POST","GET"].includes(req.method))return res.status(405).json({error:"Método no permitido"});
 if(process.env.EROSS_MULTIEMPRESA_QA_ENABLED!=="true"||process.env.EROSS_EVENT_HUB_QA_ENABLED!=="true")return res.status(404).json({error:"No disponible"});
 const allowed=process.env.EROSS_QA_COMPANY_PROVISIONER_IDENTITY_ID;
 if(req.method==="POST"&&!allowed)return res.status(403).json({error:"Alta de empresas aún no habilitada"});
 let origin;
 try{origin=req.method==="POST"?new URL(String(req.headers.origin||"")).host:null}catch{return res.status(403).json({error:"Origen inválido"})}
 if(req.method==="POST"&&origin!==req.headers.host)return res.status(403).json({error:"Origen no autorizado"});
 const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("eross_identity_qa="));
 const session=verifyIdentitySession(cookie?.slice("eross_identity_qa=".length));
 if(!session)return res.status(401).json({error:"Sesión requerida"});
 if(req.method==="GET")return res.status(200).json({enabled:Boolean(allowed&&session.sub===allowed&&session.role==="admin")});
 if(session.sub!==allowed||session.role!=="admin")return res.status(403).json({error:"No autorizado para registrar empresas"});
 const name=String(req.body?.name||"").trim().replace(/\s+/g," ");
 const slug=String(req.body?.slug||"").trim().toLowerCase();
 if(name.length<2||name.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>64)return res.status(400).json({error:"Nombre o identificador inválido"});
 try{
  const sql=getSql();
  const membership=await resolveTenantMembership(sql,{identityId:session.sub,companyId:session.tenant});
  if(!membership||membership.membership_id!==session.membership||membership.role!=="admin")return res.status(403).json({error:"Sesión administrativa inválida"});
  const existing=await sql`SELECT id FROM agenda_companies WHERE slug=${slug} LIMIT 1`;
  if(existing.length)return res.status(409).json({error:"El identificador de empresa ya existe"});
  // Both writes are in one database statement: neither company nor admin may be orphaned.
  const result=await sql`WITH inserted AS (
   INSERT INTO agenda_companies(id,name,slug,timezone,active)
   VALUES(gen_random_uuid(),${name},${slug},'America/Costa_Rica',true)
   RETURNING id,name,slug
  ), owner AS (
   INSERT INTO eross_company_memberships(identity_id,company_id,role,active)
   SELECT ${session.sub}::uuid,id,'admin',true FROM inserted RETURNING company_id
  )
  SELECT inserted.id::text,inserted.name,inserted.slug FROM inserted JOIN owner ON owner.company_id=inserted.id`;
  return res.status(201).json({ok:true,company:result[0],message:"Empresa creada. Configurá sus sedes, servicios y horarios antes de agendar."});
 }catch(e){console.error("QA company provisioning",e);if(e?.code==="23505")return res.status(409).json({error:"Ya existe una empresa con ese identificador"});return res.status(500).json({error:"No se pudo crear la empresa"})}
}