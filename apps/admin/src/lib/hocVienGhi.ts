import { randomUUID } from "crypto";

import { pool } from "@thuong-ielts/db";

import type { ChuKy, HinhThuc } from "./hocVien";

/**
 * Phần GHI của quản lý lớp.
 *
 * Tách khỏi `hocVien.ts` (phần đọc) vì hai bên có luật khác nhau: đọc thì chỉ
 * cần lọc đúng giáo viên, còn ghi thì mỗi thao tác phải tự kiểm lại quyền sở
 * hữu trước khi đụng vào một dòng nào. Trộn chung là sớm muộn có một hàm ghi
 * quên mất phần kiểm.
 */

export class LoiNhap extends Error {}

/** Mọi thao tác ghi đều đi qua đây trước. Không có ngoại lệ. */
async function lopCuaToi(teacherId: string, classId: string): Promise<void> {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2",
    [classId, teacherId],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy lớp này.");
}

/**
 * Đọc một số tiền do người gõ vào.
 *
 * Cô sẽ gõ "1.500.000", "1,500,000" hay "1500000 đ" tuỳ lúc, nên bỏ hết dấu
 * phân cách rồi mới đọc. KHÔNG chấp nhận số lẻ: đơn vị là đồng, và một con số
 * có phần thập phân ở đây gần như chắc chắn là gõ nhầm.
 */
export function docTien(input: unknown, batBuoc = true): number | null {
  if (input === null || input === undefined || input === "") {
    if (batBuoc) throw new LoiNhap("Thiếu số tiền.");
    return null;
  }
  const raw = String(input).replace(/[^\d-]/g, "");
  if (!raw) {
    if (batBuoc) throw new LoiNhap("Số tiền không đọc được.");
    return null;
  }
  const n = Number(raw);
  if (!Number.isSafeInteger(n)) throw new LoiNhap("Số tiền không hợp lệ.");
  if (n < 0) throw new LoiNhap("Số tiền không được âm.");
  if (n > 999_999_999_999) throw new LoiNhap("Số tiền quá lớn.");
  return n;
}

function chu(input: unknown, ten: string, toiDa = 200): string {
  const s = typeof input === "string" ? input.trim() : "";
  if (!s) throw new LoiNhap(`Thiếu ${ten}.`);
  if (s.length > toiDa) throw new LoiNhap(`${ten} quá dài.`);
  return s;
}

function chuTuyChon(input: unknown, toiDa = 2000): string {
  const s = typeof input === "string" ? input.trim() : "";
  return s.slice(0, toiDa);
}

function ngay(input: unknown): string | null {
  const s = typeof input === "string" ? input.trim() : "";
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new LoiNhap("Ngày không hợp lệ.");
  return s;
}

/** Kỳ thu dạng 'YYYY-MM'. `null` cho lớp thu trọn khoá. */
function kyThu(input: unknown): string | null {
  const s = typeof input === "string" ? input.trim() : "";
  if (!s) return null;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s))
    throw new LoiNhap("Kỳ thu phải dạng YYYY-MM.");
  return s;
}

const CHU_KY: ChuKy[] = ["thang", "khoa", "buoi"];
const HINH_THUC: HinhThuc[] = ["tien_mat", "chuyen_khoan", "khac"];

export async function taoLop(
  teacherId: string,
  body: Record<string, unknown>,
): Promise<string> {
  const id = randomUUID();
  const cycle = CHU_KY.includes(body.tuitionCycle as ChuKy)
    ? (body.tuitionCycle as ChuKy)
    : "thang";
  await pool.query(
    `INSERT INTO classes (id, teacher_id, name, note, tuition_amount,
                          tuition_cycle, starts_on, ends_on)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      teacherId,
      chu(body.name, "tên lớp", 120),
      chuTuyChon(body.note),
      docTien(body.tuitionAmount, false),
      cycle,
      ngay(body.startsOn),
      ngay(body.endsOn),
    ],
  );
  return id;
}

export async function suaLop(
  teacherId: string,
  classId: string,
  body: Record<string, unknown>,
): Promise<void> {
  await lopCuaToi(teacherId, classId);
  const cycle = CHU_KY.includes(body.tuitionCycle as ChuKy)
    ? (body.tuitionCycle as ChuKy)
    : null;
  await pool.query(
    `UPDATE classes
        SET name = coalesce($3, name),
            note = coalesce($4, note),
            tuition_amount = CASE WHEN $5::boolean THEN $6::numeric ELSE tuition_amount END,
            tuition_cycle = coalesce($7, tuition_cycle),
            starts_on = CASE WHEN $8::boolean THEN $9::date ELSE starts_on END,
            ends_on = CASE WHEN $10::boolean THEN $11::date ELSE ends_on END,
            is_active = coalesce($12, is_active),
            updated_at = now()
      WHERE id = $1 AND teacher_id = $2`,
    [
      classId,
      teacherId,
      typeof body.name === "string" ? chu(body.name, "tên lớp", 120) : null,
      typeof body.note === "string" ? chuTuyChon(body.note) : null,
      "tuitionAmount" in body,
      docTien(body.tuitionAmount, false),
      cycle,
      "startsOn" in body,
      ngay(body.startsOn),
      "endsOn" in body,
      ngay(body.endsOn),
      typeof body.isActive === "boolean" ? body.isActive : null,
    ],
  );
}

export async function themHocVien(
  teacherId: string,
  classId: string,
  studentId: string,
): Promise<void> {
  await lopCuaToi(teacherId, classId);
  const { rowCount } = await pool.query("SELECT 1 FROM students WHERE id = $1", [
    studentId,
  ]);
  if (!rowCount) throw new LoiNhap("Không tìm thấy học viên này.");
  /*
    Vào lại lớp cũ thì XOÁ ngày nghỉ chứ không tạo dòng mới: học phí đã đóng
    và ghi chú cũ đều treo vào cặp (lớp, học viên), tạo dòng mới là mất sạch.
  */
  await pool.query(
    `INSERT INTO class_members (class_id, student_id)
     VALUES ($1,$2)
     ON CONFLICT (class_id, student_id)
     DO UPDATE SET left_on = NULL`,
    [classId, studentId],
  );
}

export async function suaHocVien(
  teacherId: string,
  classId: string,
  studentId: string,
  body: Record<string, unknown>,
): Promise<void> {
  await lopCuaToi(teacherId, classId);
  /*
    `CASE WHEN <có gửi field> THEN <giá trị mới> ELSE <giữ nguyên>`: phân biệt
    "không gửi field này" với "gửi null để xoá". Dùng `coalesce` cho cả hai thì
    không bao giờ xoá được mức học phí riêng hay ngày nghỉ.
  */
  const { rowCount } = await pool.query(
    `UPDATE class_members
        SET tuition_override = CASE WHEN $3::boolean THEN $4::numeric ELSE tuition_override END,
            note = coalesce($5, note),
            left_on = CASE WHEN $6::boolean THEN $7::date ELSE left_on END
      WHERE class_id = $1 AND student_id = $2`,
    [
      classId,
      studentId,
      "tuitionOverride" in body,
      docTien(body.tuitionOverride, false),
      typeof body.note === "string" ? chuTuyChon(body.note) : null,
      "leftOn" in body,
      ngay(body.leftOn),
    ],
  );
  if (!rowCount) throw new LoiNhap("Học viên này không thuộc lớp.");
}

export async function ghiNhanDong(
  teacherId: string,
  classId: string,
  body: Record<string, unknown>,
): Promise<string> {
  await lopCuaToi(teacherId, classId);
  const studentId = chu(body.studentId, "học viên", 100);

  const { rowCount } = await pool.query(
    "SELECT 1 FROM class_members WHERE class_id = $1 AND student_id = $2",
    [classId, studentId],
  );
  if (!rowCount) throw new LoiNhap("Học viên này không thuộc lớp.");

  const amount = docTien(body.amount);
  if (!amount) throw new LoiNhap("Số tiền phải lớn hơn 0.");

  const id = randomUUID();
  const method = HINH_THUC.includes(body.method as HinhThuc)
    ? (body.method as HinhThuc)
    : "chuyen_khoan";

  try {
    await pool.query(
      `INSERT INTO tuition_payments
         (id, class_id, student_id, amount, paid_on, period, method, note, recorded_by)
       VALUES ($1,$2,$3,$4,coalesce($5::date, CURRENT_DATE),$6,$7,$8,$9)`,
      [
        id,
        classId,
        studentId,
        amount,
        ngay(body.paidOn),
        kyThu(body.period),
        method,
        chuTuyChon(body.note, 300),
        teacherId,
      ],
    );
  } catch (err) {
    /*
      Khoá duy nhất (lớp, học viên, kỳ) chặn cảnh bấm lưu hai lần thành hai
      dòng. Nói thẳng ra là "kỳ này ghi rồi", đừng để cô đọc lỗi Postgres.
    */
    if ((err as { code?: string }).code === "23505") {
      throw new LoiNhap("Kỳ này đã ghi nhận đóng rồi. Sửa hoặc xoá dòng cũ trước.");
    }
    throw err;
  }
  return id;
}

export async function xoaLanDong(
  teacherId: string,
  paymentId: string,
): Promise<void> {
  const { rowCount } = await pool.query(
    `DELETE FROM tuition_payments p
      USING classes c
      WHERE p.id = $1 AND c.id = p.class_id AND c.teacher_id = $2`,
    [paymentId, teacherId],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy lần đóng này.");
}

export async function themNhanXet(
  teacherId: string,
  body: Record<string, unknown>,
): Promise<string> {
  const studentId = chu(body.studentId, "học viên", 100);
  const classId =
    typeof body.classId === "string" && body.classId ? body.classId : null;
  if (classId) await lopCuaToi(teacherId, classId);

  /* Chỉ ghi được nhận xét cho học viên thuộc lớp của mình. */
  const { rowCount } = await pool.query(
    `SELECT 1 FROM class_members m JOIN classes c ON c.id = m.class_id
      WHERE m.student_id = $1 AND c.teacher_id = $2 LIMIT 1`,
    [studentId, teacherId],
  );
  if (!rowCount) throw new LoiNhap("Học viên này không thuộc lớp nào của bạn.");

  const id = randomUUID();
  await pool.query(
    `INSERT INTO student_notes (id, student_id, class_id, teacher_id, body, shared_with_student)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      id,
      studentId,
      classId,
      teacherId,
      chu(body.body, "nội dung nhận xét", 4000),
      /* Mặc định KHÔNG chia sẻ. Xem ghi chú ở class-schema.sql. */
      body.sharedWithStudent === true,
    ],
  );
  return id;
}

export async function suaNhanXet(
  teacherId: string,
  noteId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE student_notes n
        SET body = coalesce($3, n.body),
            shared_with_student = coalesce($4, n.shared_with_student),
            updated_at = now()
      WHERE n.id = $1
        AND EXISTS (SELECT 1 FROM class_members m
                     JOIN classes c ON c.id = m.class_id
                    WHERE m.student_id = n.student_id AND c.teacher_id = $2)`,
    [
      noteId,
      teacherId,
      typeof body.body === "string" ? chu(body.body, "nội dung nhận xét", 4000) : null,
      typeof body.sharedWithStudent === "boolean" ? body.sharedWithStudent : null,
    ],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy nhận xét này.");
}

export async function xoaNhanXet(
  teacherId: string,
  noteId: string,
): Promise<void> {
  const { rowCount } = await pool.query(
    `DELETE FROM student_notes n
      WHERE n.id = $1
        AND EXISTS (SELECT 1 FROM class_members m
                     JOIN classes c ON c.id = m.class_id
                    WHERE m.student_id = n.student_id AND c.teacher_id = $2)`,
    [noteId, teacherId],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy nhận xét này.");
}
