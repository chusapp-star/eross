import {createInterface} from 'node:readline';
import {spawn} from 'node:child_process';
const rl=createInterface({input:process.stdin});const cfg=JSON.parse(await new Promise(r=>rl.once('line',r)));rl.close();
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','-p','3100'],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:cfg.database,EROSS_MULTIEMPRESA_QA_ENABLED:'true',EROSS_EVENT_HUB_QA_ENABLED:'true',EROSS_IDENTITY_SESSION_SECRET:cfg.identitySecret,NEXT_TELEMETRY_DISABLED:'1'}});
let started=false;
server.stderr.on('data',d=>process.stderr.write(d));
server.stdout.on('data',d=>{const s=d.toString();process.stdout.write(s);if(!started&&s.includes('Ready')){started=true;const test=spawn(process.execPath,[cfg.suite==='admin'?'scripts/qa-admin-flow.mjs':cfg.suite==='status'?'scripts/qa-status-check.mjs':'scripts/qa-flow.mjs'],{stdio:['pipe','inherit','inherit']});test.stdin.end(JSON.stringify({...cfg,base:'https://eross-agenda-qa.vercel.app',transport:'http://localhost:3100',bypass:''})+'\n');test.on('exit',code=>{server.kill('SIGTERM');process.exitCode=code})}});
