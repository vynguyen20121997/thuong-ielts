import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { Pool } from "pg";

import { detectReadingQuestionType } from "../apps/web/src/features/practice/domain/readingQuestionType";
import type { Question, QuestionType } from "../apps/web/src/features/practice/domain/types";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", "apps", "web", ".env.local") });

const apply = process.argv.includes("--apply");
const reportFlag = process.argv.indexOf("--report");
const reportPath = reportFlag >= 0 ? process.argv[reportFlag + 1] : undefined;
const summaryOnly = process.argv.includes("--summary");
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

interface Row { slug: string; title: string; questions: Question[] }

async function main() {
  const { rows } = await pool.query<Row>("SELECT slug, title, questions FROM reading_tests WHERE status = 'published' ORDER BY sort_order, slug");
  const counts: Partial<Record<QuestionType, number>> = {};
  const fixes: Array<{ slug: string; number: number; from: QuestionType; to: QuestionType; reason: string }> = [];
  const ambiguous: Array<{ slug: string; number: number; storedType: QuestionType; reason: string }> = [];
  let groupsScanned = 0;

  if (apply) await pool.query("BEGIN");
  try {
    for (const row of rows) {
      let previousKey = "";
      const normalized = (row.questions ?? []).map((question) => {
        const detected = detectReadingQuestionType(question);
        counts[detected.type] = (counts[detected.type] ?? 0) + 1;
        const range = (question.group ?? "").match(/Questions?\s+(\d+)\s*(?:[–-]|and|&)\s*(\d+)/i)?.[0] ?? `${question.number}`;
        const key = `${detected.type}:${range}`;
        if (key !== previousKey) groupsScanned += 1;
        previousKey = key;
        if (detected.type !== question.type) fixes.push({ slug: row.slug, number: question.number, from: question.type, to: detected.type, reason: detected.reason });
        if (detected.confidence === "low") ambiguous.push({ slug: row.slug, number: question.number, storedType: question.type, reason: detected.reason });
        return { ...question, type: detected.type, needsReview: detected.confidence === "low" || undefined } as Question;
      });
      if (apply && normalized.some((question, index) => question.type !== row.questions[index].type || question.needsReview !== row.questions[index].needsReview)) {
        await pool.query("UPDATE reading_tests SET questions = $2::jsonb, updated_at = now() WHERE slug = $1", [row.slug, JSON.stringify(normalized)]);
      }
    }
    if (apply) await pool.query("COMMIT");
  } catch (error) {
    if (apply) await pool.query("ROLLBACK");
    throw error;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    applied: apply,
    testsScanned: rows.length,
    groupsScanned,
    questionsScanned: Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0),
    countsByDetectedType: counts,
    incorrectMappingsFixed: fixes.length,
    ambiguousGroups: ambiguous.length,
    fixes,
    ambiguous,
  };
  const json = JSON.stringify(report, null, 2);
  if (reportPath) {
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, json, "utf8");
  }
  console.log(summaryOnly ? JSON.stringify({ ...report, fixes: undefined, ambiguous: undefined }, null, 2) : json);
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
