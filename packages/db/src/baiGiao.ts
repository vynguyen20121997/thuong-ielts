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
  /** Số giờ nữa thì link tự đóng. Không truyền thì mặc định 12 tiếng. */
  dongSauGio?: number;
}): Promise<BaiGiao> {
  const id = crypto.randomUUID();
  const gio = Math.max(1, Math.min(24 * 30, Math.round(input.dongSauGio ?? 12)));

  const { rows } = await pool.query(
    `INSERT INTO assignments
       (id, teacher_id, skill, scope, target, title, label, share_token,
        allow_guest, one_attempt, audience, closes_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now() + make_interval(hours => $12::int))
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
