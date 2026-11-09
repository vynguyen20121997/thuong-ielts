import "server-only";

import crypto from "crypto";
import { pool, type BaiGiao } from "@thuong-ielts/db";
import type { WritingState } from "@thuong-ielts/diagnostic";

import { countWords } from "../domain/writing";
import { gradeEssayBand } from "../../../server/writingBand";

/**
 * Bài Writing cô giao qua link — đề là đề nội bộ của cô (`writing_prompts`
 * có `owner_id`), bài nộp lưu ở `writing_submissions`.
 *
 * Không đi qua `attempts`: bảng đó mang `correct`/`total` của bài trắc nghiệm,
 * nhét một bài luận vào là nói dối ở mọi chỗ đang cộng hai cột ấy.
 *
 * Chấm band là bước RIÊNG, ngoài transaction — cùng lý do với Section 4 của
 * bài kiểm tra nền: bộ chấm chờ tới 25 giây, giữ `FOR UPDATE` trong lúc đó là
 * giam một kết nối DB. Nộp xong trả về ngay; chấm hỏng thì mất band, không mất bài.
 */

export interface DeWritingGiao {
  id: string;
  title: string;
  task: number;
  prompt: string;
  minWords: number;
  durationSeconds: number;
}

export interface NguoiLam {
  studentId: string | null;
  guestKey: string | null;
  guestName: string | null;
}

export interface BaiNop {
  id: string;
  essay: string;
  words: number;
  promptText: string;
  result: WritingState | null;
}

/** Đề của một bài giao Writing. Chỉ đề nội bộ của CHÍNH cô giao bài. */
export async function deCuaBaiGiao(bai: BaiGiao): Promise<DeWritingGiao | null> {
  if (bai.skill !== "writing") return null;
  const { rows } = await pool.query(
    `SELECT id, title, task, prompt, min_words, duration_seconds
       FROM writing_prompts
      WHERE id = $1 AND owner_id = $2 AND published`,
    [bai.target, bai.teacherId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    task: r.task,
    prompt: r.prompt,
    minWords: r.min_words ?? 250,
    durationSeconds: r.duration_seconds ?? 2400,
  };
}

export async function baiNopCua(assignmentId: string, ai: NguoiLam): Promise<BaiNop | null> {
  if (!ai.studentId && !ai.guestKey) return null;
  const { rows } = await pool.query(
    `SELECT id, essay, words, prompt_text, result
       FROM writing_submissions
      WHERE assignment_id = $1
        AND (($2::text IS NOT NULL AND student_id = $2) OR ($3::text IS NOT NULL AND guest_key = $3))
      ORDER BY submitted_at DESC LIMIT 1`,
    [assignmentId, ai.studentId, ai.studentId ? null : ai.guestKey],
  );
  const r = rows[0];
  return r ? { id: r.id, essay: r.essay, words: r.words, promptText: r.prompt_text, result: r.result } : null;
}

export class LoiNop extends Error {}

/**
 * Lưu bài. Khoá dòng bài giao trong lúc kiểm "đã nộp chưa" để hai tab bấm nộp
 * cùng lúc không thành hai bài — đọc–kiểm–ghi thì phải `FOR UPDATE`.
 */
export async function nopBai(input: {
  bai: BaiGiao;
  de: DeWritingGiao;
  ai: NguoiLam;
  essay: string;
  elapsedSeconds: number;
}): Promise<{ id: string; daCo: boolean }> {
  const essay = input.essay.trim();
  const words = countWords(essay);
  if (!words) throw new LoiNop("Bài viết đang trống.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: khoa } = await client.query(
      `SELECT is_open, closes_at FROM assignments WHERE id = $1 FOR UPDATE`,
      [input.bai.id],
    );
    const a = khoa[0];
    if (!a || !a.is_open || (a.closes_at && new Date(a.closes_at).getTime() <= Date.now())) {
      throw new LoiNop("Buổi học này đã đóng, không nộp được nữa.");
    }

    if (input.bai.oneAttempt) {
      const { rows: cu } = await client.query(
        `SELECT id FROM writing_submissions
          WHERE assignment_id = $1
            AND (($2::text IS NOT NULL AND student_id = $2) OR ($3::text IS NOT NULL AND guest_key = $3))
          LIMIT 1`,
        [input.bai.id, input.ai.studentId, input.ai.studentId ? null : input.ai.guestKey],
      );
      if (cu[0]) {
        await client.query("COMMIT");
        return { id: cu[0].id, daCo: true };
      }
    }

    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO writing_submissions
         (id, assignment_id, prompt_id, prompt_text, student_id, guest_name, guest_key, essay, words, elapsed_seconds)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        input.bai.id,
        input.de.id,
        input.de.prompt,
        input.ai.studentId,
        input.ai.studentId ? null : input.ai.guestName,
        input.ai.studentId ? null : input.ai.guestKey,
        essay.slice(0, 12000),
        words,
        Math.max(0, Math.min(6 * 3600, Math.round(input.elapsedSeconds) || 0)),
      ],
    );
    await client.query("COMMIT");
    return { id, daCo: false };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Chấm một bài đã nộp. Đã chấm rồi thì trả kết quả cũ — F5 ở màn kết quả
 * không gọi dịch vụ ngoài lần nữa. Chỉ ghi khi chấm RA ĐƯỢC kết quả có nghĩa:
 * "dịch vụ đang bận" để NULL, lần sau còn thử lại.
 */
export async function chamBai(baiNop: BaiNop, de: Pick<DeWritingGiao, "minWords" | "id">): Promise<WritingState> {
  if (baiNop.result && baiNop.result.kind !== "ungraded") return baiNop.result;

  const state = await gradeEssayBand(baiNop.essay, {
    prompt: baiNop.promptText,
    minWords: de.minWords,
    gradableWords: Math.min(80, Math.round(de.minWords / 3)),
    taskVersion: `prompt:${de.id}`,
  });

  if (state.kind === "graded" || state.kind === "too-short" || state.kind === "empty") {
    await pool.query(
      `UPDATE writing_submissions SET result = $2::jsonb, graded_at = now() WHERE id = $1 AND result IS NULL`,
      [baiNop.id, JSON.stringify(state)],
    );
  }
  return state;
}
