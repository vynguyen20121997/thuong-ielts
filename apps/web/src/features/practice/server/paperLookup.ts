import { pool } from "@thuong-ielts/db";

import type { AnswerKeyEntry, Question } from "../domain/types";
import { testLabelFromTitle } from "../domain/paper";
import { isTestId } from "./readingRepository";

/**
 * Một chỗ duy nhất trả lời "đề này là gì" cho vòng đời lượt làm bài.
 *
 * Reading lưu mỗi passage một dòng còn Listening lưu cả bài một dòng, và
 * Reading thi được cả hai kiểu (một passage lẻ, hoặc cả test 40 câu). Ba
 * trường hợp đó nếu để mỗi route tự xoay thì sẽ có ngày lệch nhau — nhất là
 * `durationSeconds`, thứ quyết định `expires_at` mà server dùng để chốt giờ.
 */

export interface ThongTinDe {
  title: string;
  questionCount: number;
  durationSeconds: number;
}

export interface DapAnDe {
  title: string;
  questions: Question[];
  answerKey: AnswerKeyEntry[];
}

export type Skill = "reading" | "listening";
export type Scope = "paper" | "test";

/** Chặn `testId`/`slug` bịa trước khi ghép vào LIKE hoặc dùng làm khoá. */
function hopLe(scope: Scope, target: string): boolean {
  if (!target || target.length > 120) return false;
  if (scope === "test" && isTestId(target)) return true;
  return /^[a-z0-9-]+$/.test(target);
}

/** Bìa đề: đủ để mở một lượt, chưa cần kéo nội dung câu hỏi về. */
export async function lookupPaper(
  skill: Skill,
  scope: Scope,
  target: string
): Promise<ThongTinDe | null> {
  if (!hopLe(scope, target)) return null;

  if (skill === "listening") {
    const { rows } = await pool.query(
      `SELECT title, question_count, duration_seconds
         FROM listening_tests
        WHERE slug = $1 AND status = 'published'
        LIMIT 1`,
      [target]
    );
    if (rows.length === 0) return null;
    return {
      title: rows[0].title,
      questionCount: rows[0].question_count ?? 0,
      durationSeconds: rows[0].duration_seconds ?? 1800,
    };
  }

  if (scope === "test") {
    if (!isTestId(target)) return null;
    // Cộng đúng thời lượng từng passage: Cam 11 Test 1 là 50 phút, không phải 60.
    const { rows } = await pool.query(
      `SELECT min(title) AS title,
              sum(question_count)::int   AS question_count,
              sum(duration_seconds)::int AS duration_seconds
         FROM reading_tests
        WHERE slug LIKE $1 AND status = 'published'`,
      [`${target}-%`]
    );
    if (rows.length === 0 || !rows[0].title) return null;
    return {
      title: testLabelFromTitle(rows[0].title),
      questionCount: rows[0].question_count ?? 0,
      durationSeconds: rows[0].duration_seconds ?? 3600,
    };
  }

  const { rows } = await pool.query(
    `SELECT title, question_count, duration_seconds
       FROM reading_tests
      WHERE slug = $1 AND status = 'published'
      LIMIT 1`,
    [target]
  );
  if (rows.length === 0) return null;
  return {
    title: rows[0].title,
    questionCount: rows[0].question_count ?? 0,
    durationSeconds: rows[0].duration_seconds ?? 1200,
  };
}

/**
 * Câu hỏi kèm đáp án, để chấm.
 *
 * Server-only, và cố ý không có bản "chỉ lấy câu hỏi" ở đây — file này tồn tại
 * cho đường chấm bài. Ai cần câu hỏi để hiển thị thì gọi repository tương ứng,
 * nơi `answer_key` không bao giờ được chọn ra.
 */
export async function lookupKey(
  skill: Skill,
  scope: Scope,
  target: string
): Promise<DapAnDe | null> {
  if (!hopLe(scope, target)) return null;

  if (skill === "listening") {
    const { rows } = await pool.query(
      `SELECT title, questions, answer_key FROM listening_tests WHERE slug = $1 LIMIT 1`,
      [target]
    );
    if (rows.length === 0) return null;
    return {
      title: rows[0].title,
      questions: rows[0].questions ?? [],
      answerKey: rows[0].answer_key ?? [],
    };
  }

  if (scope === "test") {
    if (!isTestId(target)) return null;
    const { rows } = await pool.query(
      `SELECT title, questions, answer_key
         FROM reading_tests
        WHERE slug LIKE $1
        ORDER BY COALESCE((questions -> 0 ->> 'number')::int, 999), slug`,
      [`${target}-%`]
    );
    if (rows.length === 0) return null;
    return {
      title: testLabelFromTitle(rows[0].title),
      questions: rows.flatMap((r) => r.questions ?? []),
      answerKey: rows.flatMap((r) => r.answer_key ?? []),
    };
  }

  const { rows } = await pool.query(
    `SELECT title, questions, answer_key FROM reading_tests WHERE slug = $1 LIMIT 1`,
    [target]
  );
  if (rows.length === 0) return null;
  return {
    title: rows[0].title,
    questions: rows[0].questions ?? [],
    answerKey: rows[0].answer_key ?? [],
  };
}
