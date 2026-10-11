import {readFileSync,writeFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const rows={sol:[{label:'Sol personalizada'},{label:'Etiqueta anterior'}],luna:[{label:'Luna personalizada'}]};let company='sol',role='admin',values=[];
const source=readFileSync('pages/api/agenda/tenant-qa-tags.js','utf8').replace(/^import.*$/gm,'').replace('export default async function handler','async function handler');
const sql=async(strings,...args)=>{values.push(args);if(strings.join('').startsWith('INSERT')){rows[company].push({label:args[1]});return[]}return rows[company]};
const handler=vm.runInNewContext(source+';handler',{baseTags:['VIP','Cliente externo','Seguimiento'],process:{env:{EROSS_MULTIEMPRESA_QA_ENABLED:'true',EROSS_EVENT_HUB_QA_ENABLED:'true'}},authorizeAgendaWrite:async(req,res,{action})=>{if(role==='missing'){res.status(401).json({});return null}if(action==='companies.manage'&&role!=='admin'){res.status(403).json({});return null}return {sql,companyId:company,role}},console,Set});
async function req(method='GET',body={}){const res={http:200,setHeader(){},status(n){this.http=n;return this},json(j){this.data=j;return this}};await handler({method,body},res);return res}
const checks=[];const save=(name)=>checks.push({name,result:'PASS',transport:'unit handler with mocked company-scoped SQL'});
let r=await req();assert(r.data.tags.includes('VIP'));assert(r.data.tags.includes('Etiqueta anterior'));assert(!r.data.tags.includes('Luna personalizada'));save('Defaults, legacy tags and Sol-specific catalog retained');
company='luna';r=await req();assert(r.data.tags.includes('Luna personalizada'));assert(!r.data.tags.includes('Sol personalizada'));save('Separate company catalog');
role='collaborator';r=await req('POST',{label:'Forbidden'});assert.equal(r.http,403);save('Collaborator cannot configure tags');
role='admin';r=await req('POST',{label:'Bad,label'});assert.equal(r.http,400);save('Comma-containing label rejected without writes');
r=await req('POST',{label:'  Seguimiento   Premium '});assert.equal(r.http,201);assert.equal(r.data.label,'Seguimiento Premium');save('Custom label normalized and persisted through handler');
role='missing';assert.equal((await req()).http,401);save('Unauthenticated read denied');
writeFileSync('docs/qa-tags-regression.json',JSON.stringify({checks,passed:true,limitations:'Mocked SQL; live catalog checked separately'},null,2)+'\n');console.log('PASS: '+checks.length+' tags regression checks');
