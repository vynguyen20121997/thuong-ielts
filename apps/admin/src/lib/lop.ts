import { pool } from "@thuong-ielts/db";

/**
 * Bảng lớp — ai đang làm bài, tới đâu rồi.
 *
 * Đọc thẳng DB. Socket chỉ chở thông báo về sau; sự thật nằm ở đây. Nhờ vậy cô
 * mở trang giữa buổi là thấy đủ ngay, không phải chờ nhịp kế tiếp, và mất
 * socket cũng không mất gì — tải lại trang là đúng.
 */

export interface HocSinhTrongLop {
  attemptId: string;
  ten: string;
  khach: boolean;
  trangThai: "dang-lam" | "mat-ket-noi" | "da-nop" | "da-roi";
  daLam: number;
  dung: number;
  tong: number;
  marks: (boolean | null)[];
  conLai: number;
  band: number | null;
  lanCuoi: string | null;
}

/**
 * Trạng thái kết nối suy ra từ `last_beat_at`, không lưu thành cột.
 *
 * Một cột "đang online" thì phải có ai đó đi tắt nó, mà đúng lúc mạng học sinh
 * rớt thì không còn ai để tắt — cột sẽ mãi mãi nói "đang làm".
 */
const NGUONG_MAT_KET_NOI = 20; // giây
const NGUONG_DA_ROI = 60;

export async function docLop(target: string): Promise<HocSinhTrongLop[]> {
  const { rows } = await pool.query(
    `SELECT a.id, a.status, a.total, a.correct, a.band,
            COALESCE(s.name, a.guest_name, 'Học viên') AS ten,
            (a.student_id IS NULL) AS khach,
            GREATEST(0, EXTRACT(EPOCH FROM (a.expires_at - now()))::int) AS con_lai,
            COALESCE(p.answered, 0)          AS da_lam,
            COALESCE(p.correct, 0)           AS dung_tam,
            COALESCE(p.marks, '[]'::jsonb)   AS marks,
            p.last_beat_at,
            EXTRACT(EPOCH FROM (now() - p.last_beat_at))::int AS im_lang
       FROM attempts a
       LEFT JOIN students s          ON s.id = a.student_id
       LEFT JOIN attempt_progress p  ON p.attempt_id = a.id
      WHERE a.target = $1
        AND a.started_at > now() - interval '1 day'
      ORDER BY a.started_at DESC`,
    [target]
  );

  return rows.map((row) => {
    const daNop = row.status === "submitted";
    const imLang = row.im_lang ?? null;

    let trangThai: HocSinhTrongLop["trangThai"] = "dang-lam";
    if (daNop) trangThai = "da-nop";
    else if (imLang === null || imLang >= NGUONG_DA_ROI) trangThai = "da-roi";
    else if (imLang >= NGUONG_MAT_KET_NOI) trangThai = "mat-ket-noi";

    return {
      attemptId: row.id,
      ten: row.ten,
      khach: row.khach,
      trangThai,
      // Đã nộp thì lấy con số cuối cùng ở `attempts`; đang làm thì lấy ở
      // `attempt_progress`. Hai nguồn cho hai giai đoạn, không trộn.
      daLam: daNop ? row.total : row.da_lam,
      dung: daNop ? row.correct : row.dung_tam,
      tong: row.total,
      marks: Array.isArray(row.marks) ? row.marks : [],
      conLai: daNop ? 0 : row.con_lai,
      // NUMERIC về từ `pg` là chuỗi, không phải số.
      band: row.band === null ? null : Number(row.band),
      lanCuoi: row.last_beat_at ? new Date(row.last_beat_at).toISOString() : null,
    };
  });
}

/** Những đề đang có người làm — để cô chọn lớp nào cần xem. */
export async function danhSachLopDangMo(): Promise<
  Array<{ target: string; title: string; dangLam: number; daNop: number }>
> {
  const { rows } = await pool.query(
    `SELECT a.target, min(a.title) AS title,
            count(*) FILTER (WHERE a.status = 'in_progress') AS dang_lam,
            count(*) FILTER (WHERE a.status = 'submitted')   AS da_nop
       FROM attempts a
      WHERE a.started_at > now() - interval '1 day'
      GROUP BY a.target
      ORDER BY max(a.started_at) DESC`
  );

  return rows.map((r) => ({
    target: r.target,
    title: r.title,
    dangLam: Number(r.dang_lam),
    daNop: Number(r.da_nop),
  }));
}
