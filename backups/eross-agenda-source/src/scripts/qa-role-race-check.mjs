import {createInterface} from 'node:readline';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
const rl=createInterface({input:process.stdin});const cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
if(new URL(cfg.database).hostname!=='ep-ancient-meadow-b7e50je2-pooler.c-13.us-east-1.aws.neon.tech')throw Error('QA only');
const sql=neon(cfg.database),company=randomUUID(),stamp=Date.now(),accounts=[];
await sql`INSERT INTO agenda_companies(id,name,slug,timezone,active) VALUES(${company}::uuid,'QA role race acceptance',${'qa-role-race-'+stamp},'America/Costa_Rica',true)`;
for(let i=0;i<2;i++){const id=randomUUID(),password=randomBytes(24).toString('base64url'),salt=randomBytes(24).toString('base64url'),hash=scryptSync(password,salt,64).toString('base64url'),email='qa-role-race-'+stamp+'-'+i+'@eross.invalid';await sql.transaction([sql`INSERT INTO eross_identities(id,email,display_name) VALUES(${id}::uuid,${email},'QA role race')`,sql`INSERT INTO eross_identity_credentials(identity_id,password_hash,password_salt,password_algorithm) VALUES(${id}::uuid,${hash},${salt},'scrypt-v1')`,sql`INSERT INTO eross_company_memberships(identity_id,company_id,role) VALUES(${id}::uuid,${company}::uuid,'admin')`]);accounts.push({id,email,password})}
const members=await sql`SELECT id::text,identity_id::text FROM eross_company_memberships WHERE company_id=${company}::uuid`;
const server=cfg.base?null:spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-p','3100'],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:cfg.database,EROSS_MULTIEMPRESA_QA_ENABLED:'true',EROSS_EVENT_HUB_QA_ENABLED:'true',EROSS_IDENTITY_SESSION_SECRET:cfg.identitySecret}});
if(server)await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Ready'))resolve()});server.stderr.on('data',d=>process.stderr.write(d));server.on('exit',()=>reject(Error('Server exited')))});
const checks=[];function check(name,ok,details){checks.push({name,ok,...details});console.log(JSON.stringify(checks.at(-1)));if(!ok)process.exitCode=1}
async function call(path,body,cookie=''){const r=await fetch((cfg.base||'http://localhost:3100')+'/api/agenda/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:cfg.base||'https://localhost:3100',Cookie:cookie,...(cfg.bypass?{'x-vercel-protection-bypass':cfg.bypass}:{})},body:JSON.stringify(body)});const raw=await r.text();const detail=raw.startsWith('{')?JSON.parse(raw).error:raw.slice(0,180);return {status:r.status,detail,cookie:r.headers.get('set-cookie')?.split(';')[0]||''}}
try{for(const a of accounts){const login=await call('identity-qa-session',{email:a.email,password:a.password,company_id:company});check('Real admin login',login.status===200,{status:login.status,detail:login.detail});a.cookie=login.cookie}
check('Invalid UUID rejected',(await call('tenant-qa-account-role',{membershipId:'------------------------------------',role:'collaborator'},accounts[0].cookie)).status===400);
const race=await Promise.all(accounts.map((a,i)=>call('tenant-qa-account-role',{membershipId:members.find(m=>m.identity_id===accounts[1-i].id).id,role:'collaborator'},a.cookie)));
const count=await sql`SELECT count(*)::int AS admins FROM eross_company_memberships WHERE company_id=${company}::uuid AND active AND role='admin'`;
check('Concurrent demotions preserve an admin',count[0].admins===1,{admins:count[0].admins,statuses:race.map(x=>x.status)});check('Only one role mutation wins',race.filter(x=>x.status===200).length===1);check('Other mutation safely denied',race.some(x=>[403,409].includes(x.status)));
const audit=await sql`SELECT count(*)::int AS changes FROM eross_membership_role_audit_qa WHERE company_id=${company}::uuid`;check('Exactly one audited change',audit[0].changes===1,{changes:audit[0].changes});writeFileSync(cfg.base?'docs/qa-role-race-remote-evidence-2026-10-10.json':'docs/qa-role-race-evidence-2026-10-10.json',JSON.stringify({date:new Date().toISOString(),transport:cfg.base||'http://localhost:3100',company,passed:checks.every(x=>x.ok),checks},null,2));
}finally{server?.kill('SIGTERM')}
