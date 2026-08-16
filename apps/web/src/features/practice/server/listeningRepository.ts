import { pool } from "@thuong-ielts/db";

import type {
  AnswerKeyEntry,
  ListeningTest,
  ListeningTestSummary,
  ListeningTrack,
  Question,
} from "../domain/types";

/**
 * Infrastructure layer for listening, mirroring readingRepository: the only
 * module that knows Postgres, no fallback copy of the content, and public reads
 * that never mention `answer_key`.
 */

/**
 * `sections` được tính ngay trong SQL từ cột `questions`. Không đọc cả JSONB
 * về client — chỉ lấy ra danh sách số phần, vài chục byte mỗi dòng.
 */
const SUMMARY_COLUMNS = `
  id, slug, title, collection, topic, level, duration_seconds, question_count,
  attempt_count, is_free, published_at, note,
  (
    SELECT array_agg(DISTINCT (q ->> 'section')::int ORDER BY (q ->> 'section')::int)
      FROM jsonb_array_elements(questions) AS q
     WHERE q ? 'section'
  ) AS sections
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
  published_at: string | null;
  note: string | null;
  sections: number[] | null;
}

function toSummary(row: SummaryRow): ListeningTestSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    collection: row.collection ?? "",
    topic: row.topic ?? "",
    level: (row.level as ListeningTestSummary["level"]) ?? "medium",
    durationSeconds: row.duration_seconds ?? 1800,
    questionCount: row.question_count ?? 0,
    attemptCount: row.attempt_count ?? 0,
    isFree: row.is_free ?? true,
    publishedAt: row.published_at ?? "",
    sections: row.sections ?? [],
    ...(row.note ? { note: row.note } : {}),
  };
}

export async function listListeningTests(): Promise<ListeningTestSummary[]> {
  const { rows } = await pool.query<SummaryRow>(
    `SELECT ${SUMMARY_COLUMNS}
       FROM listening_tests
      WHERE status = 'published'
      ORDER BY sort_order ASC, published_at DESC NULLS LAST`,
  );
  return rows.map(toSummary);
}

export async function getListeningTestBySlug(slug: string): Promise<ListeningTest | null> {
  const { rows } = await pool.query<
    SummaryRow & { audio: ListeningTrack[]; questions: Question[] }
  >(
    `SELECT ${SUMMARY_COLUMNS}, audio, questions
       FROM listening_tests
      WHERE slug = $1 AND status = 'published'
      LIMIT 1`,
    [slug],
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return { ...toSummary(row), audio: row.audio ?? [], questions: row.questions ?? [] };
}

/** Server-only: the answers, for the submit route. */
export async function getListeningAnswerKeyBySlug(
  slug: string,
): Promise<{ questions: Question[]; answerKey: AnswerKeyEntry[] } | null> {
  const { rows } = await pool.query<{ questions: Question[]; answer_key: AnswerKeyEntry[] }>(
    `SELECT questions, answer_key FROM listening_tests WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  if (rows.length === 0) return null;
  return { questions: rows[0].questions ?? [], answerKey: rows[0].answer_key ?? [] };
}

/** Best-effort counter; never fails a graded attempt. */
export async function recordListeningAttempt(slug: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE listening_tests SET attempt_count = attempt_count + 1 WHERE slug = $1`,
      [slug],
    );
  } catch (err) {
    console.error(`recordListeningAttempt(${slug}) failed (ignored):`, err);
  }
}
