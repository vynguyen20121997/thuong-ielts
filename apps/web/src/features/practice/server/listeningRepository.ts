import { pool } from "@thuong-ielts/db";
import { unstable_cache } from "next/cache";
import { practiceDisplayName } from "../domain/displayNames";
import { keyPracticeLevel } from "../domain/keyPracticeDifficulty";
import { normalizeListeningQuestion } from "../domain/listeningQuestionType";

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
  ,COALESCE((SELECT array_agg(DISTINCT q ->> 'type') FROM jsonb_array_elements(questions) q), '{}') AS question_types,
  COALESCE((
    SELECT jsonb_object_agg(section_no, types)
      FROM (
        SELECT (q ->> 'section') AS section_no, jsonb_agg(DISTINCT q ->> 'type') AS types
          FROM jsonb_array_elements(questions) q
         WHERE q ? 'section'
         GROUP BY q ->> 'section'
      ) section_types
  ), '{}'::jsonb) AS question_types_by_section
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
  question_types: ListeningTestSummary["questionTypes"] | null;
  question_types_by_section: ListeningTestSummary["questionTypesBySection"] | null;
}

function toSummary(row: SummaryRow): ListeningTestSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: practiceDisplayName(row.title),
    collection: practiceDisplayName(row.collection ?? ""),
    topic: row.topic ?? "",
    level: keyPracticeLevel("listening", row.slug, (row.level as ListeningTestSummary["level"]) ?? "medium"),
    durationSeconds: row.duration_seconds ?? 1800,
    questionCount: row.question_count ?? 0,
    attemptCount: row.attempt_count ?? 0,
    isFree: row.is_free ?? true,
    publishedAt: row.published_at ?? "",
    sections: row.sections ?? [],
    questionTypes: row.question_types ?? [],
    questionTypesBySection: row.question_types_by_section ?? {},
    ...(row.note ? { note: row.note } : {}),
  };
}

/*
 * Luật lọc của trang học sinh: CHỈ kho chung — xem ghi chú dài ở
 * `readingRepository.ts`. Hai bảng phải dùng cùng một luật, lệch một bên là
 * đề riêng lọt ra trang công khai ở đúng bên đó.
 */
const CHI_KHO_CHUNG = `owner_id IS NULL`;

const listListeningTestsCached = unstable_cache(async (): Promise<ListeningTestSummary[]> => {
  const { rows } = await pool.query<SummaryRow>(
    `SELECT ${SUMMARY_COLUMNS}
       FROM listening_tests
      WHERE status = 'published' AND ${CHI_KHO_CHUNG}
      ORDER BY
        CASE
          WHEN collection ~ '^Cambridge IELTS (1[0-8])$' THEN 0
          WHEN collection ~ '^VOL ([1-9]|10)$' THEN 1
          WHEN upper(collection) = 'GUIDE' THEN 2
          WHEN upper(collection) = 'TRAIN 1' THEN 3
          WHEN upper(collection) = 'TRAIN 2' THEN 4
          ELSE 5
        END,
        CASE
          WHEN collection ~ '^Cambridge IELTS (1[0-8])$' THEN substring(collection from '(1[0-8])$')::int
          WHEN collection ~ '^VOL ([1-9]|10)$' THEN substring(collection from '([0-9]+)$')::int
          ELSE 0
        END,
        sort_order ASC, published_at DESC NULLS LAST`,
  );
  return rows.map(toSummary);
}, ["practice-listening-catalog-v4"], { revalidate: 3600, tags: ["practice-listening-catalog"] });

export async function listListeningTests(): Promise<ListeningTestSummary[]> {
  return listListeningTestsCached();
}

async function loadListeningTestBySlug(slug: string): Promise<ListeningTest | null> {
  const { rows } = await pool.query<
    SummaryRow & { audio: ListeningTrack[]; questions: Question[] }
  >(
    `SELECT ${SUMMARY_COLUMNS}, audio, questions
       FROM listening_tests
      WHERE slug = $1 AND status = 'published' AND ${CHI_KHO_CHUNG}
      LIMIT 1`,
    [slug],
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return { ...toSummary(row), audio: row.audio ?? [], questions: (row.questions ?? []).map(normalizeListeningQuestion) };
}

/** Server-only: the answers, for the submit route. */
export const getListeningTestBySlug = unstable_cache(loadListeningTestBySlug, ["listening-paper-v1"], { revalidate: 60, tags: ["practice-listening-catalog"] });

export async function getListeningAnswerKeyBySlug(
  slug: string,
): Promise<{ title: string; questions: Question[]; answerKey: AnswerKeyEntry[] } | null> {
  const { rows } = await pool.query<{
    title: string;
    questions: Question[];
    answer_key: AnswerKeyEntry[];
  }>(
    // `title` đi kèm để route nộp bài ghi tên đề vào lượt làm, đỡ một truy vấn.
    `SELECT title, questions, answer_key FROM listening_tests WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  if (rows.length === 0) return null;
  return {
    title: rows[0].title,
    questions: rows[0].questions ?? [],
    answerKey: rows[0].answer_key ?? [],
  };
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
