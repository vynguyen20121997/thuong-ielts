import { pool } from "@thuong-ielts/db";

import { passageLabelFromTitle, passageNumberFromTitle, testLabelFromTitle } from "../domain/paper";
import type {
  AnswerKeyEntry,
  ExamOutline,
  Question,
  ReadingPaper,
  ReadingPassage,
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
      ORDER BY sort_order ASC, published_at DESC NULLS LAST`,
  );
  return rows.map(toSummary);
}

export async function getReadingTestBySlug(slug: string): Promise<ReadingTest | null> {
  const { rows } = await pool.query<SummaryRow & { passage: unknown; questions: Question[] }>(
    `SELECT ${SUMMARY_COLUMNS}, passage, questions
       FROM reading_tests
      WHERE slug = $1 AND status = 'published'
      LIMIT 1`,
    [slug],
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
  slug: string,
): Promise<{ questions: Question[]; answerKey: AnswerKeyEntry[] } | null> {
  const { rows } = await pool.query<{ questions: Question[]; answer_key: AnswerKeyEntry[] }>(
    `SELECT questions, answer_key FROM reading_tests WHERE slug = $1 LIMIT 1`,
    [slug],
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
    await pool.query(`UPDATE reading_tests SET attempt_count = attempt_count + 1 WHERE slug = $1`, [
      slug,
    ]);
  } catch (err) {
    console.error(`recordAttempt(${slug}) failed (ignored):`, err);
  }
}

/* ------------------------------------------------------------------ *
 * Thi cả test (3 passage, một đồng hồ)
 *
 * Không có cột `test` trong DB — quan hệ nằm trong slug (`cam10-test1-…`).
 * `testId` phải khớp đúng mẫu trước khi ghép vào LIKE: chặn cả injection lẫn
 * ký tự `%`/`_` của chính LIKE.
 *
 * Thứ tự passage lấy từ số câu hỏi đầu tiên chứ không phải theo slug —
 * "european-transport" đứng trước "stepwells" trong bảng chữ cái nhưng lại là
 * passage 2.
 * ------------------------------------------------------------------ */

const TEST_ID = /^cam\d+-test\d+$/;

export function isTestId(value: string): boolean {
  return TEST_ID.test(value);
}

const SECTION_ORDER = `ORDER BY COALESCE((questions -> 0 ->> 'number')::int, 999), slug`;

interface SectionRow extends SummaryRow {
  passage: ReadingPassage;
  questions: Question[];
}

export async function getReadingPaper(testId: string): Promise<ReadingPaper | null> {
  if (!isTestId(testId)) return null;

  const { rows } = await pool.query<SectionRow>(
    `SELECT ${SUMMARY_COLUMNS}, passage, questions
       FROM reading_tests
      WHERE slug LIKE $1 AND status = 'published'
      ${SECTION_ORDER}`,
    [`${testId}-%`],
  );
  if (rows.length === 0) return null;

  const first = rows[0];
  return {
    id: testId,
    mode: "test",
    title: testLabelFromTitle(first.title),
    collection: first.collection ?? "",
    level: (first.level as ReadingPaper["level"]) ?? "medium",
    // Cộng đúng thời lượng từng passage: Cam 11 Test 1 là 50 phút, không phải 60.
    durationSeconds: rows.reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0),
    sections: rows.map((row) => ({
      slug: row.slug,
      label: passageLabelFromTitle(row.title),
      passage: row.passage,
      questions: row.questions ?? [],
    })),
  };
}

/**
 * Bìa đề cho màn chờ trước khi thi. Chỉ đụng các cột tóm tắt — không kéo
 * passage/questions về, vì lúc này học sinh chưa bấm bắt đầu.
 */
export async function getExamOutline(
  mode: "passage" | "test",
  id: string,
): Promise<ExamOutline | null> {
  const isTest = mode === "test";
  if (isTest && !isTestId(id)) return null;

  const { rows } = await pool.query<SummaryRow>(
    `SELECT ${SUMMARY_COLUMNS}
       FROM reading_tests
      WHERE ${isTest ? "slug LIKE $1" : "slug = $1"} AND status = 'published'
      ORDER BY sort_order, slug`,
    [isTest ? `${id}-%` : id],
  );
  if (rows.length === 0) return null;

  const parts = rows
    .map((row) => ({
      label: passageLabelFromTitle(row.title),
      questionCount: row.question_count ?? 0,
      durationSeconds: row.duration_seconds ?? 0,
      order: passageNumberFromTitle(row.title),
    }))
    .sort((a, b) => a.order - b.order);

  const first = rows[0];
  return {
    id,
    mode,
    title: isTest ? testLabelFromTitle(first.title) : first.title,
    collection: first.collection ?? "",
    level: (first.level as ExamOutline["level"]) ?? "medium",
    durationSeconds: parts.reduce((sum, part) => sum + part.durationSeconds, 0),
    questionCount: parts.reduce((sum, part) => sum + part.questionCount, 0),
    parts: parts.map(({ label, questionCount, durationSeconds }) => ({
      label,
      questionCount,
      durationSeconds,
    })),
  };
}

/** Server-only, giống `getAnswerKeyBySlug` nhưng gộp cả ba passage. */
export async function getAnswerKeyByTestId(
  testId: string,
): Promise<{ questions: Question[]; answerKey: AnswerKeyEntry[] } | null> {
  if (!isTestId(testId)) return null;

  const { rows } = await pool.query<{ questions: Question[]; answer_key: AnswerKeyEntry[] }>(
    `SELECT questions, answer_key
       FROM reading_tests
      WHERE slug LIKE $1
      ${SECTION_ORDER}`,
    [`${testId}-%`],
  );
  if (rows.length === 0) return null;

  return {
    questions: rows.flatMap((row) => row.questions ?? []),
    answerKey: rows.flatMap((row) => row.answer_key ?? []),
  };
}

/** Thi cả test thì cả ba passage đều được tính một lượt làm. */
export async function recordTestAttempt(testId: string): Promise<void> {
  if (!isTestId(testId)) return;
  try {
    await pool.query(
      `UPDATE reading_tests SET attempt_count = attempt_count + 1 WHERE slug LIKE $1`,
      [`${testId}-%`],
    );
  } catch (err) {
    console.error(`recordTestAttempt(${testId}) failed (ignored):`, err);
  }
}
