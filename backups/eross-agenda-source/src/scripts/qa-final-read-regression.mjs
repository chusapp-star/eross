import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const checks=[];function check(name,fn){fn();checks.push({name,result:'PASS',transport:'unit handler with mocked SQL/auth'});}
const policy=vm.runInNewContext(readFileSync('lib/agenda-role-policy.js','utf8').replaceAll('export ','')+';({roleCan,navigationForRole})');
check('Admin configuration and appointments permissions preserved',()=>{assert.equal(policy.roleCan('admin','companies.manage'),true);assert.equal(policy.roleCan('admin','appointments.edit'),true)});
check('Collaborator stays read-only',()=>{assert.equal(policy.roleCan('collaborator','appointments.read'),true);assert.equal(policy.roleCan('collaborator','appointments.edit'),false);assert.equal(policy.navigationForRole('collaborator').includes('Usuarios'),false)});
check('Unknown roles denied',()=>assert.equal(policy.roleCan('owner','appointments.edit'),false));
const src=readFileSync('pages/api/agenda/tenant-qa-report.js','utf8').replace(/^import.*$/gm,'').replace('export default async function handler','async function handler');
const records=[{status:'confirmed',month_key:'2026-11',responsible:'A',location:'Sol',day_key:'2026-11-16',source:'Meta Ads',type:'Consulta',rescheduled:true},{status:'pending',month_key:'2026-11',responsible:'B',location:'Sol',day_key:'2026-11-17',source:'Web',type:'Consulta',rescheduled:false}];
let mode='valid',queryValues=[];
const sql=async(strings,...values)=>{queryValues.push(values);return strings.join(' ').includes('SELECT name,timezone')?[{name:'QA Sol',timezone:'America/Costa_Rica'}]:records};
const handler=vm.runInNewContext(src+';handler',{process:{env:{EROSS_MULTIEMPRESA_QA_ENABLED:'true',EROSS_EVENT_HUB_QA_ENABLED:'true'}},getSql:()=>sql,verifyIdentitySession:()=>mode==='missing'?null:{sub:'actor',tenant:'sol-id',membership:'member-id',role:'admin'},resolveTenantMembership:async()=>mode==='wrong-role'?{membership_id:'member-id',company_id:'sol-id',role:'collaborator'}:{membership_id:'member-id',company_id:'sol-id',role:'admin'},roleCan:policy.roleCan,console,Date,Set});
async function req(query={}){const res={http:200,setHeader(){},status(n){this.http=n;return this},json(j){this.data=j;return this}};await handler({method:'GET',query,headers:{cookie:'eross_identity_qa=unit-token'}},res);return res}
mode='missing';assert.equal((await req()).http,401);checks.push({name:'Missing login denied',result:'PASS',transport:'unit handler'});
mode='wrong-role';assert.equal((await req()).http,403);checks.push({name:'Stale membership role denied',result:'PASS',transport:'unit handler'});
mode='valid';let r=await req();assert.equal(r.http,200);assert.equal(r.data.total,2);assert.equal(r.data.statuses.confirmed,1);assert.equal(r.data.bySource['Meta Ads'],1);assert.equal(r.data.rescheduledCount,1);assert(queryValues.every(v=>v.includes('sol-id')));checks.push({name:'Report indicators/aggregation and tenant-bound SQL',result:'PASS',transport:'unit handler with mocked SQL'});
r=await req({responsible:'A'});assert.equal(r.data.total,1);assert.equal(r.data.byResponsible.A,1);assert.equal(r.data.filterOptions.responsibles.length,2);checks.push({name:'Responsible filter and options',result:'PASS',transport:'unit handler'});
assert.equal((await req({from:'2026-12-31',to:'2026-01-01'})).http,400);checks.push({name:'Invalid date range rejected',result:'PASS',transport:'unit handler'});
writeFileSync('docs/qa-final-read-regression.json',JSON.stringify({checks,passed:true,limitations:'Unit checks do not certify deployed SQL or browser flows'},null,2)+'\n');console.log('PASS: '+checks.length+' read/role regression checks (unit, no QA writes)');
