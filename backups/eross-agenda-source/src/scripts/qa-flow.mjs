import {neon} from '@neondatabase/serverless';
import {randomUUID, randomBytes, scryptSync, createHmac} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
const input=createInterface({input:process.stdin});
const cfg=JSON.parse(await new Promise(resolve=>input.once('line',resolve)));input.close();
if(!cfg.database.includes('ep-ancient-meadow-b7e50je2')||!cfg.base.includes('eross-agenda-qa'))throw Error('QA scope required');
const sql=neon(cfg.database),stamp=Date.now();
const evidence=[],fixture={companies:[],users:[],locations:[],types:[],accounts:[]};
async function request(path,{cookie='',method='GET',body}={}){const r=await fetch((cfg.transport||cfg.base)+'/api/agenda/'+path,{method,headers:{'Content-Type':'application/json',Origin:cfg.transport?cfg.transport.replace('http:','https:'):cfg.base,'x-vercel-protection-bypass':cfg.bypass,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});let data;try{data=await r.json()}catch{data={error:'Non-JSON response'}}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
function check(name,result,expected){const ok=result.status===expected&&result.data?.error?.message!=='Protected deployment'&&!(expected===403&&result.data?.error==='Origen no autorizado');evidence.push({name,ok,http:result.status,expected,error:result.data?.error});console.log(JSON.stringify(evidence.at(-1)));return ok;}
if(cfg.resume){
 for(const company of cfg.resume){
   const users=await sql`SELECT id::text FROM agenda_users WHERE company_id=${company}::uuid AND active=true ORDER BY created_at LIMIT 1`;
   const locations=await sql`SELECT id::text FROM agenda_locations WHERE company_id=${company}::uuid AND active=true ORDER BY created_at LIMIT 1`;
   const types=await sql`SELECT id::text FROM agenda_appointment_types WHERE company_id=${company}::uuid AND active=true ORDER BY created_at LIMIT 1`;
   fixture.companies.push(company);fixture.users.push(users[0].id);fixture.locations.push(locations[0].id);fixture.types.push(types[0].id);
 }
 const members=await sql`SELECT m.id::text,m.identity_id::text,m.company_id::text,m.role FROM eross_company_memberships m WHERE m.company_id=ANY(${cfg.resume}::uuid[]) AND m.active=true`;
 for(const role of ['admin','supervisor','collaborator']){const m=members.find(x=>x.role===role);const body=Buffer.from(JSON.stringify({v:1,sub:m.identity_id,tenant:m.company_id,membership:m.id,role:m.role,exp:Date.now()+3600000})).toString('base64url');const token=body+'.'+createHmac('sha256',cfg.identitySecret).update(body).digest('base64url');fixture.accounts.push({id:m.identity_id,role,cookie:'eross_identity_qa='+token});}
}else{
for(let i=0;i<2;i++){
 const company=randomUUID(),user=randomUUID(),location=randomUUID(),type=randomUUID();
 await sql`INSERT INTO agenda_companies(id,name,slug,timezone,active) VALUES(${company},${'QA Acceptance '+stamp+' '+i},${'qa-acceptance-'+stamp+'-'+i},'America/Costa_Rica',true)`;
 await sql`INSERT INTO agenda_users(id,company_id,name,role,active) VALUES(${user},${company},'Responsable ficticio QA','admin',true)`;
 await sql`INSERT INTO agenda_locations(id,company_id,name,active) VALUES(${location},${company},'Sede ficticia QA',true)`;
 await sql`INSERT INTO agenda_appointment_types(id,company_id,name,duration_min,buffer_before_min,buffer_after_min,active) VALUES(${type},${company},'Servicio QA',30,15,15,true)`;
 await sql`INSERT INTO agenda_availability_rules(company_id,weekday,active,all_day,slots) SELECT ${company}::uuid,n,true,false,'[{"start":"08:00","end":"22:00"}]'::jsonb FROM generate_series(0,6) n`;
 await sql`INSERT INTO agenda_booking_settings(company_id,slot_interval_min,min_notice_min) VALUES(${company},30,0)`;
 fixture.companies.push(company);fixture.users.push(user);fixture.locations.push(location);fixture.types.push(type);
}
for(const [i,role] of ['admin','supervisor','collaborator'].entries()){
 const id=randomUUID(),company=fixture.companies[i===1?1:0],email='qa-accept-'+stamp+'-'+i+'@eross.invalid',password=randomBytes(24).toString('base64url'),salt=randomBytes(24).toString('base64url'),hash=scryptSync(password,salt,64,{N:16384,r:8,p:1,maxmem:67108864}).toString('base64url');
 await sql`INSERT INTO eross_identities(id,email,display_name) VALUES(${id},${email},${'Acceptance '+role})`;
 await sql`INSERT INTO eross_company_memberships(identity_id,company_id,role,active) VALUES(${id},${company},${role},true)`;
 await sql`INSERT INTO eross_identity_credentials(identity_id,password_hash,password_salt,password_algorithm) VALUES(${id},${hash},${salt},'scrypt-v1')`;
 const login=await request('identity-qa-session',{method:'POST',body:{email,password,company_id:company}});if(!check('Login '+role,login,200))throw Error('Login boundary failed');fixture.accounts.push({id,role,cookie:login.cookie});
 check('Wrong-company login '+role,await request('identity-qa-session',{method:'POST',body:{email,password,company_id:fixture.companies[i===1?0:1]}}),401);
}
}
const [admin,supervisor,collaborator]=fixture.accounts;
check('Unauthenticated bootstrap',await request('bootstrap'),401);
if(!cfg.resume)for(const a of fixture.accounts)for(const path of ['identity-qa-session','bootstrap','tenant-qa-overview','tenant-qa-report','tenant-qa-clients','booking-settings'])check(a.role+' '+path,await request(path,{cookie:a.cookie}),200);
const body={name:'Cliente ficticio aceptación',email:'qa-client-'+stamp+'@eross.invalid',date:'2026-12-15',time:'10:00',appointment_type_id:fixture.types[0],responsible_user_id:fixture.users[0],location_id:fixture.locations[0],comments:'Notas QA completas',tags:['QA','aceptación'],confirmation_channel:'Ninguno',reminder_minutes:0,source:'qa-acceptance'};
check('Collaborator cannot create',await request('appointments',{cookie:collaborator.cookie,method:'POST',body}),403);
const created=await request('appointments',{cookie:admin.cookie,method:'POST',body});check('Create appointment',created,200);const id=created.data.id;
if(id){
 check('Duplicate appointment',await request('appointments',{cookie:admin.cookie,method:'POST',body}),409);
 check('Cross-company edit',await request('appointments',{cookie:supervisor.cookie,method:'PATCH',body:{...body,id}}),404);
 check('Cross-company status',await request('status',{cookie:supervisor.cookie,method:'PATCH',body:{id,status:'cancelled'}}),404);
 for(const status of ['confirmed','attended','no_show','cancelled'])check('Status '+status,await request('status',{cookie:admin.cookie,method:'PATCH',body:{id,status}}),200);
 const replacement=await request('appointments',{cookie:admin.cookie,method:'POST',body:{...body,name:'Reemplazo QA'}});check('Reuse cancelled slot',replacement,200);
 check('Reactivation occupied slot',await request('status',{cookie:admin.cookie,method:'PATCH',body:{id,status:'confirmed'}}),409);
 if(replacement.data.id)check('Cancel replacement',await request('status',{cookie:admin.cookie,method:'PATCH',body:{id:replacement.data.id,status:'cancelled'}}),200);
 check('Reactivate free slot',await request('status',{cookie:admin.cookie,method:'PATCH',body:{id,status:'confirmed'}}),200);
 check('Edit and reschedule',await request('appointments',{cookie:admin.cookie,method:'PATCH',body:{...body,id,time:'12:00',comments:'Nota modificada QA'}}),200);
 const rows=await sql`SELECT a.status,a.comments,a.reminder_minutes,cl.name FROM agenda_appointments a JOIN agenda_clients cl ON cl.id=a.client_id WHERE a.id=${id}::uuid`;
 const persisted={status:rows[0]?.comments==='Nota modificada QA'&&rows[0]?.reminder_minutes===0?200:500,data:{}};check('Persisted notes and no reminder',persisted,200);
 const ev=await sql`SELECT event_type FROM agenda_appointment_events WHERE appointment_id=${id}::uuid ORDER BY created_at`;
 console.log(JSON.stringify({name:'Events persisted',events:ev.map(x=>x.event_type)}));
 const race=await Promise.all([1,2].map(i=>request('appointments',{cookie:admin.cookie,method:'POST',body:{...body,time:'15:00',name:'Concurrente QA '+i,email:'race-'+stamp+'-'+i+'@eross.invalid'}})));
 check('Concurrent booking one winner',{status:race.filter(x=>x.status===200).length===1&&race.filter(x=>x.status===409).length===1?200:500,data:{}},200);
}
const report={transport:cfg.transport||null,date:new Date().toISOString(),base:cfg.base,fixture:{companies:fixture.companies},checks:evidence,passed:evidence.every(x=>x.ok)};
writeFileSync('docs/qa-flow-evidence-'+stamp+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({summary:true,total:evidence.length,passed:report.passed}));
