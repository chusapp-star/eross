import { createHash, randomBytes, scrypt as kdf, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(kdf);
const digest=value=>createHash('sha256').update(value).digest('hex');
export function same(a,b){
 const left=Buffer.from(a??'');
 const right=Buffer.from(b??'');
 return left.length===right.length&&timingSafeEqual(left,right);
}
export const emailOf=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())?value.trim().toLowerCase():'';
export async function credential(password,salt=randomBytes(16).toString('hex')){
 return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex');
}
export const validPassword=value=>typeof value==='string'&&value.length>=12&&value.length<=128;
export async function authenticate(sql,req){
 const token=req.headers.cookie?.match(/(?:^|;\s*)eross_monitor=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!token)return null;
 const [account]=await sql`SELECT a.email,a.role FROM sessions s JOIN accounts a ON a.email=s.email WHERE s.digest=${digest(token)} AND s.expires_at>now() AND a.active`;
 return account||null;
}
export async function newSession(sql,email){
 const token=randomBytes(32).toString('hex');
 await sql`INSERT INTO sessions (digest,email,expires_at) VALUES(${digest(token)},${email},now()+interval '12 hours')`;
 return 'eross_monitor='+token+'; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Lax';
}
export async function endSession(sql,req){
 const token=req.headers.cookie?.match(/(?:^|;\s*)eross_monitor=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(token)await sql`DELETE FROM sessions WHERE digest=${digest(token)}`;
 return 'eross_monitor=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
}
export async function attempt(sql,scope,limit){
 const [row]=await sql`INSERT INTO auth_attempts VALUES(${scope},now(),1)
 ON CONFLICT(scope) DO UPDATE SET started_at=CASE WHEN auth_attempts.started_at<now()-interval '15 minutes' THEN now() ELSE auth_attempts.started_at END,
 attempts=CASE WHEN auth_attempts.started_at<now()-interval '15 minutes' THEN 1 ELSE auth_attempts.attempts+1 END
 RETURNING attempts`;
 return row.attempts<=limit;
}
