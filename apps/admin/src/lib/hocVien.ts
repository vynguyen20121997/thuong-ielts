import { pool } from "@thuong-ielts/db";

import type {
  ChuKy,
  HinhThuc,
  HocVienTrongLop,
  LanDong,
  Lop,
  NhanXet,
  TomTatTien,
} from "./hocVienKieu";

/*
  Kiểu và nhãn ở `hocVienKieu.ts` — file này mở kết nối Postgres nên component
  client không được import nó. Re-export để nơi gọi phía SERVER vẫn lấy một
  chỗ; client thì import thẳng từ `hocVienKieu`.
*/
export * from "./hocVienKieu";

/**
 * Quản lý lớp: danh sách học viên, học phí, nhận xét riêng.
 *
 * Đọc thẳng DB, không cache. Số tiền và nhận xét là thứ cô vừa gõ xong một
 * giây trước — hiện ra con số cũ ở đây tệ hơn hẳn việc chậm thêm 30ms.
 *
 * MỌI hàm đều nhận `teacherId` và lọc theo nó. Không phải vì hôm nay có nhiều
 * giáo viên, mà vì ngày có người thứ hai thì lớp và học phí là đúng hai thứ
 * không được lẫn — và lúc đó không ai đi rà lại từng truy vấn nữa.
 */

/* Tiền về `number` ngay tại biên: `numeric` của pg trả về CHUỖI. */
const tien = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

export async function danhSachLop(teacherId: string): Promise<Lop[]> {
  const { rows } = await pool.query(
    `SELECT c.*,
            (SELECT count(*) FROM class_members m
              WHERE m.class_id = c.id AND m.left_on IS NULL) si_so
       FROM classes c
      WHERE c.teacher_id = $1
      ORDER BY c.is_active DESC, c.created_at DESC`,
    [teacherId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    note: r.note,
    tuitionAmount: tien(r.tuition_amount),
    tuitionCycle: r.tuition_cycle as ChuKy,
    startsOn: r.starts_on ? String(r.starts_on).slice(0, 10) : null,
    endsOn: r.ends_on ? String(r.ends_on).slice(0, 10) : null,
    isActive: r.is_active,
    siSo: Number(r.si_so),
  }));
}

export async function docLop(
  teacherId: string,
  classId: string,
): Promise<Lop | null> {
  const ds = await danhSachLop(teacherId);
  return ds.find((l) => l.id === classId) ?? null;
}

/**
 * Sổ điểm danh của một lớp.
 *
 * `ky` quyết định cột "đã đóng kỳ này". Lớp thu trọn khoá thì truyền `null` và
 * cột ấy trả về `null` — thà để trống còn hơn hiện "chưa đóng" cho một kỳ
 * không tồn tại.
 */
export async function hocVienCuaLop(
  teacherId: string,
  classId: string,
  ky: string | null,
): Promise<HocVienTrongLop[]> {
  const { rows } = await pool.query(
    `SELECT m.student_id, m.joined_on, m.left_on, m.tuition_override, m.note,
            s.name, s.email, s.phone,
            c.tuition_amount AS muc_lop,
            coalesce((SELECT sum(p.amount) FROM tuition_payments p
                       WHERE p.class_id = m.class_id
                         AND p.student_id = m.student_id), 0) da_dong,
            EXISTS (SELECT 1 FROM tuition_payments p
                     WHERE p.class_id = m.class_id
                       AND p.student_id = m.student_id
                       AND p.period IS NOT DISTINCT FROM $3) da_dong_ky,
            (SELECT count(*) FROM student_notes n
              WHERE n.student_id = m.student_id) so_nhan_xet,
            (SELECT count(*) FROM attempts a
              WHERE a.student_id = m.student_id
                AND a.status = 'submitted') so_luot,
            (SELECT max(a.submitted_at) FROM attempts a
              WHERE a.student_id = m.student_id
                AND a.status = 'submitted') lan_cuoi
       FROM class_members m
       JOIN classes c ON c.id = m.class_id
       JOIN students s ON s.id = m.student_id
      WHERE m.class_id = $2 AND c.teacher_id = $1
      ORDER BY m.left_on IS NOT NULL, s.name NULLS LAST, m.student_id`,
    [teacherId, classId, ky],
  );

  return rows.map((r) => {
    const rieng = tien(r.tuition_override);
    return {
      studentId: r.student_id,
      ten: r.name ?? "(chưa có tên)",
      email: r.email,
      phone: r.phone,
      joinedOn: String(r.joined_on).slice(0, 10),
      leftOn: r.left_on ? String(r.left_on).slice(0, 10) : null,
      tuitionOverride: rieng,
      hocPhi: rieng ?? tien(r.muc_lop),
      note: r.note,
      daDong: Number(r.da_dong),
      daDongKyNay: ky === null ? null : Boolean(r.da_dong_ky),
      soNhanXet: Number(r.so_nhan_xet),
      soLuotLam: Number(r.so_luot),
      lanLamCuoi: r.lan_cuoi ? new Date(r.lan_cuoi).toISOString() : null,
    };
  });
}

export async function lanDongCuaLop(
  teacherId: string,
  classId: string,
  gioiHan = 50,
): Promise<LanDong[]> {
  const { rows } = await pool.query(
    `SELECT p.*, s.name
       FROM tuition_payments p
       JOIN classes c ON c.id = p.class_id
       JOIN students s ON s.id = p.student_id
      WHERE p.class_id = $2 AND c.teacher_id = $1
      ORDER BY p.paid_on DESC, p.created_at DESC
      LIMIT $3`,
    [teacherId, classId, gioiHan],
  );
  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    ten: r.name ?? "(chưa có tên)",
    amount: Number(r.amount),
    paidOn: String(r.paid_on).slice(0, 10),
    period: r.period,
    method: r.method as HinhThuc,
    note: r.note,
  }));
}

/**
 * Nhận xét về một học viên.
 *
 * KHÔNG lọc theo `teacher_id` của nhận xét: cô A ghi, cô B dạy thay vẫn phải
 * đọc được, nếu không thì em ấy bị dạy lại từ đầu. Nhưng CHỈ đọc được khi em
 * ấy nằm trong một lớp của người đang đăng nhập — đó mới là ranh giới đúng.
 */
export async function nhanXetCuaHocVien(
  teacherId: string,
  studentId: string,
): Promise<NhanXet[]> {
  const { rows } = await pool.query(
    `SELECT n.*, s.name, c.name AS ten_lop
       FROM student_notes n
       JOIN students s ON s.id = n.student_id
       LEFT JOIN classes c ON c.id = n.class_id
      WHERE n.student_id = $2
        AND EXISTS (SELECT 1 FROM class_members m
                     JOIN classes c2 ON c2.id = m.class_id
                    WHERE m.student_id = $2 AND c2.teacher_id = $1)
      ORDER BY n.created_at DESC`,
    [teacherId, studentId],
  );
  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    ten: r.name ?? "(chưa có tên)",
    classId: r.class_id,
    tenLop: r.ten_lop,
    body: r.body,
    sharedWithStudent: r.shared_with_student,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

/**
 * Nhận xét của MỌI học viên trong một lớp, lấy một lần.
 *
 * Tải sẵn thay vì đợi cô bấm vào từng em: một lớp có chục em và mỗi em vài
 * dòng nhận xét — tổng cộng vẫn nhỏ hơn một tấm ảnh, mà đổi lại cô bấm sang
 * em khác là thấy ngay, không có khoảng chờ nào.
 */
export async function nhanXetCuaLop(
  teacherId: string,
  classId: string,
): Promise<NhanXet[]> {
  const { rows } = await pool.query(
    `SELECT n.*, s.name, c.name AS ten_lop
       FROM student_notes n
       JOIN students s ON s.id = n.student_id
       LEFT JOIN classes c ON c.id = n.class_id
      WHERE EXISTS (SELECT 1 FROM class_members m
                     JOIN classes c2 ON c2.id = m.class_id
                    WHERE m.class_id = $2 AND m.student_id = n.student_id
                      AND c2.teacher_id = $1)
      ORDER BY n.created_at DESC`,
    [teacherId, classId],
  );
  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    ten: r.name ?? "(chưa có tên)",
    classId: r.class_id,
    tenLop: r.ten_lop,
    body: r.body,
    sharedWithStudent: r.shared_with_student,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

/** Học viên chưa ở trong lớp này — để cô chọn khi thêm người. */
export async function hocVienChuaVaoLop(
  classId: string,
  tuKhoa = "",
  gioiHan = 30,
): Promise<{ id: string; ten: string; email: string | null }[]> {
  const { rows } = await pool.query(
    `SELECT s.id, s.name, s.email
       FROM students s
      WHERE NOT EXISTS (SELECT 1 FROM class_members m
                         WHERE m.class_id = $1 AND m.student_id = s.id)
        AND ($2 = '' OR s.name ILIKE '%' || $2 || '%'
                     OR s.email ILIKE '%' || $2 || '%'
                     OR s.phone ILIKE '%' || $2 || '%')
      ORDER BY s.name NULLS LAST, s.created_at DESC
      LIMIT $3`,
    [classId, tuKhoa, gioiHan],
  );
  return rows.map((r) => ({
    id: r.id,
    ten: r.name ?? "(chưa có tên)",
    email: r.email,
  }));
}

/**
 * Tổng tiền của một lớp.
 *
 * "Chưa đóng" ĐẾM NGƯỜI, không đếm tiền — và chỉ đếm người còn đang học. Đếm
 * tiền thiếu thì phải biết mỗi em nợ mấy kỳ, mà lớp này không có bảng công nợ
 * (cố ý — xem `class-schema.sql`). Đếm cả em đã nghỉ thì con số "chưa đóng"
 * cứ phình mãi và không bao giờ về 0, tới lúc đó cô sẽ thôi nhìn nó.
 */
export async function tomTatTien(
  teacherId: string,
  classId: string,
  ky: string | null,
): Promise<TomTatTien> {
  const { rows } = await pool.query(
    `SELECT
       coalesce((SELECT sum(p.amount) FROM tuition_payments p
                  WHERE p.class_id = $2 AND p.period IS NOT DISTINCT FROM $3), 0) thu_ky,
       coalesce((SELECT sum(p.amount) FROM tuition_payments p
                  WHERE p.class_id = $2), 0) thu_tat_ca,
       (SELECT count(*) FROM class_members m
         WHERE m.class_id = $2 AND m.left_on IS NULL) dang_hoc,
       (SELECT count(*) FROM class_members m
         WHERE m.class_id = $2 AND m.left_on IS NULL
           AND NOT EXISTS (SELECT 1 FROM tuition_payments p
                            WHERE p.class_id = m.class_id
                              AND p.student_id = m.student_id
                              AND p.period IS NOT DISTINCT FROM $3)) chua_dong
       FROM classes c WHERE c.id = $2 AND c.teacher_id = $1`,
    [teacherId, classId, ky],
  );
  const r = rows[0];
  return {
    thuKyNay: r ? Number(r.thu_ky) : 0,
    thuTatCa: r ? Number(r.thu_tat_ca) : 0,
    soChuaDong: r ? Number(r.chua_dong) : 0,
    soDangHoc: r ? Number(r.dang_hoc) : 0,
  };
}
