/*
  Kiểm tra phần SUY RA TỪ kết quả: hồ sơ, lộ trình, nhận xét mạnh/yếu.
  `check-diagnostic.ts` lo phần chấm điểm; file này lo phần nói ra điều gì từ
  điểm đó — chỗ dễ sinh lời hứa không có căn cứ nhất.
*/
import assert from 'node:assert/strict';
// Lấy thẳng từ package, không đi vòng qua cầu nối trong `apps/web`: script này
// kiểm tra bộ quy tắc, nên phải nhìn đúng thứ mà cả web lẫn admin cùng chạy.
import {
  EXAM_TIMINGS,
  LEVELS,
  PURPOSES,
  TARGETS,
  buildRoadmap,
  buildVerdict,
  checkProfile,
  emptyProfile,
  exam,
  grade,
  mismatchedAnswerIds,
  monthsUntilExam,
} from '@thuong-ielts/diagnostic';

const at = new Date('2026-09-22T00:00:00Z');
const valid = { ...emptyProfile, name:'Nguyễn A', email:'a@b.co', level:LEVELS[2], target:'6.5', purpose:PURPOSES[1], examTiming:'Chưa có kế hoạch', dailyMinutes:30, consent:true };
const frac=(n:number)=>Object.fromEntries(exam.questions.filter((q,i)=>(i*17+q.id.charCodeAt(0))%100<n).map(q=>[q.id,q.accepted[0]]));

// --- hồ sơ: mọi trường bắt buộc đều phải chặn được
assert.ok(checkProfile(valid).ok);
for (const missing of ['name','email','level','target','purpose','examTiming'] as const)
  assert.equal(checkProfile({ ...valid, [missing]: '' }).ok, false, `thiếu ${missing} vẫn lọt`);
assert.equal(checkProfile({ ...valid, consent:false }).ok, false, 'chưa đồng ý vẫn lọt');
assert.equal(checkProfile({ ...valid, examTiming:'Chọn tháng/năm cụ thể' }).ok, false, 'thiếu tháng thi vẫn lọt');
assert.equal(checkProfile({ ...valid, level:'Bịa' }).ok, false, 'trình độ ngoài danh sách vẫn lọt');
// điểm IELTS tự khai chỉ giữ khi đúng là đã thi
const kept = checkProfile({ ...valid, level:'Đã có điểm IELTS', ieltsScore:'6.0' });
assert.equal(kept.ok && kept.profile.ieltsScore, '6.0');
const dropped = checkProfile({ ...valid, ieltsScore:'9.0' });
assert.equal(dropped.ok && dropped.profile.ieltsScore, '');

// --- mốc thi
assert.equal(monthsUntilExam({ ...valid, examTiming:'Trong 1 tháng' }, at), 1);
assert.equal(monthsUntilExam({ ...valid, examTiming:'Chưa có kế hoạch' }, at), null);
assert.equal(monthsUntilExam({ ...valid, examTiming:'Chọn tháng/năm cụ thể', examMonth:'2027-03' }, at), 6);

const report = grade(frac(62));

// --- lộ trình: đủ bốn kỹ năng, luôn có Writing/Speaking dù bài không đo
for (const target of TARGETS) {
  const rm = buildRoadmap(report, { ...valid, target }, at);
  assert.ok(rm.totalMonths >= rm.phases.length, `${target}: tháng ít hơn số chặng`);
  assert.equal(rm.phases.reduce((n,p)=>n+p.months,0), rm.totalMonths, `${target}: tổng chặng lệch`);
  assert.ok(rm.phases.some(p=>p.skills.includes('Writing')&&p.skills.includes('Speaking')), `${target}: thiếu chặng Writing/Speaking`);
  assert.ok(rm.phases.every((p,i)=>i===0||p.startMonth===rm.phases[i-1].endMonth+1), `${target}: chặng không liền mạch`);
  assert.ok(!JSON.stringify(rm).includes('sẽ lên band'), `${target}: hứa tăng band`);
}

// --- học ít hơn thì lộ trình DÀI ra, không phải ngắn đi
const slow = buildRoadmap(report, { ...valid, dailyMinutes:15 }, at);
const fast = buildRoadmap(report, { ...valid, dailyMinutes:60 }, at);
assert.ok(slow.totalMonths >= fast.totalMonths, 'học ít hơn mà lộ trình ngắn hơn');
assert.ok(slow.hoursPerWeek < fast.hoursPerWeek);

// --- ngày thi sớm hơn lộ trình thì cảnh báo, KHÔNG cắt chặng
const rushed = buildRoadmap(report, { ...valid, examTiming:'Trong 1 tháng' }, at);
assert.ok(rushed.deadline, 'thi trong 1 tháng mà không cảnh báo');
assert.equal(rushed.phases.length, buildRoadmap(report, valid, at).phases.length, 'đã cắt bớt chặng cho vừa ngày thi');
assert.ok(rushed.notes.some(n=>n.includes('lùi ngày thi')), 'không nêu lựa chọn lùi ngày thi');

// --- nhận xét: không bịa điểm mạnh/điểm yếu
const empty = grade({});
const vEmpty = buildVerdict(empty, buildRoadmap(empty, valid, at));
assert.equal(vEmpty.strengths.length, 0, 'bài trắng vẫn có điểm mạnh');
const perfect = grade(Object.fromEntries(exam.questions.map(q=>[q.id,q.accepted[0]])));
const vPerfect = buildVerdict(perfect, buildRoadmap(perfect, valid, at));
assert.equal(vPerfect.weaknesses.length, 0, 'bài đúng hết vẫn có điểm yếu');
assert.ok(!vPerfect.headline.includes('sàn sàn'), 'đúng hết mà nói sàn sàn nhau');
assert.ok(!vEmpty.headline.includes('sàn sàn'), 'sai hết mà nói sàn sàn nhau');
const vMid = buildVerdict(report, buildRoadmap(report, valid, at));
assert.ok(vMid.strengths.every(h=>h.handledBy===null), 'điểm mạnh bị gán chặng đi sửa');
assert.ok(vMid.weaknesses.every(h=>h.correct/h.total<0.6), 'điểm yếu có nhóm đúng trên 60%');

// --- chấm lại: phải phát hiện được bài làm thuộc đề đã đánh lại mã
assert.deepEqual(mismatchedAnswerIds(frac(62)), [], 'bài đúng đề mà báo lạc mã');
assert.deepEqual(mismatchedAnswerIds({ L01:'a', 'CU-99':'b', 'CU-98':'  ' }), ['CU-99'], 'không nhận ra mã lạc, hoặc tính cả câu bỏ trống');

console.log('Hồ sơ, mốc thi, lộ trình bốn kỹ năng, nhịp học, cảnh báo ngày thi và nhận xét mạnh/yếu đều khớp, chấm lại chặn được đề lạc mã.');
