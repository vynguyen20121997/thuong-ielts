/**
 * Data integrity check for the listening exercises stored in Postgres.
 *
 * Same reasoning as validate-reading: content bugs are silent. A listening test
 * adds two failure modes a reading test cannot have — a missing or malformed audio
 * track (the student sees a player that never plays) and a prompt that the doc
 * parser picked up from the wrong line (a table cell like "19 Oct" is shaped
 * exactly like a question line), so those are checked too.
 *
 * Usage: npm run check:listening
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

import { isAnswerCorrect } from "../apps/web/src/features/practice/domain/scoring";
import {
  isChoiceQuestion,
  type AnswerKeyEntry,
  type ListeningTrack,
  type Question,
} from "../apps/web/src/features/practice/domain/types";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

interface Row {
  slug: string;
  status: string;
  question_count: number;
  audio: ListeningTrack[];
  questions: (Question & { section?: number })[];
  answer_key: AnswerKeyEntry[];
}

/**
 * A prompt this short usually means the gap sat in a table cell ("10………"), so
 * the row context lives in the group heading rather than the prompt. That is
 * ugly but correct, so it is reported as a warning, not a failure.
 */
const SHORT_PROMPT = 12;

/**
 * A prompt that is only a date is never correct: it means the parser mistook a
 * table cell such as "19 Oct" for a question line, which silently steals a
 * question number. This one is a hard failure.
 */
const DATE_PROMPT = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?$/i;

async function main() {
  const { rows } = await pool.query<Row>(
    `SELECT slug, status, question_count, audio, questions, answer_key
       FROM listening_tests
      ORDER BY sort_order, slug`
  );

  if (rows.length === 0) {
    console.error("No rows in listening_tests — the practice section will render empty.");
    process.exit(1);
  }

  const problems: string[] = [];
  const warnings: string[] = [];
  let totalQuestions = 0;

  for (const row of rows) {
    const where = `[${row.slug}]`;
    const questions = row.questions ?? [];
    const answerKey = row.answer_key ?? [];
    const audio = row.audio ?? [];
    totalQuestions += questions.length;

    if (audio.length === 0) problems.push(`${where} has no audio track`);
    for (const track of audio) {
      if (!track.src) problems.push(`${where} audio track "${track.label}" has no src`);
    }

    if (questions.length === 0) problems.push(`${where} has no questions`);
    if (row.question_count !== questions.length) {
      problems.push(
        `${where} question_count=${row.question_count} but has ${questions.length} questions`
      );
    }

    // Every section that has questions must have something to listen to.
    const sections = new Set(questions.map((q) => q.section).filter(Boolean));
    const parts = new Set(audio.map((t) => t.part).filter(Boolean));
    if (parts.size > 0) {
      for (const section of sections) {
        if (!parts.has(section)) {
          problems.push(`${where} section ${section} has questions but no audio`);
        }
      }
    }

    const keyByQuestion = new Map(answerKey.map((entry) => [entry.questionId, entry]));
    const questionIds = new Set(questions.map((q) => q.id));

    for (const entry of answerKey) {
      if (!questionIds.has(entry.questionId)) {
        problems.push(`${where} answer key references unknown question ${entry.questionId}`);
      }
    }

    for (const question of questions) {
      const prompt = question.prompt?.trim() ?? "";
      if (!prompt || DATE_PROMPT.test(prompt)) {
        problems.push(`${where} Q${question.number} prompt looks wrong: "${prompt}"`);
      } else if (prompt.length < SHORT_PROMPT) {
        warnings.push(`${where} Q${question.number} prompt is very short: "${prompt}"`);
      }

      const entry = keyByQuestion.get(question.id);
      if (!entry) {
        problems.push(`${where} Q${question.number} has no answer key entry`);
        continue;
      }

      if (isChoiceQuestion(question)) {
        if ((question.options?.length ?? 0) < 2) {
          problems.push(`${where} Q${question.number} has fewer than 2 options`);
        }
        if (new Set(question.options).size !== question.options.length) {
          problems.push(`${where} Q${question.number} has duplicate options`);
        }
        if (!question.options.includes(entry.answer)) {
          problems.push(
            `${where} Q${question.number} answer "${entry.answer}" is not one of its options`
          );
        }
      } else if (!entry.answer.trim()) {
        problems.push(`${where} Q${question.number} gap-fill has an empty answer`);
      }

      if (!isAnswerCorrect(entry, entry.answer)) {
        problems.push(
          `${where} Q${question.number} grader rejects its own answer "${entry.answer}"`
        );
      }
    }

    const flag = problems.some((p) => p.startsWith(where)) ? "FAIL" : "ok  ";
    const bySection = [...sections]
      .sort((a, b) => Number(a) - Number(b))
      .map((s) => `S${s}:${questions.filter((q) => q.section === s).length}`)
      .join(" ");
    console.log(
      `  ${flag} ${row.slug.padEnd(30)} ${row.status.padEnd(9)} ` +
        `${String(questions.length).padStart(2)} câu (${bySection}), ${audio.length} file nghe`
    );
  }

  await pool.end();

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} cảnh báo (không chặn):`);
    for (const warning of warnings) console.log(`  - ${warning}`);
  }

  if (problems.length > 0) {
    console.error(`\nFound ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(`\nOK — ${rows.length} đề listening, ${totalQuestions} câu, toàn bộ đáp án hợp lệ.`);
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
