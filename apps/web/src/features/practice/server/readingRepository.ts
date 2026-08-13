import { pool } from "@thuong-ielts/db";

import type {
  AnswerKeyEntry,
  Question,
  ReadingTest,
  ReadingTestSummary,
} from "../domain/types";

/**
 * Infrastructure layer — the ONLY module in the feature that knows Postgres
 * exists. Everything above it receives plain domain objects, so swapping the
 * store (or adding a cache) touches this file and nothing else.
 *
 * Postgres is the single source of truth for exam content. There is deliberately
 * no in-repo fallback copy: serving stale content from a bundled file during an
 * outage would look like success while quietly contradicting whatever the
 * teacher last edited. A failed read is raised, not papered over — the practice
 * routes render an error boundary and the log says why.
 *
 * One rule enforced here: public reads never mention `answer_key`. That column
 * is only selected by `getAnswerKeyBySlug`, called exclusively by the submit
 * route.
 */

const SUMMARY_COLUMNS = `
  id, slug, title, collection, topic, level, duration_seconds, question_count,
  attempt_count, is_free, cover_image_url, published_at
`;

interface SummaryRow {
  id: string;
  slug: string;
  title: string;
  collection: string | null;
  topic: string | null;
  level: string;
  duration_seconds: number;
  question_count: number;
  attempt_count: number;
  is_free: boolean;
  cover_image_url: string | null;
  published_at: string | null;
}

function toSummary(row: SummaryRow): ReadingTestSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    collection: row.collection ?? "",
    topic: row.topic ?? "",
    level: (row.level as ReadingTestSummary["level"]) ?? "medium",
    durationSeconds: row.duration_seconds ?? 1200,
    questionCount: row.question_count ?? 0,
    attemptCount: row.attempt_count ?? 0,
    isFree: row.is_free ?? true,
    coverImageUrl: row.cover_image_url ?? undefined,
    publishedAt: row.published_at ?? "",
  };
}

export async function listReadingTests(): Promise<ReadingTestSummary[]> {
  const { rows } = await pool.query<SummaryRow>(
    `SELECT ${SUMMARY_COLUMNS}
       FROM reading_tests
      WHERE status = 'published'
      ORDER BY sort_order ASC, published_at DESC NULLS LAST`
  );
  return rows.map(toSummary);
}

export async function getReadingTestBySlug(slug: string): Promise<ReadingTest | null> {
  const { rows } = await pool.query<SummaryRow & { passage: unknown; questions: Question[] }>(
    `SELECT ${SUMMARY_COLUMNS}, passage, questions
       FROM reading_tests
      WHERE slug = $1 AND status = 'published'
      LIMIT 1`,
    [slug]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...toSummary(row),
    passage: row.passage as ReadingTest["passage"],
    questions: row.questions ?? [],
  };
}

/**
 * Server-only. Returns the questions together with their answers so the submit
 * route can grade without trusting anything the browser sent beyond the raw
 * student input.
 */
export async function getAnswerKeyBySlug(
  slug: string
): Promise<{ questions: Question[]; answerKey: AnswerKeyEntry[] } | null> {
  const { rows } = await pool.query<{ questions: Question[]; answer_key: AnswerKeyEntry[] }>(
    `SELECT questions, answer_key FROM reading_tests WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  if (rows.length === 0) return null;
  return { questions: rows[0].questions ?? [], answerKey: rows[0].answer_key ?? [] };
}

/**
 * Bumps the "lượt làm" counter. Deliberately best-effort and the one place that
 * still swallows: a failed counter update must never turn a successfully graded
 * attempt into an error response.
 */
export async function recordAttempt(slug: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE reading_tests SET attempt_count = attempt_count + 1 WHERE slug = $1`,
      [slug]
    );
  } catch (err) {
    console.error(`recordAttempt(${slug}) failed (ignored):`, err);
  }
}
