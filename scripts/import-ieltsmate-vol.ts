/**
 * Import VOL 1-10 Reading and Listening from IELTS Mate's public practice API.
 *
 * The source exposes one reusable room per passage/section. This importer finds
 * those rooms, downloads their public content, converts it to our deliberately
 * small practice schema, validates every converted question, then upserts it.
 *
 * Usage:
 *   npx tsx scripts/import-ieltsmate-vol.ts --dry
 *   npx tsx scripts/import-ieltsmate-vol.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

const API = "https://api.ieltsmate.vn/api";
const sourceToken = process.env.IELTSMATE_TOKEN;
const dryRun = process.argv.includes("--dry");
const only = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1];
const skills = only ? [only] : ["reading", "listening"];
if (skills.some((skill) => skill !== "reading" && skill !== "listening")) {
  throw new Error("--only must be reading or listening");
}

const TESTS_PER_VOL: Record<number, number> = {
  1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 16, 8: 12, 9: 12, 10: 6,
};
const LISTENING_TESTS_PER_VOL: Record<number, number> = {
  1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 11, 8: 8, 9: 9, 10: 2,
};

type Json = Record<string, any>;
type Skill = "reading" | "listening";
type Question = {
  id: string;
  number: number;
  section?: number;
  type: string;
  prompt: string;
  group?: string;
  options?: string[];
  maxWords?: number;
};
type Answer = { questionId: string; answer: string; acceptable?: string[]; explanation?: string };

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
  max: 4,
});

function decodeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/h\d\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function getJson(url: string, attempts = 4): Promise<Json> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { headers: {
        accept: "application/json",
        ...(sourceToken ? { authorization: `Bearer ${sourceToken}` } : {}),
      } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json() as Json;
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
    }
  }
  throw last;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  }));
  return output;
}

function targets(skill: Skill = "reading") {
  const result: { vol: number; test: number; testSet: string }[] = [];
  const testCounts = skill === "listening" ? LISTENING_TESTS_PER_VOL : TESTS_PER_VOL;
  for (let vol = 1; vol <= 10; vol += 1) {
    for (let test = 1; test <= testCounts[vol]; test += 1) {
      result.push({ vol, test, testSet: `VOL ${vol} TEST ${test}` });
    }
  }
  return result;
}

async function findRooms(skill: Skill, target: ReturnType<typeof targets>[number]) {
  const params = new URLSearchParams({
    type: skill,
    contentType: "academic",
    source: "vol",
    testSet: target.testSet,
    status: "waiting",
    page: "1",
    limit: "100",
  });
  const result = await getJson(`${API}/study-room?${params}`);
  const count = skill === "reading" ? 3 : 4;
  const label = skill === "reading" ? "PASSAGE" : "SECTION";
  const rooms = [];
  for (let part = 1; part <= count; part += 1) {
    const expected = `${target.testSet} ${label} ${part}`;
    const room = (result.data ?? []).find((item: Json) => item.title?.toUpperCase() === expected);
    if (!room) throw new Error(`${expected}: không tìm thấy phòng nguồn`);
    rooms.push({ ...room, part });
  }
  return rooms;
}

function rawOptions(set: Json, q: Json): { token: string; text: string; correct?: boolean }[] {
  const candidates = [q.options, q.single_choice_radio, q.mutilple_choice, set.options,
    q.selection_option, q.matching_heading_paragraph];
  for (const value of candidates) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const mapped = value.map((item: any, index: number) => {
      if (typeof item === "string") return { token: item.trim(), text: item.trim() };
      return {
        token: String(item.option ?? item.value ?? item.label ?? index + 1).trim(),
        text: decodeHtml(item.text ?? item.title ?? item.value ?? item.option),
        correct: item.is_correct ?? item.correct,
      };
    }).filter((item: any) => item.token || item.text);
    if (mapped.length) return mapped;
  }
  return [];
}

function answerStrings(q: Json, options: ReturnType<typeof rawOptions>): string[] {
  const raw = Array.isArray(q.correct_answers) && q.correct_answers.length > 0 ? q.correct_answers :
    (q.correct_answer || undefined) ??
    (Array.isArray(q.selection) && q.selection[0]?.answer ? q.selection.map((item: Json) => item.answer) : undefined) ??
    options.filter((o) => o.correct).map((o) => o.token);
  const values = Array.isArray(raw) ? raw : [raw];
  return values
    .flatMap((value) => typeof value === "string" ? value.split(/\s*[,;/|]\s*/) : [value])
    .map((value) => decodeHtml(value))
    .filter(Boolean);
}

function questionType(raw: string, hasOptions: boolean): string {
  const type = raw.toUpperCase();
  if (/TRUE_FALSE/.test(type)) return "true-false-not-given";
  if (/YES_NO/.test(type)) return "yes-no-not-given";
  if (/MATCHING_HEAD/.test(type)) return "matching-headings";
  if (/MATCHING_END/.test(type)) return "matching-endings";
  if (/MATCHING_INFO/.test(type)) return "matching-information";
  if (/MATCHING_(FEATURE|NAME)/.test(type)) return "matching-features";
  if (/SUMMARY/.test(type) && hasOptions) return "summary-completion";
  if (/MULTIPLE|SINGLE|TABLE_SELECTION|SELECTION/.test(type) || hasOptions) return "multiple-choice";
  return "gap-fill";
}

function choiceText(option: { token: string; text: string }): string {
  if (!option.text || option.text.toLowerCase() === option.token.toLowerCase()) return option.token;
  return `${option.token}. ${option.text}`;
}

function matchAnswer(raw: string, options: string[]): string | null {
  const clean = raw.trim();
  const token = clean.match(/^([A-Za-z]+|[ivxlcdm]+|\d+)\b/i)?.[1] ?? clean;
  return options.find((o) => o.toLowerCase() === clean.toLowerCase()) ??
    options.find((o) => o.split(/[. ):-]/, 1)[0].toLowerCase() === token.toLowerCase()) ??
    options.find((o) => o.toLowerCase().includes(clean.toLowerCase())) ?? null;
}

function convertPart(detail: Json, skill: Skill, partNumber: number) {
  const part = detail.content?.parts?.[0];
  if (!part) throw new Error(`${detail.title}: nguồn không có part`);
  const questions: Question[] = [];
  const answers: Answer[] = [];

  for (const set of part.question_sets ?? []) {
    const group = [decodeHtml(set.title), decodeHtml(set.description || set.instruction)]
      .filter(Boolean).join("\n");
    for (const q of set.questions ?? []) {
      const number = Number(q.order ?? q.sort);
      if (!Number.isFinite(number) || number < 1) throw new Error(`${detail.title}: số câu lỗi`);
      const id = `${skill === "reading" ? "vol-r" : "vol-l"}-${detail.content.testSet ?? detail.testSet}-q${number}`
        .toLowerCase().replace(/\s+/g, "-");
      const opts = rawOptions(set, q);
      const type = questionType(q.question_type ?? set.question_type ?? "", opts.length > 0);
      const prompt = decodeHtml(q.text || q.description || q.content || q.title || set.content || set.description);
      if (!prompt) throw new Error(`${detail.title} Q${number}: prompt trống`);
      const rawAnswers = answerStrings(q, opts);
      if (rawAnswers.length === 0) throw new Error(`${detail.title} Q${number}: đáp án trống`);
      const base: Question = {
        id, number, ...(skill === "listening" ? { section: partNumber } : {}), type, prompt,
        ...(group ? { group } : {}),
      };
      if (type === "gap-fill") {
        questions.push({ ...base, maxWords: 3 });
        answers.push({ questionId: id, answer: rawAnswers[0],
          ...(rawAnswers.length > 1 ? { acceptable: rawAnswers.slice(1) } : {}),
          explanation: decodeHtml(q.explain ?? q.short_explain) });
      } else {
        let optionTexts = opts.map(choiceText);
        if (/true-false/.test(type) && optionTexts.length === 0) optionTexts = ["TRUE", "FALSE", "NOT GIVEN"];
        if (/yes-no/.test(type) && optionTexts.length === 0) optionTexts = ["YES", "NO", "NOT GIVEN"];
        if (optionTexts.length < 2) throw new Error(`${detail.title} Q${number}: thiếu lựa chọn (${q.question_type})`);
        const matched = matchAnswer(rawAnswers[0], optionTexts);
        if (!matched) throw new Error(`${detail.title} Q${number}: đáp án '${rawAnswers[0]}' không khớp lựa chọn`);
        questions.push({ ...base, options: optionTexts });
        answers.push({ questionId: id, answer: matched, explanation: decodeHtml(q.explain ?? q.short_explain) });
      }
    }
  }
  return { part, questions, answers };
}

function readingPassage(part: Json) {
  const paragraphs: { label?: string; text: string }[] = [];
  for (const vocab of part.vocabs ?? []) {
    for (const child of vocab.children ?? []) {
      const text = decodeHtml(child.value);
      if (!text) continue;
      const match = text.match(/^([A-Z])\s+(.*)$/s);
      paragraphs.push(match ? { label: match[1], text: match[2] } : { text });
    }
  }
  if (!paragraphs.length) {
    const text = decodeHtml(part.content);
    if (text) paragraphs.push({ text });
  }
  return { title: decodeHtml(part.title) || "Reading passage", paragraphs };
}

function audioTracks(details: Json[]) {
  return details.map((detail, index) => {
    const part = detail.content?.parts?.[0] ?? {};
    const src = part.audio_url ?? part.audioUrl ?? part.audio ?? detail.content?.audio_url ??
      detail.content?.audioUrl ?? detail.audioUrl;
    if (!src) throw new Error(`${detail.title}: thiếu audio`);
    return { part: index + 1, src: String(src), label: `Section ${index + 1}` };
  });
}

async function upsertReading(target: ReturnType<typeof targets>[number], details: Json[]) {
  for (let index = 0; index < details.length; index += 1) {
    const converted = convertPart(details[index], "reading", index + 1);
    const slug = `vol-${target.vol}-test-${target.test}-passage-${index + 1}`;
    if (dryRun) continue;
    await pool.query(`INSERT INTO reading_tests
      (id,slug,title,collection,topic,level,duration_seconds,question_count,attempt_count,is_free,status,sort_order,published_at,passage,questions,answer_key)
      VALUES ($1,$2,$3,$4,$5,'medium',1200,$6,0,true,'published',$7,CURRENT_DATE,$8,$9,$10)
      ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title,collection=EXCLUDED.collection,topic=EXCLUDED.topic,
      duration_seconds=EXCLUDED.duration_seconds,question_count=EXCLUDED.question_count,status='published',sort_order=EXCLUDED.sort_order,
      passage=EXCLUDED.passage,questions=EXCLUDED.questions,answer_key=EXCLUDED.answer_key,updated_at=now()`, [
      slug, slug, `${target.testSet} Passage ${index + 1}`, `VOL ${target.vol}`,
      converted.part.title ?? target.testSet, converted.questions.length,
      target.vol * 10000 + target.test * 10 + index + 1, JSON.stringify(readingPassage(converted.part)),
      JSON.stringify(converted.questions), JSON.stringify(converted.answers),
    ]);
  }
}

async function upsertListening(target: ReturnType<typeof targets>[number], details: Json[]) {
  const converted = details.map((detail, index) => convertPart(detail, "listening", index + 1));
  const questions = converted.flatMap((part) => part.questions).sort((a, b) => a.number - b.number);
  const answers = converted.flatMap((part) => part.answers);
  const slug = `vol-${target.vol}-test-${target.test}-listening`;
  if (dryRun) return;
  await pool.query(`INSERT INTO listening_tests
    (id,slug,title,collection,topic,level,duration_seconds,question_count,attempt_count,is_free,status,sort_order,published_at,note,audio,questions,answer_key)
    VALUES ($1,$2,$3,$4,'General','medium',1800,$5,0,true,'published',$6,CURRENT_DATE,NULL,$7,$8,$9)
    ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title,collection=EXCLUDED.collection,
    duration_seconds=EXCLUDED.duration_seconds,question_count=EXCLUDED.question_count,status='published',sort_order=EXCLUDED.sort_order,
    note=EXCLUDED.note,audio=EXCLUDED.audio,questions=EXCLUDED.questions,answer_key=EXCLUDED.answer_key,updated_at=now()`, [
    slug, slug, `${target.testSet} Listening`, `VOL ${target.vol}`, questions.length,
    target.vol * 1000 + target.test, JSON.stringify(audioTracks(details)), JSON.stringify(questions), JSON.stringify(answers),
  ]);
}

async function main() {
  let written = 0;
  for (const skill of skills as Skill[]) {
    const allTargets = targets(skill);
    console.log(`\n${skill.toUpperCase()} — tìm ${allTargets.length} test...`);
    const roomSets = await mapLimit(allTargets, 8, async (target) => ({
      target, rooms: await findRooms(skill, target),
    }));
    for (const { target, rooms } of roomSets) {
      const details = await mapLimit(rooms, 4, (room) => getJson(`${API}/study-room/room/${room.id}`));
      if (skill === "reading") await upsertReading(target, details);
      else await upsertListening(target, details);
      written += skill === "reading" ? 3 : 1;
      console.log(`  ok ${target.testSet.padEnd(14)} ${details.length} ${skill === "reading" ? "passage" : "section"}`);
    }
  }
  await pool.end();
  console.log(`\n${dryRun ? "Dry run hoàn tất" : "Đã ghi DB"}: ${written} đề.`);
}

main().catch(async (error) => {
  console.error("Import failed:", error?.message ?? error);
  await pool.end().catch(() => {});
  process.exit(1);
});
