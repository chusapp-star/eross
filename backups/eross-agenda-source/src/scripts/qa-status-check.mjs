import {neon} from '@neondatabase/serverless';
import {createInterface} from 'node:readline';
import {createHmac,randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const rl=createInterface({input:process.stdin}),cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
if(!cfg.database.includes('ep-ancient-meadow-b7e50je2')||!cfg.resume?.length)throw Error('QA fixture required');
const sql=neon(cfg.database),checks=[];
const m=(await sql`SELECT id::text,identity_id::text,company_id::text,role FROM eross_company_memberships WHERE company_id=${cfg.resume[0]}::uuid AND role='admin' AND active=true LIMIT 1`)[0];
const b=Buffer.from(JSON.stringify({v:1,sub:m.identity_id,tenant:m.company_id,membership:m.id,role:m.role,exp:Date.now()+3600000})).toString('base64url'),cookie='eross_identity_qa='+b+'.'+createHmac('sha256',cfg.identitySecret).update(b).digest('base64url');
async function req(path,method='GET',body){const r=await fetch(cfg.transport+'/api/agenda/'+path,{method,headers:{'Content-Type':'application/json',Origin:cfg.transport.replace('http:','https:'),Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),setsCookie:!!r.headers.get('set-cookie')};}
function check(name,r,expected){const ok=r.status===expected;checks.push({name,ok,http:r.status,expected,error:r.data?.error});console.log(JSON.stringify(checks.at(-1)));writeFileSync('docs/qa-status-evidence-2026-10-10.json',JSON.stringify({date:new Date().toISOString(),transport:cfg.transport,checks,passed:checks.every(x=>x.ok)},null,2));if(!ok)throw Error(name+' failed');}
const boot=(await req('bootstrap')).data,own=boot.appointments.find(a=>a.source==='qa-acceptance'&&a.status!=='Cancelada'&&a.time==='12:00');
check('Reschedule API',await req('appointments','PATCH',{...own,time:'13:00'}),200);
check('Rescheduled status persisted',{status:(await sql`SELECT status FROM agenda_appointments WHERE id=${own.id}::uuid`)[0].status==='rescheduled'?200:500},200);
const email='qa-status-'+Date.now()+'@eross.invalid',password=randomBytes(24).toString('base64url');
const account=await req('accounts','POST',{email,name:'Membership selector acceptance',role:'collaborator',password});check('Create selector fixture account',account,201);
await sql`INSERT INTO eross_company_memberships(identity_id,company_id,role,active) VALUES(${account.data.identity_id}::uuid,${cfg.resume[1]}::uuid,'collaborator',true)`;
const choose=await req('identity-qa-session','POST',{email,password});check('Multiple membership selector returned',{status:choose.status===200&&choose.data.requires_company===true&&choose.data.companies?.length===2&&!choose.setsCookie?200:500},200);
check('Select authorized second company',await req('identity-qa-session','POST',{email,password,company_id:cfg.resume[1]}),200);
const type=boot.types.find(t=>t.name==='Servicio QA'),body={name:'Reactivation block QA',date:'2026-12-18',time:'18:00',appointment_type_id:type.id,responsible_user_id:boot.users[0].id,location_id:boot.locations[0].id,source:'qa-acceptance'};
const ap=await req('appointments','POST',body);check('Create reactivation fixture',ap,200);
check('Cancel reactivation fixture',await req('status','PATCH',{id:ap.data.id,status:'cancelled'}),200);
const block=await req('blocks','POST',{date:body.date,from:'17:30',to:'19:00',reason:'QA reactivation guard'});check('Block cancelled fixture time',block,201);
check('Blocked reactivation rejected',await req('status','PATCH',{id:ap.data.id,status:'confirmed'}),409);
check('Remove test block',await req('blocks','DELETE',{id:block.data.id}),200);
check('Free reactivation accepted',await req('status','PATCH',{id:ap.data.id,status:'confirmed'}),200);
console.log(JSON.stringify({summary:true,total:checks.length,passed:true}));
