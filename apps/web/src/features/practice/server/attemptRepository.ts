import crypto from "crypto";

import { pool } from "@thuong-ielts/db";

import type { ReadingAnswers, ReadingResult } from "../domain/types";

/**
 * Lưu lượt làm bài.
 *
 * Trước file này, chấm xong là quên — chỉ có `attempt_count` tăng thêm 1. Học
 * sinh không xem lại được bài cũ, cô không thấy được tiến bộ, và màn theo dõi
 * trực tiếp thì không có gì để hiển thị.
 *
 * MỘT LUẬT KHÔNG ĐƯỢC PHÁ: bảng `attempts` không chứa đáp án đúng. `results`
 * chỉ ghi đúng/sai đã chấm sẵn. Đáp án vẫn nằm duy nhất ở `answer_key` của bảng
 * đề, và chỉ trang quản trị mới có đường đọc tới. Chép đáp án sang đây là mở
 * thêm một chỗ để lộ, mà không đổi lại được gì — cái gì cần thì join lúc xem.
 */

export interface LuuLuotLamBai {
  skill: "reading" | "listening";
  /** 'paper' = một passage lẻ; 'test' = cả bài 40 câu. */
  scope: "paper" | "test";
  /** slug của đề, hoặc testId dạng "cam12-test3" khi làm cả bài. */
  target: string;
  title: string;
  /** Một trong hai phải có. Khách vãng lai (cô gửi link) chỉ có tên. */
  studentId?: string | null;
  guestName?: string | null;
  /** Hết giờ mà chưa bấm nộp thì server tự chốt. */
  autoSubmitted?: boolean;
  answers: ReadingAnswers;
  result: ReadingResult;
}

/**
 * Ghi một lượt và trả về id của nó.
 *
 * `null` khi ghi hỏng. Cố ý nuốt lỗi và cố ý KHÔNG ném ra: bài đã chấm xong
 * đúng rồi, học sinh xứng đáng nhìn thấy điểm của mình kể cả lúc DB trục trặc.
 * Mất một dòng lịch sử thì tiếc, nhưng đổi nó lấy một màn hình báo lỗi sau 60
 * phút làm bài là một cuộc đổi chác tồi. Lỗi vẫn vào log để còn biết mà sửa.
 */
export async function saveAttempt(input: LuuLuotLamBai): Promise<string | null> {
  const { skill, scope, target, title, result } = input;
  const studentId = input.studentId ?? null;
  const guestName = input.guestName ?? null;

  // Ràng buộc này DB cũng có, nhưng chặn ở đây thì thông điệp lỗi nói đúng
  // chuyện gì đã xảy ra thay vì ném ra một mã lỗi Postgres.
  if (!studentId && !guestName) {
    console.error("saveAttempt: lượt làm không có người làm (thiếu cả studentId lẫn guestName).");
    return null;
  }

  const id = crypto.randomUUID();

  // Chỉ giữ ba trường cho mỗi câu. `expected` và `explanation` mà `gradeReading`
  // trả về thì bỏ đi — đó là đáp án, xem mục ghi chú đầu file.
  const results = result.items.map((item) => ({
    q: item.questionId,
    n: item.number,
    ok: item.isCorrect,
  }));

  try {
    await pool.query(
      `INSERT INTO attempts
         (id, skill, scope, target, title, student_id, guest_name,
          started_at, auto_submitted, elapsed_seconds,
          total, correct, band, answers, results)
       VALUES ($1,$2,$3,$4,$5,$6,$7,
               now() - make_interval(secs => $8::int), $9, $8,
               $10,$11,$12,$13,$14)`,
      [
        id,
        skill,
        scope,
        target,
        title,
        studentId,
        guestName,
        Math.max(0, Math.round(result.elapsedSeconds)),
        input.autoSubmitted ?? false,
        result.total,
        result.correct,
        result.band,
        JSON.stringify(input.answers),
        JSON.stringify(results),
      ]
    );
    return id;
  } catch (err) {
    console.error(`saveAttempt(${skill}/${target}) thất bại (bỏ qua):`, err);
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Lượt đang làm — phần phục vụ màn theo dõi trực tiếp của cô
 *
 * Một lượt bắt đầu tồn tại từ lúc học sinh bấm vào bài, không phải lúc nộp.
 * Không có dòng "đang làm" thì không có gì để cô nhìn trong lúc cả lớp còn
 * đang làm — mà đó chính là điều tính năng này để làm.
 * ------------------------------------------------------------------ */

export interface MoLuot {
  skill: "reading" | "listening";
  scope: "paper" | "test";
  target: string;
  title: string;
  studentId?: string | null;
  guestName?: string | null;
  questionCount: number;
  durationSeconds: number;
}

export interface LuotDangLam {
  id: string;
  target: string;
  total: number;
  /** Giây còn lại, tính từ `expires_at` mà server giữ. */
  conLai: number;
}

/**
 * Mở một lượt và trả về id.
 *
 * `expires_at` do server đặt và server giữ. Đồng hồ trong trình duyệt vẫn chạy
 * cho học sinh nhìn, nhưng mọi con số thời gian mà cô thấy đều tính từ cột này
 * — học sinh tắt mạng thì đồng hồ máy em ấy đứng, còn giờ thi thì không.
 *
 * Khác `saveAttempt`: hàm này KHÔNG nuốt lỗi. Mở lượt hỏng nghĩa là bài thi
 * chưa bắt đầu, nên báo ra để học sinh bấm lại còn hơn để em ấy làm 60 phút
 * trong một lượt không tồn tại.
 */
export async function openAttempt(input: MoLuot): Promise<LuotDangLam> {
  const id = crypto.randomUUID();
  const duration = Math.max(60, Math.round(input.durationSeconds));

  await pool.query(
    `INSERT INTO attempts
       (id, skill, scope, target, title, student_id, guest_name,
        status, started_at, expires_at, submitted_at,
        elapsed_seconds, total, correct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,
             'in_progress', now(), now() + make_interval(secs => $8::int), NULL,
             0, $9, 0)`,
    [
      id,
      input.skill,
      input.scope,
      input.target,
      input.title,
      input.studentId ?? null,
      input.guestName ?? null,
      duration,
      input.questionCount,
    ]
  );

  await pool.query(
    `INSERT INTO attempt_progress (attempt_id, marks)
     VALUES ($1, $2)
     ON CONFLICT (attempt_id) DO NOTHING`,
    [id, JSON.stringify(new Array(input.questionCount).fill(null))]
  );

  return { id, target: input.target, total: input.questionCount, conLai: duration };
}

export interface ChuLuot {
  id: string;
  target: string;
  title: string;
  skill: "reading" | "listening";
  scope: "paper" | "test";
  total: number;
  conLai: number;
  ten: string;
  khach: boolean;
}

/**
 * Lấy một lượt ĐANG LÀM và kiểm luôn nó có phải của người này không.
 *
 * Gộp hai việc vào một truy vấn là cố ý: tách ra thành "đọc lượt" rồi "so chủ
 * sở hữu" thì sẽ có ngày ai đó gọi cái đầu mà quên cái sau. Ở đây không lấy
 * được lượt của người khác, kể cả khi muốn.
 */
export async function getOpenAttempt(
  attemptId: string,
  studentId: string
): Promise<ChuLuot | null> {
  const { rows } = await pool.query(
    `SELECT a.id, a.target, a.title, a.skill, a.scope, a.total,
            GREATEST(0, EXTRACT(EPOCH FROM (a.expires_at - now()))::int) AS con_lai,
            COALESCE(s.name, a.guest_name, 'Học viên') AS ten,
            (a.student_id IS NULL) AS khach
       FROM attempts a
       LEFT JOIN students s ON s.id = a.student_id
      WHERE a.id = $1 AND a.student_id = $2 AND a.status = 'in_progress'
      LIMIT 1`,
    [attemptId, studentId]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    target: row.target,
    title: row.title,
    skill: row.skill,
    scope: row.scope,
    total: row.total,
    conLai: row.con_lai,
    ten: row.ten,
    khach: row.khach,
  };
}

/** Ghi đè tiến độ. Một dòng hẹp, mỗi vài giây một lần. */
export async function writeProgress(
  attemptId: string,
  progress: {
    answered: number;
    correct: number;
    marks: (boolean | null)[];
    answers: ReadingAnswers;
    currentPart?: string | null;
  }
): Promise<void> {
  await pool.query(
    `INSERT INTO attempt_progress
       (attempt_id, answered, correct, marks, answers, current_part, last_beat_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, now(), now())
     ON CONFLICT (attempt_id) DO UPDATE SET
       answered     = EXCLUDED.answered,
       correct      = EXCLUDED.correct,
       marks        = EXCLUDED.marks,
       answers      = EXCLUDED.answers,
       current_part = EXCLUDED.current_part,
       last_beat_at = now(),
       updated_at   = now()`,
    [
      attemptId,
      progress.answered,
      progress.correct,
      JSON.stringify(progress.marks),
      JSON.stringify(progress.answers),
      progress.currentPart ?? null,
    ]
  );
}

/**
 * Chốt một lượt đang mở thành đã nộp.
 *
 * Trả về false khi không có lượt nào đang mở với id đó — nghĩa là nó đã được
 * chốt rồi (bấm nộp hai lần, hoặc server đã tự chốt vì hết giờ). Không phải
 * lỗi, và tuyệt đối không được ghi đè: điểm lần chốt đầu mới là điểm thật.
 */
export async function closeAttempt(
  attemptId: string,
  answers: ReadingAnswers,
  result: ReadingResult,
  autoSubmitted = false
): Promise<boolean> {
  const results = result.items.map((item) => ({
    q: item.questionId,
    n: item.number,
    ok: item.isCorrect,
  }));

  const { rowCount } = await pool.query(
    `UPDATE attempts
        SET status = 'submitted',
            submitted_at = now(),
            auto_submitted = $2,
            elapsed_seconds = $3,
            total = $4,
            correct = $5,
            band = $6,
            answers = $7,
            results = $8
      WHERE id = $1 AND status = 'in_progress'`,
    [
      attemptId,
      autoSubmitted,
      Math.max(0, Math.round(result.elapsedSeconds)),
      result.total,
      result.correct,
      result.band,
      JSON.stringify(answers),
      JSON.stringify(results),
    ]
  );

  return (rowCount ?? 0) > 0;
}

export interface TomTatLuot {
  id: string;
  skill: "reading" | "listening";
  scope: "paper" | "test";
  target: string;
  title: string;
  submittedAt: Date;
  elapsedSeconds: number;
  total: number;
  correct: number;
  band: number | null;
}

/**
 * Lịch sử làm bài của một học viên, mới nhất trước.
 *
 * Không trả `answers` và `results`: danh sách chỉ cần vài con số, mà hai cột
 * JSONB kia mỗi dòng nặng vài KB. Xem chi tiết một lượt thì gọi riêng.
 */
export async function listAttemptsByStudent(
  studentId: string,
  limit = 50
): Promise<TomTatLuot[]> {
  const { rows } = await pool.query(
    `SELECT id, skill, scope, target, title, submitted_at, elapsed_seconds,
            total, correct, band
       FROM attempts
      WHERE student_id = $1
      ORDER BY submitted_at DESC
      LIMIT $2`,
    [studentId, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    skill: row.skill,
    scope: row.scope,
    target: row.target,
    title: row.title,
    submittedAt: row.submitted_at,
    elapsedSeconds: row.elapsed_seconds ?? 0,
    total: row.total,
    correct: row.correct,
    // NUMERIC về từ `pg` là chuỗi, không phải số — quên ép kiểu thì
    // `band.toFixed(1)` ở giao diện sẽ nổ.
    band: row.band === null ? null : Number(row.band),
  }));
}
