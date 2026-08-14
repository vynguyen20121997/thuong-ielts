/**
 * Imports IELTS listening exercises from a pair of Google Docs plus the Drive
 * ids of the recordings.
 *
 * Shares all document parsing with the reading importer (scripts/lib/ielts-doc)
 * — same house style, same answer-key quirks. What differs is what surrounds the
 * questions: a listening test has recordings and four sections instead of a
 * passage.
 *
 * Usage: npx tsx scripts/import-listening.ts <spec.json> [--dry]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

import {
  expandGapAnswer,
  explanationMatchesQuestion,
  extractOptions,
  fetchDocLines,
  indexQuestionLines,
  optionToken,
  parseAnswerKey,
  sentenceForGap,
  type LineRange,
  type OptionSetSpec,
  type RawAnswer,
} from "./lib/ielts-doc";

interface QuestionSpec {
  n: number;
  /** Which recorded part (1-4) this question belongs to. */
  section: number;
  type: string;
  options?: string;
  literalOptions?: string[];
  maxWords?: number;
  group?: string;
  prompt?: string;
  fromSummary?: string;
  acceptable?: string[];
  /**
   * Replaces the answer read from the key. For the handful of entries whose
   * notation is genuinely ambiguous — "(£) 115 / a/one hundred (and) fifteen"
   * packs three spellings and an optional symbol into one line — the expander
   * produces nonsense, so the forms are written out by hand instead. The doc's
   * explanation is still kept.
   */
  answer?: string;
}

interface TrackSpec {
  part?: number;
  /** Drive file id; turned into a proxy URL. Use `src` to point elsewhere. */
  driveId?: string;
  src?: string;
  label?: string;
}

interface TestSpec {
  questionsDocId?: string;
  answersDocId?: string;
  id: string;
  slug: string;
  title: string;
  collection: string;
  topic: string;
  level: "easy" | "medium" | "hard";
  sortOrder: number;
  publishedAt: string;
  durationSeconds?: number;
  /** Caveat shown above the player, e.g. "only Part 1 has a recording". */
  note?: string;
  audio: TrackSpec[];
  optionSets?: Record<string, OptionSetSpec>;
  summaries?: Record<string, LineRange>;
  questions: QuestionSpec[];
}

interface Spec {
  questionsDocId?: string;
  answersDocId?: string;
  tests: TestSpec[];
}

/**
 * A browser cannot fetch a Drive file directly (Google answers media requests
 * with an HTML interstitial and no CORS header), so recordings are served
 * through our own route. Storing the finished URL keeps that decision out of
 * the UI and makes a later move to object storage a data update.
 */
function trackUrl(track: TrackSpec): string {
  if (track.src) return track.src;
  if (!track.driveId) throw new Error("audio track cần driveId hoặc src");
  return `/api/practice/listening/audio/${track.driveId}`;
}

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
    if (!raw) throw new Error(`${spec.slug}: thiếu đáp án cho câu ${q.n}`);

    let prompt = q.prompt;
    if (!prompt && q.fromSummary) {
      const summary = spec.summaries?.[q.fromSummary];
      if (!summary) throw new Error(`${spec.slug}: không có summary "${q.fromSummary}"`);
      prompt = sentenceForGap(qLines, summary, q.n);
    }
    if (!prompt) prompt = questionText.get(q.n);
    if (!prompt) throw new Error(`${spec.slug}: không tìm được nội dung câu ${q.n}`);

    if (raw.explanation && !explanationMatchesQuestion(raw.explanation, prompt)) {
      console.log(`    ! Q${q.n}: giải thích thuộc câu khác — đã bỏ`);
      raw = { answer: raw.answer, explanation: "" };
    }

    const base = {
      id,
      number: q.n,
      section: q.section,
      type: q.type,
      prompt,
      ...(q.group ? { group: q.group } : {}),
    };

    if (q.type === "gap-fill") {
      if (q.answer) {
        console.log(`    ! Q${q.n}: ký hiệu đáp án gốc "${raw.answer}" — thay bằng "${q.answer}"`);
      }
      const expanded = expandGapAnswer(q.answer ?? raw.answer);
      const acceptable = [...new Set([...expanded.acceptable, ...(q.acceptable ?? [])])];
      if (expanded.acceptable.length) {
        console.log(
          `    · Q${q.n} "${raw.answer}" -> "${expanded.answer}" (nhận thêm: ${expanded.acceptable.join(", ")})`
        );
      }
      questions.push({ ...base, maxWords: q.maxWords ?? 2 });
      answerKey.push({
        questionId: id,
        answer: expanded.answer,
        ...(acceptable.length ? { acceptable } : {}),
        explanation: raw.explanation,
      });
      continue;
    }

    const options = q.literalOptions ?? optionSets.get(q.options ?? "");
    if (!options?.length) throw new Error(`${spec.slug}: câu ${q.n} không có lựa chọn`);

    const full = raw.answer.trim();
    const marker = full.match(/^([A-Za-z]{1,5})\b/)?.[1] ?? full;
    const matched =
      options.find((o) => o.toLowerCase() === full.toLowerCase()) ??
      options.find((o) => optionToken(o).toLowerCase() === marker.toLowerCase()) ??
      options.find((o) => o.toLowerCase() === marker.toLowerCase());
    if (!matched) {
      throw new Error(`${spec.slug}: câu ${q.n} đáp án "${full}" không khớp lựa chọn nào`);
    }

    questions.push({ ...base, options });
    answerKey.push({ questionId: id, answer: matched, explanation: raw.explanation });
  }

  const audio = spec.audio.map((t, i) => ({
    ...(t.part ? { part: t.part } : {}),
    src: trackUrl(t),
    label: t.label ?? (t.part ? `Part ${t.part}` : `Bài nghe ${i + 1}`),
  }));

  return { questions, answerKey, audio };
}

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
  if (!specPath) throw new Error("Usage: tsx scripts/import-listening.ts <spec.json> [--dry]");

  const spec = JSON.parse(fs.readFileSync(specPath, "utf-8")) as Spec;

  const docCache = new Map<string, Promise<string[]>>();
  const getDoc = (id: string) => {
    if (!docCache.has(id)) docCache.set(id, fetchDocLines(id));
    return docCache.get(id)!;
  };

  for (const testSpec of spec.tests) {
    const qId = testSpec.questionsDocId ?? spec.questionsDocId;
    const aId = testSpec.answersDocId ?? spec.answersDocId;
    if (!qId || !aId) throw new Error(`${testSpec.slug}: thiếu questionsDocId/answersDocId`);

    const [qLines, aLines] = await Promise.all([getDoc(qId), getDoc(aId)]);
    const key = parseAnswerKey(aLines);
    const built = buildTest(testSpec, qLines, key);

    const bySection = built.questions.reduce<Record<number, number>>((acc, q) => {
      const s = Number(q.section) || 0;
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});

    console.log(
      `  ${testSpec.slug.padEnd(42)} ${built.questions.length} câu ` +
        `(${Object.entries(bySection).map(([s, n]) => `S${s}:${n}`).join(" ")}), ` +
        `${built.audio.length} file nghe`
    );

    if (dryRun) continue;

    await pool.query(
      `INSERT INTO listening_tests
         (id, slug, title, collection, topic, level, duration_seconds, question_count,
          attempt_count, is_free, status, sort_order, published_at, note, audio, questions, answer_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,true,'published',$9,$10,$11,$12,$13,$14)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title, collection = EXCLUDED.collection, topic = EXCLUDED.topic,
         level = EXCLUDED.level, duration_seconds = EXCLUDED.duration_seconds,
         question_count = EXCLUDED.question_count, sort_order = EXCLUDED.sort_order,
         published_at = EXCLUDED.published_at, note = EXCLUDED.note, audio = EXCLUDED.audio,
         questions = EXCLUDED.questions, answer_key = EXCLUDED.answer_key, updated_at = now()`,
      [
        testSpec.id,
        testSpec.slug,
        testSpec.title,
        testSpec.collection,
        testSpec.topic,
        testSpec.level,
        testSpec.durationSeconds ?? 1800,
        built.questions.length,
        testSpec.sortOrder,
        testSpec.publishedAt,
        testSpec.note ?? null,
        JSON.stringify(built.audio),
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
