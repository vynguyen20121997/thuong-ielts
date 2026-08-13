/**
 * Imports IELTS reading exercises from a pair of Google Docs (questions +
 * answer key) into Postgres.
 *
 * Why an extractor instead of hand-typed data: passages run ~900 words and every
 * answer carries a multi-paragraph explanation. Retyping that is where silent
 * corruption comes from — a dropped clause in a passage changes which answer is
 * correct, and nothing crashes. Everything textual here is SLICED VERBATIM from
 * the source document. The spec file supplies only structure: which lines are
 * the passage, which question is which type, where its options live.
 *
 * Explanations are copied in full, never summarised.
 *
 * Usage: npx tsx scripts/import-reading.ts <spec.json> [--dry]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

// ── Spec shape ────────────────────────────────────────────────────────────
interface LineRange {
  from: number;
  to: number;
}

interface OptionSetSpec extends LineRange {
  /** true when one line holds several options ("A  foo   B  bar"). */
  inline?: boolean;
  /**
   * Corrects an option whose text is mangled in the source document, keyed by
   * its marker. Used sparingly and listed in the run output so a silent
   * rewrite of exam content is impossible.
   */
  patch?: Record<string, string>;
}

interface QuestionSpec {
  n: number;
  type: string;
  /** Key into the test's `optionSets`. Omit for gap-fill. */
  options?: string;
  /** Literal option list, for TRUE/FALSE/NOT GIVEN and friends. */
  literalOptions?: string[];
  maxWords?: number;
  /** Instruction line shown above this question. */
  group?: string;
  /** Overrides the auto-extracted prompt (used for gaps inside a summary). */
  prompt?: string;
  /** Pull the prompt from the summary block instead of a question line. */
  fromSummary?: string;
  /** Extra accepted spellings for gap-fill. */
  acceptable?: string[];
  /**
   * Supplies an answer the source key omits entirely. Requires `note`, which is
   * prepended to the explanation so the student is told this one was derived
   * from the passage rather than taken from the official key.
   */
  answerOverride?: string;
  note?: string;
}

interface TestSpec {
  id: string;
  slug: string;
  title: string;
  collection: string;
  topic: string;
  level: "easy" | "medium" | "hard";
  sortOrder: number;
  publishedAt: string;
  durationSeconds?: number;
  passageTitle: string;
  passageIntro?: string;
  passage: LineRange & { labelled?: boolean };
  optionSets?: Record<string, OptionSetSpec>;
  summaries?: Record<string, LineRange>;
  questions: QuestionSpec[];
}

interface Spec {
  questionsDocId: string;
  answersDocId: string;
  tests: TestSpec[];
}

// ── Google Docs ───────────────────────────────────────────────────────────
async function fetchDocLines(docId: string): Promise<string[]> {
  const res = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`);
  if (!res.ok) throw new Error(`Cannot export doc ${docId}: HTTP ${res.status}`);
  const text = await res.text();
  return text.replace(/﻿/g, "").split(/\r?\n/);
}

/** 1-based, inclusive, matching what a human reads off the document. */
function slice(lines: string[], range: LineRange): string[] {
  return lines.slice(range.from - 1, range.to);
}

// ── Passage ───────────────────────────────────────────────────────────────
interface Paragraph {
  label?: string;
  text: string;
}

function extractParagraphs(lines: string[], range: LineRange & { labelled?: boolean }): Paragraph[] {
  const block = slice(lines, range).map((l) => l.trim());
  const paragraphs: Paragraph[] = [];

  // Horizontal rules used as separators are layout, not prose.
  const isRule = (line: string) => /^[—–\-_=*]+$/.test(line);

  if (!range.labelled) {
    for (const line of block) if (line && !isRule(line)) paragraphs.push({ text: line });
    return paragraphs;
  }

  // Labelled passages put the marker on its own line: "A" then the paragraph.
  let pending: string | undefined;
  for (const line of block) {
    if (!line || isRule(line)) continue;
    if (/^[A-Z]$/.test(line)) {
      pending = line;
      continue;
    }
    paragraphs.push(pending ? { label: pending, text: line } : { text: line });
    pending = undefined;
  }
  return paragraphs;
}

// ── Questions ─────────────────────────────────────────────────────────────
/**
 * Indexes "12   Some question text" lines by their number. The scan is
 * monotonic — a number is only accepted at or after the previously found one —
 * so a stray figure inside the passage cannot masquerade as a question.
 */
function indexQuestionLines(lines: string[]): Map<number, string> {
  const found = new Map<number, string>();
  let lastFound = 0;

  lines.forEach((line) => {
    const m = line.match(/^\s*(\d{1,2})[\s.)]\s*(\S.*)$/);
    if (!m) return;
    const n = Number(m[1]);
    if (n < lastFound || n > 40 || found.has(n)) return;
    found.set(n, m[2].trim());
    lastFound = n;
  });

  return found;
}

function extractOptions(lines: string[], spec: OptionSetSpec, label: string): string[] {
  const block = slice(lines, spec).map((l) => l.trim()).filter(Boolean);

  let options: string[];
  if (!spec.inline) {
    options = block.map(normaliseOption);
  } else {
    // "A   institution      B   mass production" -> two options.
    options = [];
    for (const line of block) {
      const parts = line.split(/\s{2,}(?=[A-L]\s)/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) options.push(normaliseOption(part));
    }
  }

  for (const [token, text] of Object.entries(spec.patch ?? {})) {
    const index = options.findIndex((o) => optionToken(o).toLowerCase() === token.toLowerCase());
    if (index === -1) throw new Error(`${label}: patch target "${token}" not found`);
    console.log(`    ! sửa lỗi doc gốc — ${label} [${token}]: "${options[index]}" -> "${token}. ${text}"`);
    options[index] = `${token}. ${text}`;
  }

  return options;
}

/** "iv     The time and place" -> "iv. The time and place" */
function normaliseOption(raw: string): string {
  const m = raw.match(/^([A-Za-z]{1,5}|[ivx]{1,5})[.)]?\s+(\S.*)$/);
  if (!m) return raw.trim().replace(/\s{2,}/g, " ");
  return `${m[1]}. ${m[2].trim().replace(/\s{2,}/g, " ")}`;
}

/** The leading marker of an option: "iv. The time..." -> "iv" */
function optionToken(option: string): string {
  const m = option.match(/^([A-Za-z]{1,5})[.)]\s/);
  return m ? m[1] : "";
}

/**
 * Finds the sentence holding gap `n` inside a summary block, so a
 * summary-completion question shows real context instead of a bare number.
 */
function sentenceForGap(lines: string[], range: LineRange, n: number): string {
  const marker = new RegExp(`\\b${n}\\s*[…\\.]`);
  const block = slice(lines, range)
    .map((l) => l.trim().replace(/^[●•·\-–—*]\s*/, ""))
    .filter(Boolean);

  // Notes are one gap per bullet line; summaries are paragraphs holding
  // several. Narrow to the line first, then to the sentence inside it.
  const line = block.find((l) => marker.test(l)) ?? block.join(" ");
  const sentences = line.split(/(?<=[.?!])\s+(?=[A-Z])/);
  const hit = sentences.find((s) => marker.test(s));
  return (hit ?? line).replace(/\s{2,}/g, " ").trim();
}

// ── Answer key ────────────────────────────────────────────────────────────
interface RawAnswer {
  answer: string;
  explanation: string;
}

/**
 * Parses "7. NOT GIVEN" followed by everything up to the next numbered answer.
 * The explanation is kept whole — every line of the teacher's commentary.
 */
function parseAnswerKey(lines: string[]): Map<number, RawAnswer> {
  const answers = new Map<number, RawAnswer>();
  const starts: { n: number; answer: string; line: number }[] = [];
  /** Every numbered line, including duplicates we skip — these bound explanations. */
  const allMarkers: number[] = [];
  let lastFound = 0;

  lines.forEach((line, i) => {
    const m = line.match(/^\s*(\d{1,2})\.\s*(\S.*)$/);
    if (!m) return;
    const n = Number(m[1]);
    if (n < lastFound || n > 40) return;
    allMarkers.push(i);
    if (answers.has(n)) {
      // A block duplicated in the source document. Keep the first copy and let
      // it end here, so the duplicate is not appended to its own explanation.
      console.log(`    ! doc gốc lặp câu ${n} — bỏ qua bản trùng ở dòng ${i + 1}`);
      return;
    }
    answers.set(n, { answer: "", explanation: "" });
    starts.push({ n, answer: m[2].trim(), line: i });
    lastFound = n;
  });

  starts.forEach((start) => {
    const next = allMarkers.find((line) => line > start.line);
    const end = next ?? lines.length;
    const explanation = lines
      .slice(start.line + 1, end)
      .map((l) => l.replace(/\s+$/, "").replace(/^\t+/, "").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    answers.set(start.n, { answer: start.answer, explanation });
  });

  return answers;
}

// ── Build ─────────────────────────────────────────────────────────────────
function buildTest(spec: TestSpec, qLines: string[], key: Map<number, RawAnswer>) {
  const questionText = indexQuestionLines(qLines);
  const optionSets = new Map<string, string[]>();
  for (const [name, setSpec] of Object.entries(spec.optionSets ?? {})) {
    optionSets.set(name, extractOptions(qLines, setSpec, `${spec.slug}/${name}`));
  }

  const questions: Record<string, unknown>[] = [];
  const answerKey: Record<string, unknown>[] = [];

  for (const q of spec.questions) {
    const id = `${spec.id}-q${q.n}`;
    let raw = key.get(q.n);

    if (q.answerOverride) {
      if (!q.note) throw new Error(`${spec.slug}: Q${q.n} override needs a note`);
      console.log(`    ! doc gốc thiếu câu ${q.n} — dùng đáp án bổ sung "${q.answerOverride}"`);
      raw = { answer: q.answerOverride, explanation: q.note };
    } else if (raw && q.note) {
      raw = { answer: raw.answer, explanation: `${q.note}\n\n${raw.explanation}` };
    }
    if (!raw) throw new Error(`${spec.slug}: no answer key entry for Q${q.n}`);

    let prompt = q.prompt;
    if (!prompt && q.fromSummary) {
      const summary = spec.summaries?.[q.fromSummary];
      if (!summary) throw new Error(`${spec.slug}: unknown summary "${q.fromSummary}"`);
      prompt = sentenceForGap(qLines, summary, q.n);
    }
    if (!prompt) prompt = questionText.get(q.n);
    if (!prompt) throw new Error(`${spec.slug}: could not find the text of Q${q.n}`);

    const base = { id, number: q.n, type: q.type, prompt, ...(q.group ? { group: q.group } : {}) };

    if (q.type === "gap-fill") {
      questions.push({ ...base, maxWords: q.maxWords ?? 2 });
      answerKey.push({
        questionId: id,
        answer: raw.answer,
        ...(q.acceptable ? { acceptable: q.acceptable } : {}),
        explanation: raw.explanation,
      });
      continue;
    }

    const options = q.literalOptions ?? optionSets.get(q.options ?? "");
    if (!options?.length) throw new Error(`${spec.slug}: Q${q.n} has no options`);

    // The key writes the answer as "NOT GIVEN", "iv", "B", or "B (plantation)".
    // Whichever form it uses, the stored answer must be the full option text so
    // the grader compares like with like. Exact match is tried before the
    // leading-marker match, or "NOT GIVEN" would be truncated to "NOT".
    const full = raw.answer.trim();
    const marker = full.match(/^([A-Za-z]{1,5})\b/)?.[1] ?? full;
    const matched =
      options.find((o) => o.toLowerCase() === full.toLowerCase()) ??
      options.find((o) => optionToken(o).toLowerCase() === marker.toLowerCase()) ??
      options.find((o) => o.toLowerCase() === marker.toLowerCase());
    if (!matched) {
      throw new Error(`${spec.slug}: Q${q.n} answer "${full}" matches none of its options`);
    }

    questions.push({ ...base, options });
    answerKey.push({ questionId: id, answer: matched, explanation: raw.explanation });
  }

  return {
    questions,
    answerKey,
    passage: {
      title: spec.passageTitle,
      ...(spec.passageIntro ? { intro: spec.passageIntro } : {}),
      paragraphs: extractParagraphs(qLines, spec.passage),
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const specPath = process.argv[2];
  const dryRun = process.argv.includes("--dry");
  if (!specPath) throw new Error("Usage: tsx scripts/import-reading.ts <spec.json> [--dry]");

  const spec = JSON.parse(fs.readFileSync(specPath, "utf-8")) as Spec;
  const [qLines, aLines] = await Promise.all([
    fetchDocLines(spec.questionsDocId),
    fetchDocLines(spec.answersDocId),
  ]);
  const key = parseAnswerKey(aLines);
  console.log(`Answer key: ${key.size} câu.`);

  for (const testSpec of spec.tests) {
    const built = buildTest(testSpec, qLines, key);
    const words = built.passage.paragraphs.reduce((n, p) => n + p.text.split(/\s+/).length, 0);
    const shortest = Math.min(...built.answerKey.map((e) => String(e.explanation).length));

    console.log(
      `  ${testSpec.slug.padEnd(44)} ${built.passage.paragraphs.length} đoạn / ${words} từ, ` +
        `${built.questions.length} câu, giải thích ngắn nhất ${shortest} ký tự`
    );

    if (dryRun) continue;

    await pool.query(
      `INSERT INTO reading_tests
         (id, slug, title, collection, topic, level, duration_seconds, question_count,
          attempt_count, is_free, status, sort_order, published_at, passage, questions, answer_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,true,'published',$9,$10,$11,$12,$13)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title, collection = EXCLUDED.collection, topic = EXCLUDED.topic,
         level = EXCLUDED.level, duration_seconds = EXCLUDED.duration_seconds,
         question_count = EXCLUDED.question_count, sort_order = EXCLUDED.sort_order,
         published_at = EXCLUDED.published_at, passage = EXCLUDED.passage,
         questions = EXCLUDED.questions, answer_key = EXCLUDED.answer_key, updated_at = now()`,
      [
        testSpec.id,
        testSpec.slug,
        testSpec.title,
        testSpec.collection,
        testSpec.topic,
        testSpec.level,
        testSpec.durationSeconds ?? 1200,
        built.questions.length,
        testSpec.sortOrder,
        testSpec.publishedAt,
        JSON.stringify(built.passage),
        JSON.stringify(built.questions),
        JSON.stringify(built.answerKey),
      ]
    );
  }

  await pool.end();
  console.log(dryRun ? "\nDry run — chưa ghi vào DB." : "\nĐã ghi vào DB.");
}

main().catch((err) => {
  console.error("Import failed:", err.message ?? err);
  process.exit(1);
});
