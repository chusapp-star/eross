import {neon} from '@neondatabase/serverless';
import {createInterface} from 'node:readline';
import {createHmac,randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const rl=createInterface({input:process.stdin}),cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
if(!cfg.database.includes('ep-ancient-meadow-b7e50je2')||!cfg.resume?.length)throw Error('QA fixture required');
const sql=neon(cfg.database),checks=[];
const members=await sql`SELECT m.id::text,m.identity_id::text,m.company_id::text,m.role FROM eross_company_memberships m WHERE m.company_id=ANY(${cfg.resume}::uuid[]) AND m.active=true`;
const cookies={};for(const role of ['admin','supervisor','collaborator']){const m=members.find(x=>x.role===role);const b=Buffer.from(JSON.stringify({v:1,sub:m.identity_id,tenant:m.company_id,membership:m.id,role,exp:Date.now()+3600000})).toString('base64url');cookies[role]='eross_identity_qa='+b+'.'+createHmac('sha256',cfg.identitySecret).update(b).digest('base64url');}
async function req(path,role='admin',method='GET',body){const r=await fetch(cfg.transport+'/api/agenda/'+path,{method,headers:{'Content-Type':'application/json','x-vercel-protection-bypass':cfg.bypass||'',Origin:cfg.transport.replace('http:','https:'),Cookie:cookies[role]},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
function check(name,r,expected){const ok=r.status===expected;checks.push({name,ok,http:r.status,expected,error:r.data?.error});console.log(JSON.stringify(checks.at(-1)));writeFileSync('docs/qa-admin-evidence-2026-10-10.json',JSON.stringify({date:new Date().toISOString(),transport:cfg.transport,checks,passed:checks.every(x=>x.ok)},null,2));if(!ok)throw Error(name+' failed');}
if(!cfg.afterConfig){
let config=await req('config');check('Read tenant configuration',config,200);
const before=config.data;
check('Supervisor cannot configure',await req('config','supervisor','POST',{timezone:'America/Costa_Rica'}),403);
check('Invalid timezone rejected',await req('config','admin','POST',{timezone:'Mars/Orbit'}),400);
check('Invalid batch rejected',await req('config','admin','POST',{timezone:'Europe/Madrid',types:[{name:'Bad duration',duration:0}]}),400);
check('Invalid batch atomicity',{status:(await req('config')).data.timezone===before.timezone?200:500},200);
const foreign=(await sql`SELECT id::text FROM agenda_appointment_types WHERE company_id=${cfg.resume[1]}::uuid LIMIT 1`)[0].id;
check('Foreign type rejected',await req('config','admin','POST',{types:[{id:foreign,name:'Foreign',duration:30,color:'#123456'}]}),404);
check('Save extended hours and service',await req('config','admin','POST',{timezone:'America/Costa_Rica',types:[{name:'Servicio nocturno QA',duration:30,bufferBefore:0,bufferAfter:0,active:true,color:'#123456'}],days:[{day:'Lunes',active:true,allDay:false,slots:[{start:'08:00',end:'12:00'},{start:'14:00',end:'22:00'}]},{day:'Domingo',active:true,allDay:true,slots:[]}]}),200);
const reloaded=await req('config');check('Settings persisted',{status:reloaded.data.types.some(t=>t.name==='Servicio nocturno QA')&&reloaded.data.days.some(d=>d.day==='Lunes'&&d.slots.length===2)&&reloaded.data.days.some(d=>d.day==='Domingo'&&d.allDay)?200:500},200);
check('Booking interval save',await req('tenant-qa-booking-config','admin','PATCH',{slotStep:20,notice:60}),200);
check('Booking interval reread',{status:(await req('booking-settings')).data.slotStep===20?200:500},200);
check('Restore booking interval',await req('tenant-qa-booking-config','admin','PATCH',{slotStep:30,notice:0}),200);
}
for(const kind of ['responsible','location'])check('Add '+kind,await req('resources','admin','POST',{kind,name:'Acceptance additional '+kind}),201);
check('Supervisor cannot add resources',await req('resources','supervisor','POST',{kind:'responsible',name:'Forbidden'}),403);
const foreignLocation=(await sql`SELECT id::text FROM agenda_locations WHERE company_id=${cfg.resume[1]}::uuid LIMIT 1`)[0].id;
check('Foreign location update rejected',await req('resources','admin','PATCH',{kind:'location',id:foreignLocation,name:'Foreign'}),404);
const blocked=await req('blocks','admin','POST',{date:'2026-12-16',from:'23:00',to:'01:00',reason:'Acceptance overnight block'});check('Create overnight block',blocked,201);
check('Overnight block date persisted',{status:(await req('blocks')).data.blocks.find(b=>b.id===blocked.data.id)?.end_date==='2026-12-17'?200:500},200);
check('Remove own test block',await req('blocks','admin','DELETE',{id:blocked.data.id}),200);
const appointment=(await sql`SELECT id::text FROM agenda_appointments WHERE company_id=${cfg.resume[0]}::uuid AND source='qa-acceptance' ORDER BY created_at LIMIT 1`)[0].id;
const own=(await req('bootstrap')).data.appointments.find(a=>a.id===appointment);
check('Reschedule changes displayed status',await req('appointments','admin','PATCH',{...own,time:'13:00'}),200);
check('Rescheduled status persisted',{status:(await sql`SELECT status FROM agenda_appointments WHERE id=${appointment}::uuid`)[0].status==='rescheduled'?200:500},200);
check('Own history',await req('history?id='+appointment),200);
check('Foreign history rejected',await req('history?id='+appointment,'supervisor'),404);
check('Collaborator history',await req('history?id='+appointment,'collaborator'),200);
check('Own role protection',await req('tenant-qa-account-role','admin','POST',{membershipId:members.find(m=>m.role==='admin').id,role:'collaborator'}),409);
const email='qa-new-'+Date.now()+'@eross.invalid',password=randomBytes(24).toString('base64url');
check('Create tenant login account',await req('accounts','admin','POST',{email,name:'New acceptance account',role:'collaborator',password}),201);
check('Existing email cannot reset password',await req('accounts','admin','POST',{email,name:'Repeated',role:'admin',password}),409);
check('Supervisor cannot create account',await req('accounts','supervisor','POST',{email:'other-'+email,name:'No',role:'admin',password}),403);
const login=await req('identity-qa-session','admin','POST',{email,password});check('Generic login selects sole membership',login,200);
const companyBefore=(await req('tenant-qa-company')).data.company.name;
check('Rename own company',await req('tenant-qa-company','admin','PATCH',{name:companyBefore+' verified'}),200);
check('Restore fixture company name',await req('tenant-qa-company','admin','PATCH',{name:companyBefore}),200);
check('Logout session',await req('identity-qa-session','admin','DELETE'),200);
writeFileSync('docs/qa-admin-evidence-2026-10-10.json',JSON.stringify({date:new Date().toISOString(),transport:cfg.transport,environment:'Neon QA / local source',companies:cfg.resume,checks,passed:checks.every(x=>x.ok)},null,2));
console.log(JSON.stringify({summary:true,total:checks.length,passed:true}));
