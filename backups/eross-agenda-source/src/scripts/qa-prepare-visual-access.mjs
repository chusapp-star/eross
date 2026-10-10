import {createInterface} from 'node:readline';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
const rl=createInterface({input:process.stdin});const cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
if(new URL(cfg.database).hostname!=='ep-ancient-meadow-b7e50je2-pooler.c-13.us-east-1.aws.neon.tech')throw Error('QA database required');
const sql=neon(cfg.database);
const companies=['eec3c94c-34b0-4c91-b209-67e957a13e01','eec3c94c-34b0-4c91-b209-67e957a13e02'];
const verified=await sql`SELECT id,name FROM agenda_companies WHERE id=ANY(${companies}::uuid[]) AND active AND slug IN ('qa-empresa-sol-20261009','qa-empresa-luna-20261009')`;
if(verified.length!==2)throw Error('Original QA companies not verified');
await sql`CREATE TABLE IF NOT EXISTS eross_qa_activation_tokens(token_hash text PRIMARY KEY CHECK(length(token_hash)=64),identity_id uuid NOT NULL REFERENCES eross_identities(id),expires_at timestamptz NOT NULL,used_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())`;
const stamp=Date.now(),accounts=[];
for(const [name,role,companyList] of [['Chus QA aceptación','admin',companies],['QA visual supervisor','supervisor',[companies[0]]],['QA visual colaborador','collaborator',[companies[1]]],['QA prueba de activación','collaborator',[companies[0]]]]){
 const id=randomUUID(),email='qa-visual-'+role+'-'+stamp+'-'+accounts.length+'@eross.invalid',token=randomBytes(32).toString('base64url'),digest=createHash('sha256').update(token).digest('hex');
 await sql.transaction([sql`INSERT INTO eross_identities(id,email,display_name,active) VALUES(${id}::uuid,${email},${name},true)`,...companyList.map(company=>sql`INSERT INTO eross_company_memberships(identity_id,company_id,role,active) VALUES(${id}::uuid,${company}::uuid,${role},true)`),sql`INSERT INTO eross_qa_activation_tokens(token_hash,identity_id,expires_at) VALUES(${digest},${id}::uuid,now()+interval '2 hours')`]);
 accounts.push({id,email,name,role,companies:companyList,token});
}
// Contains confidential activation tokens: consume in memory, never commit or print to chat.
process.stdout.write(JSON.stringify({accounts}));
