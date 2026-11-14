import { neon } from '@neondatabase/serverless';
import { sources,capture } from '../src/catalog.js';
import { seed,catalogPage,createPage,demoCatalog,demoDirectory } from '../src/page.mjs';
import { authenticate,attempt,credential,emailOf,endSession,newSession,same,validPassword } from '../src/accounts.mjs';
import { discover } from '../src/discover.mjs';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...headers,...extra}});
const html=body=>new Response(body,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src https: data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
const redirect=to=>new Response(null,{status:303,headers:{...headers,Location:to}});
const database=()=>neon(process.env.DATABASE_URL);

async function dashboard(sql){
 const rows=await sql`SELECT source,captured_at,items FROM (SELECT *,ROW_NUMBER() OVER(PARTITION BY source ORDER BY captured_at DESC) AS n FROM snapshots) WHERE n<=10 ORDER BY captured_at DESC`;
 return Object.entries(sources).map(([key,source])=>{
  const history=rows.filter(r=>r.source===key).map(r=>({date:r.captured_at,items:r.items}));
  if(seed[key]&&!history.some(r=>r.date===seed[key].date))history.push(seed[key]);
  history.sort((a,b)=>b.date.localeCompare(a.date));
  const [latest,prior]=history;
  const previous=new Map(prior?.items.map(item=>[item.id,item])||[]);
  const items=(latest?.items||[]).map(item=>{
   const old=previous.get(item.id);
   return {...item,change:old&&!!old.from===!!item.from?item.price-old.price:null};
  });
  return {key,...source,date:latest?.date,items,history:history.map(r=>({date:r.date,count:r.items.length}))};
 });
}
async function refresh(sql,market){
 const selected=Object.keys(sources).filter(key=>sources[key].market===market);
 if(!selected.length)return json({error:'Mercado desconocido.'},400);
 const now=Date.now(),until=now+180000;
 const lock=await sql`INSERT INTO refresh_lock VALUES(${market},${until}) ON CONFLICT(name) DO UPDATE SET until_ms=excluded.until_ms WHERE refresh_lock.until_ms<=${now} RETURNING name`;
 if(!lock.length)return json({error:'Esperá unos minutos entre consultas.'},429);
 const results=await Promise.all(selected.map(async key=>{
  try{
   const items=await capture(key);
   await sql.transaction(t=>[
    t`INSERT INTO snapshots VALUES (${key},${new Date().toISOString()},${JSON.stringify(items)}::jsonb)`,
    t`DELETE FROM snapshots WHERE source=${key} AND captured_at NOT IN(SELECT captured_at FROM snapshots WHERE source=${key} ORDER BY captured_at DESC LIMIT 30)`
   ]);
   return {key,count:items.length};
  }catch{return {key,error:'No se pudo actualizar esta fuente. Se conservó la última captura.'};}
 }));
 if(results.every(r=>r.error))await sql`DELETE FROM refresh_lock WHERE name=${market} AND until_ms=${until}`;
 return json({data:await dashboard(sql),results});
}
function appPage(account){
 return catalogPage.replace('<main>', '<main><div class="tools"><a href="/">Inicio</a> '+(account.role==='admin'?'<a href="/clientes">Administrar clientes</a>':'')+'<button id="sign-out" type="button">Cerrar sesión</button></div>').replace('</script></body>',"document.getElementById('sign-out').onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.replace('/acceso');};</script></body>");
}
function demoPage(){
 return catalogPage.replace(/const regionalDirectory=.*?;\n/,()=> 'const regionalDirectory='+JSON.stringify(demoDirectory)+';\n')
 .replace('<main>','<main><p class="scope">Demo pública · datos y precios ficticios</p><a href="/acceso">Ingresar al monitor</a>')
 .replace("fetch(update?'/api/refresh?market='+market:'/api/catalog'","fetch('/api/demo'")
 .replace("method:update?'POST':'GET'","method:'GET'")
 .replace("selectMarket(market);load(false);","selectMarket(market);load(false);\n$('refresh').hidden=true;$('more').hidden=true;");
}
async function bodyOf(req){
 if(!String(req.headers['content-type']).startsWith('application/json'))return null;
 let bytes=0;const parts=[];
 for await(const chunk of req){
  bytes+=chunk.length;
  if(bytes>4096)return null;
  parts.push(chunk);
 }
 try{return JSON.parse(Buffer.concat(parts).toString());}catch{return null;}
}
function render(res,reply){
 res.statusCode=reply.status;
 reply.headers.forEach((value,key)=>res.setHeader(key,value));
 return reply.arrayBuffer().then(bytes=>res.end(Buffer.from(bytes)));
}
export default async function handler(req,res){
 try{
  const url=new URL(req.url,'https://'+req.headers.host);
  const path=url.pathname==='/api/app'?(url.searchParams.get('route')||'/'):url.pathname;
  const get=req.method==='GET',post=req.method==='POST';
  const sameOrigin=req.headers.origin==='https://'+req.headers.host;
  const reply=await route(path,{get,post,sameOrigin,url,req});
  return await render(res,reply);
 }catch(error){
  console.error(error.name,error.code??'');
  return await render(res,json({error:'No se pudo completar la solicitud.'},500));
 }
}
async function route(path,{get,post,sameOrigin,url,req}){
 if(get&&path==='/demo')return html(demoPage());
 if(get&&path==='/api/demo')return json(demoCatalog(sources));
 if(get&&['/acceso','/configurar'].includes(path))return html(createPage);
 if(post&&!sameOrigin)return json({error:'Origen inválido.'},403);
 const sql=database();
 if(post&&path==='/api/logout')return json({ok:true},200,{'Set-Cookie':await endSession(sql,req)});
 if(post&&['/api/login','/api/setup'].includes(path)){
  const body=await bodyOf(req);
  const email=emailOf(body?.email),password=body?.password;
  if(!email||!validPassword(password))return json({error:'Revisá el correo y la contraseña (mínimo 12 caracteres).'},400);
  const ip=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||'unknown').split(',')[0].trim().slice(0,64);
  if(!await attempt(sql,'login-ip:'+ip,25)||!await attempt(sql,'login-account:'+email,8))return json({error:'Demasiados intentos. Probá en 15 minutos.'},429);
  if(path==='/api/setup'){
   if(!process.env.SETUP_CODE||typeof body.token!=='string'||!same(body.token,process.env.SETUP_CODE))return json({error:'Código de activación inválido.'},403);
   const hash=await credential(password);
   const [,created]=await sql.transaction(t=>[
    t`SELECT pg_advisory_xact_lock(739110)`,
    t`INSERT INTO accounts(email,credential,role) SELECT ${email},${hash},'admin' WHERE NOT EXISTS(SELECT 1 FROM accounts WHERE role='admin') RETURNING email`
   ]);
   if(!created.length)return json({error:'Ya existe un administrador. Ingresá con tu cuenta.'},409);
  }else{
   const [account]=await sql`SELECT credential,active FROM accounts WHERE email=${email}`;
   const expected=account?.credential??('00000000000000000000000000000000:'+ '0'.repeat(128));
   const computed=await credential(password,expected.split(':')[0]);
   if(!same(computed,expected)||!account?.active)return json({error:'Correo o contraseña incorrectos.'},401);
  }
  return json({ok:true},200,{'Set-Cookie':await newSession(sql,email)});
 }
 const account=await authenticate(sql,req);
 if(!account)return get&&!path.startsWith('/api/')?redirect('/acceso'):json({error:'Ingresá con tu cuenta de EROSS.'},401);
 if(get&&path==='/')return html(appPage(account));
 if(get&&path==='/clientes')return account.role==='admin'?html(createPage):redirect('/');
 if(get&&path==='/api/catalog')return json(await dashboard(sql));
 if(post&&path==='/api/refresh')return refresh(sql,url.searchParams.get('market'));
 if(get&&path==='/api/discover'){
  const market=url.searchParams.get('market'),q=url.searchParams.get('q')?.trim();
  if(!q||q.length<3||q.length>100||!['optica','ortopedia'].includes(market))return json({error:'Escribí entre 3 y 100 caracteres.'},400);
  if(!await attempt(sql,'discover:'+account.email,45))return json({error:'Límite de búsquedas alcanzado. Probá en unos minutos.'},429);
  return json(await discover(q,market));
 }
 if(post&&path==='/api/client'&&account.role==='admin'){
  const body=await bodyOf(req);
  const email=emailOf(body?.email);
  if(!email||!validPassword(body?.password))return json({error:'Ingresá un correo válido y una contraseña de al menos 12 caracteres.'},400);
  const hash=await credential(body.password);
  const [saved]=await sql.transaction(t=>[
   t`INSERT INTO accounts(email,credential) VALUES(${email},${hash}) ON CONFLICT(email) DO UPDATE SET credential=excluded.credential,active=true WHERE accounts.role='client' RETURNING email`,
   t`DELETE FROM sessions USING accounts WHERE sessions.email=accounts.email AND accounts.email=${email} AND accounts.role='client'`
  ]);
  return saved.length?json({ok:true}):json({error:'Ese correo corresponde a un administrador.'},409);
 }
 return json({error:'Página no encontrada.'},404);
}
