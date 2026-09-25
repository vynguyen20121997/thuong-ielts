import "server-only";

import { pool } from "@thuong-ielts/db";

/**
 * Học phí, nhìn từ phía HỌC SINH.
 *
 * Mọi hàm nhận `studentId` lấy từ PHIÊN, không bao giờ từ query hay body —
 * cùng luật với phần từ vựng. Ở đây còn nặng hơn: đọc được học phí của người
 * khác là đọc được cả chuyện nhà người ta.
 *
 * `server-only` ở dòng đầu để lỡ import từ component client thì build hỏng
 * ngay, thay vì nhét driver Postgres vào bundle trình duyệt.
 */

export interface LopCuaEm {
  classId: string;
  tenLop: string;
  chuKy: "thang" | "khoa" | "buoi";
  /** Mức em này phải đóng: mức riêng nếu có, không thì mức lớp. */
  hocPhi: number | null;
  daNghi: boolean;
  /** Tài khoản nhận tiền của cô dạy lớp này. */
  bankBin: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
}

export interface LanDongCuaEm {
  id: string;
  classId: string;
  tenLop: string;
  amount: number;
  paidOn: string;
  period: string | null;
  method: "tien_mat" | "chuyen_khoan" | "khac";
  status: "cho_xac_nhan" | "da_xac_nhan";
  note: string;
}

const tien = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

export async function lopCuaHocVien(studentId: string): Promise<LopCuaEm[]> {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.tuition_cycle, c.tuition_amount,
            m.tuition_override, m.left_on,
            t.bank_bin, t.bank_name, t.bank_account, t.bank_holder
       FROM class_members m
       JOIN classes c ON c.id = m.class_id
       JOIN teachers t ON t.id = c.teacher_id
      WHERE m.student_id = $1
      ORDER BY m.left_on IS NOT NULL, c.created_at DESC`,
    [studentId],
  );
  return rows.map((r) => ({
    classId: r.id,
    tenLop: r.name,
    chuKy: r.tuition_cycle,
    hocPhi: tien(r.tuition_override) ?? tien(r.tuition_amount),
    daNghi: Boolean(r.left_on),
    bankBin: r.bank_bin,
    bankName: r.bank_name,
    bankAccount: r.bank_account,
    bankHolder: r.bank_holder,
  }));
}

export async function lichSuDong(studentId: string): Promise<LanDongCuaEm[]> {
  const { rows } = await pool.query(
    `SELECT p.id, p.class_id, c.name, p.amount, p.paid_on, p.period,
            p.method, p.status, p.note
       FROM tuition_payments p
       JOIN classes c ON c.id = p.class_id
      WHERE p.student_id = $1
      ORDER BY p.paid_on DESC, p.created_at DESC
      LIMIT 60`,
    [studentId],
  );
  return rows.map((r) => ({
    id: r.id,
    classId: r.class_id,
    tenLop: r.name,
    amount: Number(r.amount),
    paidOn: String(r.paid_on).slice(0, 10),
    period: r.period,
    method: r.method,
    status: r.status,
    note: r.note,
  }));
}

/**
 * Em ấy khai đã chuyển khoản.
 *
 * KHÔNG phải là đóng tiền — chỉ là một lời khai, đứng ở `cho_xac_nhan` cho
 * tới khi cô soi sao kê rồi bấm xác nhận. Trả về `daCo` khi kỳ ấy đã có dòng
 * rồi, để giao diện nói "đã gửi rồi, chờ cô duyệt" thay vì báo một lỗi khó
 * hiểu từ khoá duy nhất của DB.
 */
export async function khaiDaChuyen(
  studentId: string,
  classId: string,
  period: string | null,
  amount: number,
): Promise<{ ok: boolean; lyDo?: string }> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { ok: false, lyDo: "Số tiền không hợp lệ." };
  }

  /* Phải đang học lớp này. Không thì đây là cửa ghi bậy vào sổ của lớp khác. */
  const { rowCount: coTrongLop } = await pool.query(
    `SELECT 1 FROM class_members
      WHERE class_id = $1 AND student_id = $2 AND left_on IS NULL`,
    [classId, studentId],
  );
  if (!coTrongLop) return { ok: false, lyDo: "Bạn không học lớp này." };

  const { randomUUID } = await import("crypto");
  try {
    await pool.query(
      `INSERT INTO tuition_payments
         (id, class_id, student_id, amount, period, method, status, declared_by, note)
       VALUES ($1,$2,$3,$4,$5,'chuyen_khoan','cho_xac_nhan','hoc_vien','Học viên báo đã chuyển')`,
      [randomUUID(), classId, studentId, amount, period],
    );
    return { ok: true };
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return { ok: false, lyDo: "Kỳ này đã có ghi nhận rồi." };
    }
    throw err;
  }
}
