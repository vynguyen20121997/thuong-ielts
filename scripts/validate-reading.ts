/**
 * Data integrity check for the reading exercises stored in Postgres.
 *
 * Postgres is the single source of truth for exam content, which means content
 * bugs are silent: an answer key pointing at a string that is not one of the
 * options grades every student wrong and nothing crashes. This script reads the
 * live table and turns those into a loud failure.
 *
 * Run it after any manual edit to `reading_tests`, and before a release.
 *
 * Usage: npm run check:reading
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
  type Question,
  type ReadingPassage,
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
  passage: ReadingPassage;
  questions: Question[];
  answer_key: AnswerKeyEntry[];
}

async function main() {
  const { rows } = await pool.query<Row>(
    `SELECT slug, status, question_count, passage, questions, answer_key
       FROM reading_tests
      ORDER BY sort_order, slug`
  );

  if (rows.length === 0) {
    console.error("No rows in reading_tests — the practice section will render empty.");
    process.exit(1);
  }

  const problems: string[] = [];
  let totalQuestions = 0;

  for (const row of rows) {
    const where = `[${row.slug}]`;
    const questions = row.questions ?? [];
    const answerKey = row.answer_key ?? [];
    totalQuestions += questions.length;

    if (!row.passage?.paragraphs?.length) problems.push(`${where} passage has no paragraphs`);
    if (questions.length === 0) problems.push(`${where} has no questions`);
    if (row.question_count !== questions.length) {
      problems.push(
        `${where} question_count=${row.question_count} but has ${questions.length} questions`
      );
    }

    const keyByQuestion = new Map(answerKey.map((entry) => [entry.questionId, entry]));
    const questionIds = new Set(questions.map((q) => q.id));

    for (const entry of answerKey) {
      if (!questionIds.has(entry.questionId)) {
        problems.push(`${where} answer key references unknown question ${entry.questionId}`);
      }
    }

    for (const question of questions) {
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
        // The killer bug: an answer string no option can ever match.
        if (!question.options.includes(entry.answer)) {
          problems.push(
            `${where} Q${question.number} answer "${entry.answer}" is not one of its options`
          );
        }
      } else if (!entry.answer.trim()) {
        problems.push(`${where} Q${question.number} gap-fill has an empty answer`);
      }

      // The grader must accept its own key — catches normalisation surprises.
      if (!isAnswerCorrect(entry, entry.answer)) {
        problems.push(
          `${where} Q${question.number} grader rejects its own answer "${entry.answer}"`
        );
      }
    }

    const missingExplanations = answerKey.filter((e) => !e.explanation).length;
    const flag = problems.some((p) => p.startsWith(where)) ? "FAIL" : "ok  ";
    console.log(
      `  ${flag} ${row.slug.padEnd(38)} ${row.status.padEnd(9)} ` +
        `${String(questions.length).padStart(2)} câu, ${String(answerKey.length).padStart(2)} đáp án` +
        (missingExplanations ? `, ${missingExplanations} câu thiếu giải thích` : "")
    );
  }

  await pool.end();

  if (problems.length > 0) {
    console.error(`\nFound ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(`\nOK — ${rows.length} đề, ${totalQuestions} câu, toàn bộ đáp án hợp lệ.`);
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
