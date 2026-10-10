import {createInterface} from 'node:readline';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
const rl=createInterface({input:process.stdin});const cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
const checks=[];function check(name,actual,expected){const ok=actual===expected;checks.push({name,actual,expected,ok});console.log(JSON.stringify(checks.at(-1)));if(!ok)process.exitCode=1}
const guard=readFileSync('lib/agenda-qa-activation.js','utf8').replace('export function','function');
for(const [name,url,enabled,expected] of [['QA only',cfg.database,true,true],['Wrong database','postgresql://user:password@main.neon.tech/db',true,false],['Disabled QA',cfg.database,false,false],['Missing database','',true,false],['Malformed database','invalid',true,false]]){
 const context={URL,process:{env:{DATABASE_URL:url,EROSS_MULTIEMPRESA_QA_ENABLED:String(enabled),EROSS_EVENT_HUB_QA_ENABLED:'true'}}};vm.createContext(context);check(name,vm.runInContext(guard+';activationQAEnabled()',context),expected);
}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3100'],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:cfg.database,EROSS_MULTIEMPRESA_QA_ENABLED:'true',EROSS_EVENT_HUB_QA_ENABLED:'true',EROSS_IDENTITY_SESSION_SECRET:cfg.identitySecret}});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Ready'))resolve()});server.stderr.on('data',d=>process.stderr.write(d));server.on('exit',()=>reject(Error('Server exited')))});
try{
 const call=async(body,{method='POST',origin='https://localhost:3100',cookie=''}={})=>{const r=await fetch('http://localhost:3100/api/agenda/qa-activate',{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},...(method!=='GET'?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''}};
 const common={token:cfg.account.token,company_id:cfg.account.companies[0]},password=randomBytes(24).toString('base64url');
 check('GET denied',(await call(null,{method:'GET'})).status,405);
 check('Foreign origin denied',(await call({...common,action:'inspect'},{origin:'https://untrusted.example'})).status,403);
 check('Invalid token',(await call({token:'invalid',action:'inspect'})).status,400);
 check('Unknown token',(await call({token:randomBytes(32).toString('base64url'),action:'inspect'})).status,410);
 check('Authorized invitation metadata',(await call({...common,action:'inspect'})).status,200);
 check('Foreign company denied',(await call({...common,company_id:'eec3c94c-34b0-4c91-b209-67e957a13e02',password,confirm:password})).status,403);
 check('Password mismatch',(await call({...common,password,confirm:'different'})).status,400);
 check('Short password',(await call({...common,password:'short',confirm:'short'})).status,400);
 const race=await Promise.all([1,2].map(()=>call({...common,password,confirm:password})));
 check('One activation winner',race.filter(r=>r.status===201).length,1);check('Replay denied',race.filter(r=>r.status===410).length,1);
 check('Consumed metadata denied',(await call({...common,action:'inspect'})).status,410);
 const login=await fetch('http://localhost:3100/api/agenda/identity-qa-session',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://localhost:3100'},body:JSON.stringify({email:cfg.account.email,password})});check('Activated credentials can log in',login.status,200);
 const session=await fetch('http://localhost:3100/api/agenda/identity-qa-session',{headers:{Cookie:race.find(r=>r.status===201).cookie}});check('Activation creates authenticated session',(await session.json()).authenticated,true);
 const report={date:new Date().toISOString(),transport:'http://localhost:3100',scope:'Neon QA only; disposable invitation',passed:checks.every(c=>c.ok),checks};writeFileSync('docs/qa-activation-evidence-2026-10-10.json',JSON.stringify(report,null,2));console.log(JSON.stringify({total:checks.length,passed:report.passed}));
}finally{server.kill('SIGTERM')}
