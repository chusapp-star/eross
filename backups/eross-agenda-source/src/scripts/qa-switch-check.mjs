import {createInterface} from 'node:readline';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
const rl=createInterface({input:process.stdin});const cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
if(new URL(cfg.database).hostname!=='ep-ancient-meadow-b7e50je2-pooler.c-13.us-east-1.aws.neon.tech')throw Error('QA only');
const sql=neon(cfg.database),id=randomUUID(),password=randomBytes(24).toString('base64url'),salt=randomBytes(24).toString('base64url'),hash=scryptSync(password,salt,64).toString('base64url'),email='qa-switch-'+Date.now()+'@eross.invalid';
const sol='eec3c94c-34b0-4c91-b209-67e957a13e01',luna='eec3c94c-34b0-4c91-b209-67e957a13e02';
await sql.transaction([sql`INSERT INTO eross_identities(id,email,display_name) VALUES(${id}::uuid,${email},'QA switch acceptance')`,sql`INSERT INTO eross_identity_credentials(identity_id,password_hash,password_salt,password_algorithm) VALUES(${id}::uuid,${hash},${salt},'scrypt-v1')`,sql`INSERT INTO eross_company_memberships(identity_id,company_id,role) VALUES(${id}::uuid,${sol}::uuid,'admin'),(${id}::uuid,${luna}::uuid,'collaborator')`]);
const checks=[];function check(name,actual,expected){const ok=actual===expected;checks.push({name,actual,expected,ok});console.log(JSON.stringify(checks.at(-1)));if(!ok)process.exitCode=1}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3100'],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:cfg.database,EROSS_MULTIEMPRESA_QA_ENABLED:'true',EROSS_EVENT_HUB_QA_ENABLED:'true',EROSS_IDENTITY_SESSION_SECRET:cfg.identitySecret,EROSS_QA_COMPANY_PROVISIONER_IDENTITY_ID:cfg.owner}});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Ready'))resolve()});server.stderr.on('data',d=>process.stderr.write(d));server.on('exit',()=>reject(Error('Server exited')))});
let cookie='';
async function call(path='identity-qa-session',method='GET',body,opts={}){const r=await fetch('http://localhost:3100/api/agenda/'+path,{method,headers:{'Content-Type':'application/json',Origin:opts.origin||'https://localhost:3100',Cookie:opts.unauth?'':cookie},...(body?{body:JSON.stringify(body)}:{})});const next=r.headers.get('set-cookie')?.split(';')[0];if(next)cookie=next;return {status:r.status,data:await r.json(),setCookie:!!next}}
try{
 check('Unauthenticated switch',(await call(undefined,'PATCH',{company_id:sol},{unauth:true})).status,401);
 check('Real login',(await call(undefined,'POST',{email,password,company_id:sol})).status,200);
 const session=await call();check('Only authorized memberships',session.data.companies.length,2);
 check('Invalid identifier',(await call(undefined,'PATCH',{company_id:'invalid'})).status,400);
 check('Cross-origin switch',(await call(undefined,'PATCH',{company_id:luna},{origin:'https://untrusted.example'})).status,403);
 const foreign=await call(undefined,'PATCH',{company_id:'bd976441-4d8b-4107-b56c-8999e02f1c99'});check('Unowned company denied',foreign.status,403);check('Denied switch issues no session',foreign.setCookie,false);
 check('Failed switch retains Sol',(await call()).data.company_id,sol);
 check('Switch to authorized Luna',(await call(undefined,'PATCH',{company_id:luna})).status,200);
 check('Role resolves from Luna membership',(await call()).data.role,'collaborator');
 check('Collaborator bootstrap read only',(await call('bootstrap')).data.canWrite,false);
 check('Collaborator settings denied',(await call('config')).status,403);
 check('Collaborator appointment creation denied',(await call('appointments','POST',{name:'Unauthorized QA'})).status,403);
 const overview=await call('tenant-qa-overview');check('Collaborator user navigation absent',overview.data.navigation.includes('Usuarios'),false);check('Collaborator configuration navigation absent',overview.data.navigation.includes('Configuración'),false);
 check('Return to Sol',(await call(undefined,'PATCH',{company_id:sol})).status,200);check('Admin restored from Sol membership',(await call()).data.role,'admin');
 check('Tenant admin cannot provision company',(await call('tenant-qa-company-create','POST',{name:'No autorizado',slug:'no-autorizado'})).status,403);
 await sql`UPDATE eross_company_memberships SET active=false WHERE identity_id=${id}::uuid AND company_id=${luna}::uuid`;
 check('Revoked target membership denied',(await call(undefined,'PATCH',{company_id:luna})).status,403);
 await sql`UPDATE eross_company_memberships SET active=true WHERE identity_id=${id}::uuid AND company_id=${luna}::uuid`;
 const report={date:new Date().toISOString(),transport:'http://localhost:3100',identity:id,scope:'Original fictitious Sol/Luna; new disposable login',passed:checks.every(c=>c.ok),checks};writeFileSync('docs/qa-switch-evidence-2026-10-10.json',JSON.stringify(report,null,2));console.log(JSON.stringify({total:checks.length,passed:report.passed}));
}finally{server.kill('SIGTERM')}
