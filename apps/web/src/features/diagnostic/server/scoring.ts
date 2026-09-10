import exam from './exam.json';
import type { Paper, Report, Section, ItemResult } from '../types';
export type Exam = typeof exam;
export { exam };
export const normalize = (value:string) => value.trim().replace(/\s+/g,' ').toLowerCase();
export function publicPaper(source:Exam):Paper {
  return { version:source.version, duration:source.duration, passage:source.passage, title:source.title, audio:source.audio,
    questions:source.questions.map(q=>({id:q.id,section:q.section as Section,prompt:q.prompt,options:q.options,limit:'limit' in q?q.limit:undefined})) };
}
export function grade(answers:Record<string,string>, source:Exam=exam):Report {
  const items:ItemResult[]=source.questions.map(q=>{const answer=answers[q.id]??''; const correct=q.accepted.some(a=>normalize(a)===normalize(answer));
    const wrong='wrongReviews' in q ? q.wrongReviews as Record<string,string> : {};
    return {...publicPaper(source).questions.find(p=>p.id===q.id)!,evidence:'evidence' in q?q.evidence:undefined,answer,expected:q.accepted.join(' / '),correct,explanation:q.explanation,review:!answer.trim()?'Chưa trả lời — cần làm lại để có thêm căn cứ.':wrong?.[answer]??q.review,area:q.area}; });
  const areas=source.areas.map(a=>{const subset=items.filter(q=>a.id==='R_VOCABULARY_OVERALL'?q.section==='Reading':q.area===a.id); const correct=subset.filter(q=>q.correct).length;const level=correct>=a.thresholds[1]?2:correct>=a.thresholds[0]?1:0;
    return {id:a.id,name:a.name,section:a.section as Section,correct,total:subset.length,level,feedback:a.feedback[level],review:subset.filter(q=>!q.correct).map(q=>({id:q.id,text:q.review,blank:!q.answer.trim()}))};});
  return {items,areas,scores:{Listening:items.filter(q=>q.section==='Listening'&&q.correct).length,Reading:items.filter(q=>q.section==='Reading'&&q.correct).length,Grammar:items.filter(q=>q.section==='Grammar'&&q.correct).length},blanks:items.filter(q=>!q.answer.trim()).length};
}
