import assert from 'node:assert/strict';
import { exam, grade, publicPaper, normalize } from '../apps/web/src/features/diagnostic/server/scoring';
assert.equal(exam.questions.length,53);
assert.equal(new Set(exam.questions.map(q=>q.id)).size,53);
assert.equal(exam.areas.length,16);
const perfect=Object.fromEntries(exam.questions.map(q=>[q.id,q.accepted[0]]));
assert.deepEqual(grade(perfect).scores,{Listening:20,Reading:13,Grammar:20});
assert.ok(grade(perfect).areas.every(a=>a.level===2&&a.review.length===0));
assert.equal(grade({}).blanks,53);
assert.ok(grade({}).areas.every(a=>a.level===0&&a.review.every(q=>q.blank)));
for(const q of exam.questions){for(const accepted of q.accepted){assert.equal(grade({[q.id]:'  '+accepted.toUpperCase().replace(/ /g,'   ')+'  '}).items.find(i=>i.id===q.id)?.correct,true,`${q.id}: ${accepted}`);}}
for(const [id,value] of [['L05','towel'],['L06','book'],['L02','€77.5'],['L12','Environment Agencies']])assert.equal(grade({[id]:value}).items.find(q=>q.id===id)?.correct,false);
for(const a of exam.areas){const qs=exam.questions.filter(q=>a.id==='R_VOCABULARY_OVERALL'?q.section==='Reading':q.area===a.id);for(let score=0;score<=qs.length;score++){const answers=Object.fromEntries(qs.slice(0,score).map(q=>[q.id,q.accepted[0]]));const result=grade(answers).areas.find(r=>r.id===a.id)!;assert.equal(result.correct,score);assert.equal(result.level,score>=a.thresholds[1]?2:score>=a.thresholds[0]?1:0);}}
assert.equal(grade({G15:'A'}).items.find(q=>q.id==='G15')!.review,'Hòa hợp chủ ngữ–động từ với “each student”');
assert.equal(grade({G19:'C'}).items.find(q=>q.id==='G19')!.review,'Danh từ không đếm được “advice”');
const publicJson=JSON.stringify(publicPaper(exam));for(const key of ['accepted','feedback','explanation','thresholds','evidence','wrongReviews','area'])assert.ok(!publicJson.includes('"'+key+'"'),`Leaked ${key}`);
assert.equal(normalize(' One   MONTH '),'one month');
console.log('53 questions, all answer variants, 16 area boundaries, blank answers, combined grammar diagnosis and public-paper secrecy passed.');
