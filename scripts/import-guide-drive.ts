/** Import the seven GUIDE papers supplied by the owner in Google Drive. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "apps", "web", ".env.local") });
const train = Number(process.argv.find(a=>a.startsWith("--train="))?.split("=")[1] ?? 0);
if (train && ![1,2].includes(train)) throw new Error("--train chỉ nhận 1 hoặc 2");
const sourceDir = path.join(root, ".tmp", train ? "train-source" : "guide-source");
const dry = process.argv.includes("--dry");

const AUDIO_IDS = [
  "1ZlUuikt2kHBt94P6RfY2fjSYHpHudV4v", "1PkODnZkEhqS90KdA2Izqv8rFfHrW7Mlr",
  "1T6e8HS80pfEHwDYIJdqdUyVnApfNvTIC", "1iMbFiN2UdQBPVPjUbQgL7QBSSCBKiy4R",
  "12GZ-OuMAv_WfJYThr7Hl8lBVB3fiDIY9", "13ld37dTVpwMfTxflBHTh93u_hATSIzo1",
  "1O4Tq81wDwkMuofz-65sbfoALVgQP_nko",
];
const TRAIN_1_AUDIO = ["1-Rg-bzvlrWB2Npz-MFTPqdNN8byCOKJa","1F2175bn8PjYXJQNoHWT-r1XYS17DQpnh","1OHp9BvtfLQpZSc-ybTeoLWZknZN0FC1Q","1jtvCOhVOyWIWsH_-Ya2u-CS3eslru3Sz"];
const TRAIN_2_AUDIO = [
  ["1EzJi96sqBpVPOpSi_OfNk1SUjd8a_j3Z","1vSQ55VCZ4yevvl-Hv2apGkcbvhLUr1Qb","1a2LIg2miNMTmbFthUanSego1vdFJ0K-m","1e3c6XbaCHuU7BFKjXBjItPe5iOm9E6vr"],
  ["1-2lanlGgjnoRd-Mo5n5YorZG7Z03GXhV","1IOg3FOORIOUAZDLtT7a6HrTf3DGgZy1w","1wH-DuQzAUTABYP0wuZFtUwc9ShNPcUD-","16FuY76E_Z9HRkDm-4HRjxagHJ8Sp2yvv"],
  ["1IjM5tjuPLwGZUCOLudAJGsrayLU9BRyE","1RpSNap9agW7fjk2j4OVTRffes5zb4o1l","1sARZo3AfvNXrsP-zPUJBdduLfaFARa1G","16aCzPIPzNpy15FhpP_seHGX7Dvr4El_N"],
  ["1l0m7ybBpgN2NZdOlhW2mTfAowmZlUUZL","1r1eXMWA8hyTLAUjiDriPNmahXevW1w6N","1iWf4yx_CsN6YAgHxkeMIYWyjoKgAk5th","1d2J38Sog9cXP2KT8VchkAqy5w1lwWxIk"],
  ["1-JILpaxXbsBijVfXIf1JBrJ5xZ0UwIvT","15rH0AVE2tj4zp8mw4RxvfKVc2el9W7QO","10dr8X-6zFShARb6U17Ast6wTY_yHXBu3","1chw1T_LXU2rmMyY2Db_j317WylV4kV97"],
  ["1AE7_uij3UWsVpD0P0gbksbudKUcIoM7S","1VrnZVbytfESmywnSkgVCwZMDIF2Cl6VS","1ZYyRRzJ_NpGuS5v-RQ-FdO4ZqUCs8tMI","1AAKlje-GFRdKbMQMdPElYTuQzMszk5tg"],
];

const collection = train ? `TRAIN ${train}` : "GUIDE";
const testCount = train === 1 ? 4 : train === 2 ? 6 : 7;
const stem = (skill:"r"|"l", test:number) => train ? `t${train}${skill}${test}` : `${skill}${test}`;

type Question = { id: string; number: number; section?: number; type: string; prompt: string; group?: string; options?: string[]; maxWords?: number };
type Answer = { questionId: string; answer: string; acceptable?: string[]; explanation: string };

function lines(file: string) {
  return fs.readFileSync(path.join(sourceDir, file), "utf8").replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D]/g, "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function parseAnswers(file: string) {
  const out = new Map<number, string>();
  for (const sourceLine of lines(file)) {
    const line = sourceLine.replace(/\(\s*in\s+(?:either|any)\s+order\s*\)/i, " ");
    const pair = line.match(/^(\d{1,2})\s*&\s*(\d{1,2})\s+(?:IN\s+(?:EITHER|ANY)\s+ORDER\s+)?([A-L])(?:\s*[,/]?\s*)([A-L])\b/i);
    if (pair) { out.set(Number(pair[1]),pair[3]); out.set(Number(pair[2]),pair[4]); continue; }
    const slashPair = line.match(/^(\d{1,2})\s*\/\s*(\d{1,2})[.)]?\s+([A-L])\s*(?:[/,]|and)\s*([A-L])\b/i);
    if (slashPair) { out.set(Number(slashPair[1]),slashPair[3]); out.set(Number(slashPair[2]),slashPair[4]); continue; }
    const pairText = line.match(/^(\d{1,2})\s*&\s*(\d{1,2})\s+(?:IN\s+(?:EITHER|ANY)\s+ORDER\s+)?(.+?)\s*;\s*(.+)$/i);
    if (pairText) { out.set(Number(pairText[1]),pairText[3].trim()); out.set(Number(pairText[2]),pairText[4].trim()); continue; }
    const m = line.match(/^(\d{1,2})[.)]?\s+(.+)$/);
    if (m && Number(m[1]) <= 40 && !out.has(Number(m[1]))) out.set(Number(m[1]), m[2].trim());
  }
  return out;
}

function cleanOption(s: string) {
  return s.replace(/^([A-L]|[ivxlcdm]+)[.)]?\s+/, "$1. ").replace(/\s+/g, " ").trim();
}

function optionsFrom(lines: string[]) {
  const out: string[] = [];
  for (const line of lines) {
    const split = line.split(/\s{2,}(?=[A-L][.)]?\s)/);
    const firstMarker = line.match(/^([A-L])[.)]?\s+/)?.[1];
    const secondMarker = split[1]?.match(/^([A-L])[.)]?\s+/)?.[1];
    const articleAmbiguity = split.length === 2 && secondMarker === "A" && firstMarker !== "A";
    const parts = /^[ivxlcdm]+[.)]?\s+/.test(line) || split.length < 2 || articleAmbiguity ? [line] : split;
    for (const part of parts) if (/^([A-L]|[ivxlcdm]+)[.)]?\s+\S/.test(part)) out.push(cleanOption(part));
  }
  return [...new Set(out)];
}

function marker(s: string) { return s.match(/^([A-L]|[ivxlcdm]+)[.)]?\s+/)?.[1] ?? ""; }

function splitAnswers(raw: string) {
  const cleaned = raw.replace(/\([^)]*(?:mark|required|order)[^)]*\)/gi, "").trim();
  const variants = cleaned.split(/\s*\/\s*/).map(s => s.replace(/^\(|\)$/g, "").trim()).filter(Boolean);
  return { answer: variants[0] ?? cleaned, acceptable: variants.slice(1) };
}

function questionType(instruction: string, options: string[]) {
  const t = instruction.toLowerCase();
  if (t.includes("true") && t.includes("false")) return "true-false-not-given";
  if (t.includes("yes") && t.includes("no") && t.includes("not given")) return "yes-no-not-given";
  if (/\bheadings?\b/.test(t)) return "matching-headings";
  if (/\bendings?\b/.test(t)) return "matching-endings";
  if (t.includes("which paragraph") || t.includes("which section")) return "matching-information";
  if (options.length) return "multiple-choice";
  return "gap-fill";
}

function parseQuestionRange(block: string[], from: number, to: number, prefix: string, section?: number) {
  const headers = block.map((s,i)=>{const m=s.match(/^Questions?\s+(\d+)(?:\s*(?:[-–&]|and)\s*(\d+))?/i);return m?{i,from:Number(m[1]),to:Number(m[2]??m[1])}:null}).filter(Boolean) as {i:number;from:number;to:number}[];
  const headerIndexes = headers.map(h=>h.i);
  const questions: Question[] = [];
  for (let n = from; n <= to; n++) {
    const pos = block.findIndex(s => new RegExp(`^${n}(?:[.)]|\\s)\\s*(\\S.*)$`).test(s));
    const dotted = block.findIndex(s => new RegExp(`\\b${n}\\s*[£$%€]?\\s*[.…]{2,}`).test(s));
    const embedded = block.findIndex(s => new RegExp(`\\b${n}\\s{2,}`).test(s));
    const matchingHeader = headers.find(h=>n>=h.from&&n<=h.to);
    let at = pos >= 0 ? pos : dotted >= 0 ? dotted : embedded;
    const groupStart = matchingHeader?.i ?? [...headerIndexes].reverse().find(i => i < at) ?? 0;
    if (at < 0 && matchingHeader) at = matchingHeader.i;
    if (at < 0) throw new Error(`${prefix}: không tìm thấy câu ${n}`);
    const groupEnd = headerIndexes.find(i => i > at) ?? block.length;
    const groupLines = block.slice(groupStart, groupEnd);
    const instruction = groupLines.slice(0, at === groupStart ? Math.min(6,groupLines.length) : Math.max(1, at - groupStart)).join("\n");
    let options = optionsFrom(groupLines);
    const nextQuestion = block.findIndex((s, i) => i > at && /^\d{1,2}[.)]?\s+\S/.test(s));
    const ownOptions = optionsFrom(block.slice(at + 1, nextQuestion > at ? nextQuestion : groupEnd));
    if (/choose .*?(?:letter|options?)/i.test(instruction) && ownOptions.length >= 2) options = ownOptions;
    const letterRange = instruction.match(/\b([A-L])\s*[-–]\s*([A-L])\b/i);
    if (options.length === 0 && letterRange) {
      for (let c=letterRange[1].toUpperCase().charCodeAt(0);c<=letterRange[2].toUpperCase().charCodeAt(0);c++) options.push(String.fromCharCode(c));
    }
    if (/which paragraph|which section/i.test(instruction)) {
      const end = letterRange?.[2]?.toUpperCase() ?? "H";
      options = Array.from({length:end.charCodeAt(0)-64},(_,i)=>String.fromCharCode(65+i));
    }
    if (/true/i.test(instruction) && /false/i.test(instruction)) options = ["TRUE", "FALSE", "NOT GIVEN"];
    if (/yes/i.test(instruction) && /no/i.test(instruction) && /not given/i.test(instruction)) options = ["YES", "NO", "NOT GIVEN"];
    if (/\b(?:NO MORE THAN|ONE WORD|TWO WORDS?|THREE WORDS?)\b/i.test(instruction) && !/choose .*?(?:letter|options?)/i.test(instruction)) options = [];
    if (options.length < 2) options = [];
    const fallbackPrompt = groupLines.find(s=>/^(Which|What|Where|Who|Why|How)\b/i.test(s));
    const own = (at===groupStart&&matchingHeader ? fallbackPrompt??`Question ${n}` : block[at].replace(new RegExp(`^${n}[.)]?\\s*`), ""))
      .replace(/[…\.]{3,}/g, "________").trim();
    const id = `${prefix}-q${n}`;
    const type = questionType(instruction, options);
    questions.push({ id, number: n, ...(section ? { section } : {}), type,
      prompt: own || `Question ${n}`, group: instruction,
      ...(type === "gap-fill" ? { maxWords: 3 } : { options }) });
  }
  return questions;
}

function answerEntries(questions: Question[], answers: Map<number, string>): Answer[] {
  return questions.map(q => {
    const raw = answers.get(q.number);
    if (!raw) throw new Error(`${q.id}: thiếu đáp án`);
    if (q.options?.length) {
      const trailing = raw.match(/\b([A-L]|[ivxlcdm]+)\s*$/i)?.[1];
      const token = raw.match(/^([A-L]|[ivxlcdm]+)\b/i)?.[1] ?? trailing ?? raw;
      const alias = raw.toUpperCase()==="TRUE"?"YES":raw.toUpperCase()==="FALSE"?"NO":trailing??raw;
      const aliasToken = alias.match(/^([A-L]|[ivxlcdm]+)\b/i)?.[1] ?? alias;
      const found = q.options.find(o => marker(o).toLowerCase() === aliasToken.toLowerCase())
        ?? q.options.find(o => o.toLowerCase() === alias.toLowerCase())
        ?? q.options.find(o => o.toLowerCase() === raw.toLowerCase());
      if (!found) throw new Error(`${q.id}: đáp án '${raw}' không khớp lựa chọn [${q.options.join(" | ")}]`);
      return { questionId: q.id, answer: found, explanation: "" };
    }
    const value = splitAnswers(raw);
    return { questionId: q.id, answer: value.answer, ...(value.acceptable.length ? { acceptable: value.acceptable } : {}), explanation: "" };
  });
}

function readingParts(test: number) {
  const all = lines(`${stem("r",test)}q.txt`);
  const startsByNumber = new Map<number,number>();
  all.forEach((s,i)=>{const m=s.match(/^(?:(?:READING\s+)?PASSAGE|PASSAGE\s+READING)[-\s]+([123])\??$/i);if(m&&!startsByNumber.has(Number(m[1])))startsByNumber.set(Number(m[1]),i)});
  const starts = [1,2,3].map(n=>startsByNumber.get(n)).filter((i):i is number=>i!==undefined);
  if (starts.length !== 3) throw new Error(`GUIDE Reading Test ${test}: cần 3 passage, thấy ${starts.length}`);
  const key = parseAnswers(`${stem("r",test)}a.txt`);
  // The supplied Test 6 key switches to an unrelated paper after question 13.
  // These values are reconstructed directly from its Kefir passage/questions.
  if (!train && test === 6) {
    const corrected: Record<number,string> = {14:"viii",15:"iii",16:"vii",17:"i",18:"vi",19:"ix",20:"ii",
      21:"cauliflower rosettes",22:"periodic unsettling",23:"milk sugars",24:"liquefied yogurt",25:"C",26:"E"};
    for (const [n,value] of Object.entries(corrected)) key.set(Number(n),value);
    console.log("  ! Reading GUIDE 6: đã sửa đáp án 14-26 từ chính nội dung passage (file answer bị ghép nhầm)");
  }
  const passageFirstQuestions = starts.map((start, index) => {
    const block = all.slice(start, starts[index + 1] ?? all.length);
    const first = block.map(s => Number(s.match(/^Questions?\s+(\d+)/i)?.[1])).find(Number.isFinite);
    if (!first) throw new Error(`GUIDE Reading Test ${test} Passage ${index + 1}: thiếu nhóm câu hỏi`);
    return first;
  });
  return starts.map((start, index) => {
    const block = all.slice(start, starts[index + 1] ?? all.length);
    const firstHeader = block.findIndex(s => /^Questions?\s+\d/i.test(s));
    const rangeFrom = [1,14,27][index];
    const rangeTo = [13,26,40][index];
    const titleIndex = block.findIndex((s, i) =>
      i > 0 &&
      !/^You should spend about \d+ minutes/i.test(s) &&
      !/^OFFICIAL CAMBRIDGE/i.test(s),
    );
    const title = block[titleIndex] ?? `Passage ${index + 1}`;
    const prose = block.slice(titleIndex + 1, firstHeader).filter(s => !/^OFFICIAL CAMBRIDGE/i.test(s));
    const labelled = prose.some(s => /^[A-Z]$/.test(s));
    const paragraphs: {label?:string;text:string}[] = [];
    let pending: string | undefined;
    for (const s of prose) { if (/^[A-Z]$/.test(s)) { pending=s; continue; } paragraphs.push(pending ? {label:pending,text:s}:{text:s}); pending=undefined; }
    const questions = parseQuestionRange(all, rangeFrom, rangeTo, `guide-r${test}-p${index+1}`);
    return { title, paragraphs, questions, answers: answerEntries(questions, key), labelled };
  });
}

function listening(test: number) {
  const all = lines(`${stem("l",test)}q.txt`), key = parseAnswers(`${stem("l",test)}a.txt`);
  const questions = [1,2,3,4].flatMap(section=>parseQuestionRange(all,(section-1)*10+1,section*10,`guide-l${test}`,section));
  return { questions, answers: answerEntries(questions,key) };
}

const pool = new Pool({ host:process.env.PGHOST, port:Number(process.env.PGPORT??5432), user:process.env.PGUSER,
  password:process.env.PGPASSWORD, database:process.env.PGDATABASE, ssl:{rejectUnauthorized:false} });

async function main() {
  const failures: string[] = [];
  for (let test=1;test<=testCount;test++) {
    try {
      const parts=readingParts(test);
      for (let i=0;i<parts.length;i++) {
      const base = train ? `train${train}` : "guide";
      const p=parts[i], slug=`${base}-test${test}-passage-${i+1}`;
      console.log(`Reading ${collection} ${test} P${i+1}: ${p.questions.length} câu`);
      if (!dry) await pool.query(`INSERT INTO reading_tests (id,slug,title,collection,topic,level,duration_seconds,question_count,attempt_count,is_free,status,sort_order,published_at,passage,questions,answer_key)
        VALUES($1,$1,$2,$3,$4,'medium',1200,$5,0,true,'published',$6,CURRENT_DATE,$7,$8,$9)
        ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,collection=EXCLUDED.collection,topic=EXCLUDED.topic,question_count=EXCLUDED.question_count,status='published',sort_order=EXCLUDED.sort_order,passage=EXCLUDED.passage,questions=EXCLUDED.questions,answer_key=EXCLUDED.answer_key,updated_at=now()`,
        [slug,`${collection} · Test ${test} · Passage ${i+1}: ${p.title}`,collection,p.title,p.questions.length,(900000+train*10000)+test*10+i+1,JSON.stringify({title:p.title,paragraphs:p.paragraphs}),JSON.stringify(p.questions),JSON.stringify(p.answers)]);
      }
    } catch (e) { failures.push(`Reading ${collection} ${test}: ${(e as Error).message}`); }
    try {
      const base = train ? `train${train}` : "guide";
      const l=listening(test), slug=`${base}-listening-test${test}`;
      const audioIds = train === 1 ? [TRAIN_1_AUDIO[test-1]] : train === 2 ? TRAIN_2_AUDIO[test-1] : [AUDIO_IDS[test-1]];
      const audio = audioIds.map((id,index)=>({...(audioIds.length>1?{part:index+1}:{}),src:`/api/practice/listening/audio/${id}`,label:audioIds.length>1?`Part ${index+1}`:`${collection} Test ${test}`}));
      console.log(`Listening ${collection} ${test}: ${l.questions.length} câu`);
      if (!dry) await pool.query(`INSERT INTO listening_tests (id,slug,title,collection,topic,level,duration_seconds,question_count,attempt_count,is_free,status,sort_order,published_at,note,audio,questions,answer_key)
      VALUES($1,$1,$2,$3,$4,'medium',1800,$5,0,true,'published',$6,CURRENT_DATE,NULL,$7,$8,$9)
      ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,collection=EXCLUDED.collection,question_count=EXCLUDED.question_count,status='published',sort_order=EXCLUDED.sort_order,audio=EXCLUDED.audio,questions=EXCLUDED.questions,answer_key=EXCLUDED.answer_key,updated_at=now()`,
        [slug,`${collection} · Listening Test ${test}`,collection,`IELTS ${collection}`,l.questions.length,(900000+train*10000)+test,JSON.stringify(audio),JSON.stringify(l.questions),JSON.stringify(l.answers)]);
    } catch (e) { failures.push(`Listening ${collection} ${test}: ${(e as Error).message}`); }
  }
  await pool.end();
  if (failures.length) console.error(`\nKhông nhập các phần lỗi:\n- ${failures.join("\n- ")}`);
  console.log(dry?'Dry run hoàn tất.':'Đã nhập các đề GUIDE hợp lệ vào database.');
}
main().catch(async e=>{console.error(e.message??e);await pool.end().catch(()=>{});process.exit(1)});
