import crypto from "crypto";

import { pool } from "./index";

/**
 * Bài cô giao qua link.
 *
 * Trước cái này cô không giao được bài: phải nhắn cả lớp "vào Cam 12 Test 3
 * nhé" rồi mở bảng lớp lên xem ai vào. Có link thì cô gửi một đường dẫn, học
 * sinh bấm là vào thẳng đúng đề.
 *
 * Để ở `packages/db` vì cả hai tiến trình đều đọc: `admin` tạo và quản lý,
 * `web` tra token khi học sinh bấm vào link.
 */

/**
 * Khi nào học sinh được xem.
 *
 *   'ngay'      — hiện ngay khi nộp
 *   'khi_co_mo' — chờ cô bấm mở, để cô chữa chung cả lớp trước
 *   'khong'     — không cho xem trong buổi này
 */
export type MucHien = "ngay" | "khi_co_mo" | "khong";

export interface BaiGiao {
  id: string;
  teacherId: string;
  skill: "reading" | "listening";
  scope: "paper" | "test";
  target: string;
  title: string;
  label: string | null;
  shareToken: string;
  allowGuest: boolean;
  oneAttempt: boolean;
  /** 'class' = giao cả lớp, 'one' = gửi riêng một bạn. */
  audience: "class" | "one";
  /** Học sinh được thấy ĐIỂM khi nào. */
  showScore: MucHien;
  /** Học sinh được thấy ĐÁP ÁN ĐÚNG khi nào. */
  showAnswers: MucHien;
  /** Lúc cô bấm mở kết quả cho cả lớp. */
  resultsOpenedAt: Date | null;
  isOpen: boolean;
  closesAt: Date | null;
  createdAt: Date;
}

function toBaiGiao(row: Record<string, unknown>): BaiGiao {
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    skill: row.skill as BaiGiao["skill"],
    scope: row.scope as BaiGiao["scope"],
    target: row.target as string,
    title: row.title as string,
    label: (row.label as string) ?? null,
    shareToken: row.share_token as string,
    allowGuest: row.allow_guest as boolean,
    oneAttempt: row.one_attempt as boolean,
    audience: ((row.audience as string) ?? "class") as "class" | "one",
    showScore: ((row.show_score as string) ?? "ngay") as MucHien,
    showAnswers: ((row.show_answers as string) ?? "ngay") as MucHien,
    resultsOpenedAt: (row.results_opened_at as Date) ?? null,
    isOpen: row.is_open as boolean,
    closesAt: (row.closes_at as Date) ?? null,
    createdAt: row.created_at as Date,
  };
}

/**
 * Token của link chia sẻ.
 *
 * 32 ký tự base64url từ 24 byte ngẫu nhiên thật. Đây là CHÌA KHOÁ — ai có link
 * là vào được — nên không dùng `Math.random()` và không dùng id tăng dần. Ngắn
 * hơn thì đủ để dò; dài hơn thì cô phải đọc một chuỗi vô tận cho lớp chép.
 */
function taoToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function taoBaiGiao(input: {
  teacherId: string;
  skill: BaiGiao["skill"];
  scope: BaiGiao["scope"];
  target: string;
  title: string;
  label?: string | null;
  allowGuest?: boolean;
  oneAttempt?: boolean;
  audience?: "class" | "one";
  showScore?: MucHien;
  showAnswers?: MucHien;
  /** Số giờ nữa thì link tự đóng. Không truyền thì mặc định 12 tiếng. */
  dongSauGio?: number;
}): Promise<BaiGiao> {
  const id = crypto.randomUUID();
  const gio = Math.max(1, Math.min(24 * 30, Math.round(input.dongSauGio ?? 12)));

  const { rows } = await pool.query(
    `INSERT INTO assignments
       (id, teacher_id, skill, scope, target, title, label, share_token,
        allow_guest, one_attempt, audience, show_score, show_answers, closes_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now() + make_interval(hours => $14::int))
     RETURNING *`,
    [
      id,
      input.teacherId,
      input.skill,
      input.scope,
      input.target,
      input.title,
      input.label ?? null,
      taoToken(),
      input.allowGuest ?? true,
      input.oneAttempt ?? true,
      input.audience ?? "class",
      input.showScore ?? "ngay",
      input.showAnswers ?? "ngay",
      gio,
    ]
  );
  return toBaiGiao(rows[0]);
}

/**
 * Tra bài giao theo token, và trả về CẢ khi đã đóng.
 *
 * Cố ý không lọc `is_open` ở đây: học sinh vào link đã đóng cần thấy dòng "buổi
 * này đã kết thúc" chứ không phải trang 404 để rồi tưởng mình gõ sai địa chỉ.
 * Nơi gọi tự quyết định.
 */
export async function timBaiGiaoTheoToken(token: string): Promise<BaiGiao | null> {
  if (!token || token.length > 64) return null;

  /*
    Thử lại tối đa ba lần.

    DNS của RDS chập chờn — đã đo được nhiều lần. Câu tra này nằm ở CỬA ĐẦU
    TIÊN học sinh chạm vào: mở link cô gửi, và gõ tên để vào. Một cú trượt ở
    đây thì em ấy thấy "Không vào được, thử lại nhé", và nếu cả lớp ba mươi em
    bấm cùng lúc thì vài em trượt cùng lúc — cô sẽ kết luận là link hỏng.

    Đây là câu ĐỌC, không đổi gì, nên thử lại hoàn toàn an toàn.
  */
  let loiCuoi: unknown = null;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM assignments WHERE share_token = $1 LIMIT 1`,
        [token]
      );
      return rows.length ? toBaiGiao(rows[0]) : null;
    } catch (err) {
      loiCuoi = err;
      if (lan < 3) await new Promise((r) => setTimeout(r, 300 * lan));
    }
  }

  console.error("timBaiGiaoTheoToken thất bại sau 3 lần thử:", loiCuoi);
  throw loiCuoi;
}

/** Link còn nhận người vào không. */
export function conMo(bai: BaiGiao, luc = new Date()): boolean {
  if (!bai.isOpen) return false;
  return !bai.closesAt || bai.closesAt.getTime() > luc.getTime();
}

export async function danhSachBaiGiao(teacherId: string): Promise<
  Array<BaiGiao & { daVao: number; daNop: number }>
> {
  const { rows } = await pool.query(
    `SELECT a.*,
            count(t.id) FILTER (WHERE t.id IS NOT NULL)          AS da_vao,
            count(t.id) FILTER (WHERE t.status = 'submitted')    AS da_nop
       FROM assignments a
       LEFT JOIN attempts t ON t.assignment_id = a.id
      WHERE a.teacher_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT 100`,
    [teacherId]
  );
  return rows.map((r) => ({
    ...toBaiGiao(r),
    daVao: Number(r.da_vao),
    daNop: Number(r.da_nop),
  }));
}

export async function dongBaiGiao(id: string, teacherId: string): Promise<void> {
  // Lọc luôn theo `teacher_id`: không đóng được bài của thầy cô khác, kể cả
  // khi đoán đúng id.
  await pool.query(`UPDATE assignments SET is_open = false WHERE id = $1 AND teacher_id = $2`, [
    id,
    teacherId,
  ]);
}

/**
 * Lượt em này đã làm trong bài giao đó, nếu có.
 *
 * Dùng cho luật "một link làm một lần": vào lại thì thấy kết quả lần trước chứ
 * không mở lại đề. Học sinh có tài khoản thì nhận ra theo `student_id`; khách
 * vãng lai thì theo `guest_key` trong cookie — em ấy không có tài khoản để đối
 * chiếu, nên đây là tất cả những gì có.
 */
export async function luotDaLam(
  assignmentId: string,
  ai: { studentId?: string | null; guestKey?: string | null }
): Promise<{ id: string; status: string; correct: number; total: number; band: number | null } | null> {
  const { studentId, guestKey } = ai;
  if (!studentId && !guestKey) return null;

  const { rows } = await pool.query(
    `SELECT id, status, correct, total, band
       FROM attempts
      WHERE assignment_id = $1
        AND (($2::text IS NOT NULL AND student_id = $2) OR ($3::text IS NOT NULL AND guest_key = $3))
      ORDER BY started_at DESC
      LIMIT 1`,
    [assignmentId, studentId ?? null, guestKey ?? null]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    status: r.status,
    correct: r.correct,
    total: r.total,
    band: r.band === null ? null : Number(r.band),
  };
}

/**
 * Học sinh có được xem điểm / đáp án lúc này không.
 *
 * Không có bài giao (em tự luyện) thì luôn được xem — luật này chỉ tồn tại để
 * cô điều khiển buổi học của mình, không phải để giấu người tự học.
 */
export function duocXem(
  bai: Pick<BaiGiao, "showScore" | "showAnswers" | "resultsOpenedAt"> | null
): { diem: boolean; dapAn: boolean } {
  if (!bai) return { diem: true, dapAn: true };
  const daMo = bai.resultsOpenedAt !== null;
  const xet = (muc: MucHien) => muc === "ngay" || (muc === "khi_co_mo" && daMo);
  return { diem: xet(bai.showScore), dapAn: xet(bai.showAnswers) };
}

/** Cô bấm mở kết quả cho cả lớp. Mở rồi thì không đóng lại. */
export async function moKetQua(assignmentId: string, teacherId: string): Promise<void> {
  await pool.query(
    `UPDATE assignments SET results_opened_at = now()
      WHERE id = $1 AND teacher_id = $2 AND results_opened_at IS NULL`,
    [assignmentId, teacherId]
  );
}

/** Cài đặt hiển thị của lượt làm bài này, để route nộp bài biết cắt gì. */
export async function cachHienCuaLuot(
  attemptId: string
): Promise<{ diem: boolean; dapAn: boolean }> {
  const { rows } = await pool.query(
    `SELECT g.show_score, g.show_answers, g.results_opened_at
       FROM attempts a JOIN assignments g ON g.id = a.assignment_id
      WHERE a.id = $1`,
    [attemptId]
  );
  if (!rows.length) return { diem: true, dapAn: true };
  return duocXem({
    showScore: rows[0].show_score,
    showAnswers: rows[0].show_answers,
    resultsOpenedAt: rows[0].results_opened_at,
  });
}
