import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { exam } from '../apps/web/src/features/diagnostic/server/scoring';
dotenv.config({path:'apps/web/.env.local'});
const db=new Pool({host:process.env.PGHOST,port:Number(process.env.PGPORT??5432),user:process.env.PGUSER,password:process.env.PGPASSWORD,database:process.env.PGDATABASE,ssl:{rejectUnauthorized:false}});
const tokens=[randomBytes(32).toString('hex'),randomBytes(32).toString('hex')];
async function call(token:string,action:string,extra:object={},editor='api-test'){
 const r=await fetch('http://localhost:2000/api/diagnostic',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,editor,...extra})});return {status:r.status,data:await r.json()};
}
async function main(){try{
 const profile={name:'Synthetic API check',email:'api-check@example.invalid',level:'Chưa rõ',target:'7.0',examDate:'Trong 3 tháng',consent:true,dailyMinutes:30};
 let r=await call(tokens[0],'start',{profile});assert.equal(r.status,200);assert.equal(r.data.result,null);assert.ok(r.data.remaining>2600);const start=r.data.startedAt;
 r=await call(tokens[0],'start',{profile});assert.equal(r.data.startedAt,start);
 r=await call(tokens[0],'save',{answers:{G01:'C'},workspace:{bookmarks:['G01']}});assert.equal(r.data.answers.G01,'C');
 r=await call(tokens[0],'resume');assert.equal(r.data.answers.G01,'C');assert.deepEqual(r.data.workspace.bookmarks,['G01']);
 assert.equal((await call(tokens[0],'save',{answers:{G01:'A'}},'other-tab')).status,409);
 const perfect=Object.fromEntries(exam.questions.map(q=>[q.id,q.accepted[0]]));r=await call(tokens[0],'submit',{answers:perfect});assert.deepEqual(r.data.result.scores,{Listening:20,Reading:13,Grammar:20});
 r=await call(tokens[0],'submit',{answers:{}});assert.equal(r.data.result.scores.Grammar,20);
 r=await call(tokens[0],'progress',{progress:{'week-1-day-1':true}});assert.equal(r.data.progress['week-1-day-1'],true);
 await call(tokens[1],'start',{profile});await call(tokens[1],'save',{answers:{G01:'C'}});
 await db.query("UPDATE diagnostic_attempts SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[createHash('sha256').update(tokens[1]).digest('hex')]);
 r=await call(tokens[1],'submit',{answers:perfect});assert.equal(r.data.autoSubmitted,true);assert.equal(r.data.result.scores.Grammar,1);assert.equal(r.data.result.blanks,52);
 console.log('API passed: idempotent start, save/resume, tab lock, grading, immutable submit, progress and expiry rejecting late answers.');
 }finally{await db.query('DELETE FROM diagnostic_attempts WHERE token_hash=ANY($1::text[])',[tokens.map(t=>createHash('sha256').update(t).digest('hex'))]);await db.end();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
