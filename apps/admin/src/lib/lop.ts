import { maLop, pool } from "@thuong-ielts/db";

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
  /** Phần em ấy đang làm ("Passage 2"). Rỗng khi chưa có nhịp nào. */
  phan: string | null;
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
            p.current_part,
            p.last_beat_at,
            EXTRACT(EPOCH FROM (now() - p.last_beat_at))::int AS im_lang
       FROM attempts a
       LEFT JOIN students s          ON s.id = a.student_id
       LEFT JOIN attempt_progress p  ON p.attempt_id = a.id
      -- Cùng một đề thì cùng một lớp: em thi cả bài (cam12-test3) và em làm
      -- passage lẻ (cam12-test3-flying-tortoises) phải nằm chung một bảng.
      -- Không gom thì cô phải mở bốn tab mới thấy hết lớp mình.
      WHERE (a.target = $1 OR a.target LIKE $1 || '-%')
        AND a.started_at > now() - interval '1 day'
      ORDER BY a.started_at DESC`,
    [maLop(target)]
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
      phan: row.current_part ?? null,
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
/**
 * Những lớp đang mở — gom theo ĐỀ, không theo từng dòng `target`.
 *
 * Gom trong SQL bằng cách cắt hậu tố passage: `cam12-test3-flying-tortoises`
 * và `cam12-test3` phải ra cùng một nhóm. Biểu thức dưới đây là bản SQL của
 * `maLop()` — hai chỗ phải nói cùng một thứ, nên sửa một chỗ thì nhớ chỗ kia.
 */
// `String.raw` chứ không phải chuỗi thường: trong template literal của JS, `\d`
// bị nuốt mất dấu gạch chéo và thành `d`, nên SQL sẽ đi tìm `camd+-testd+` —
// không bao giờ khớp, không báo lỗi, và mọi đề lại tách thành từng lớp riêng.
// Đã sập đúng cái bẫy này một lần.
const MA_LOP_SQL = String.raw`COALESCE(substring(a.target from '^(cam\d+-test\d+)-'), a.target)`;

export async function danhSachLopDangMo(): Promise<
  Array<{ target: string; title: string; dangLam: number; daNop: number }>
> {
  const { rows } = await pool.query(
    `SELECT ${MA_LOP_SQL} AS ma_lop,
            -- Tên đề: ưu tiên tên của lượt thi CẢ BÀI vì nó là nhãn của cả đề
            -- ("Cam 12 · Reading Test 3"); không có thì lấy tạm tên passage.
            COALESCE(
              min(a.title) FILTER (WHERE a.target = ${MA_LOP_SQL}),
              min(a.title)
            ) AS title,
            count(*) FILTER (WHERE a.status = 'in_progress') AS dang_lam,
            count(*) FILTER (WHERE a.status = 'submitted')   AS da_nop
       FROM attempts a
      WHERE a.started_at > now() - interval '1 day'
      GROUP BY ${MA_LOP_SQL}
      ORDER BY max(a.started_at) DESC`
  );

  return rows.map((r) => ({
    target: r.ma_lop,
    title: r.title,
    dangLam: Number(r.dang_lam),
    daNop: Number(r.da_nop),
  }));
}

export interface DongBangDiem {
  attemptId: string;
  ten: string;
  khach: boolean;
  trangThai: string;
  dung: number;
  tong: number;
  band: number | null;
  phutLam: number;
  tuDongNop: boolean;
  nopLuc: string | null;
  /** 0–100. Cách duy nhất so sánh được giữa bài 40 câu và bài 13 câu. */
  tiLe: number;
}

/**
 * Bảng điểm cả lớp — dùng sau buổi học, không phải trong lúc học.
 *
 * Khác `docLop`: chỉ những lượt đã xong, sắp theo điểm cao xuống thấp, và
 * không mang theo `marks` (bảng điểm chỉ cần con số, mà `marks` mỗi dòng vài
 * trăm byte).
 */
export async function bangDiemLop(target: string): Promise<DongBangDiem[]> {
  const { rows } = await pool.query(
    `SELECT a.id, a.status, a.total, a.correct, a.band, a.elapsed_seconds,
            a.auto_submitted, a.submitted_at,
            COALESCE(s.name, a.guest_name, 'Học viên') AS ten,
            (a.student_id IS NULL) AS khach
       FROM attempts a
       LEFT JOIN students s ON s.id = a.student_id
      WHERE (a.target = $1 OR a.target LIKE $1 || '-%')
        AND a.started_at > now() - interval '30 days'
      -- Xếp theo TỈ LỆ đúng, không theo số câu đúng thô.
      --
      -- Một lớp có thể vừa có em thi cả bài 40 câu vừa có em làm một passage
      -- 13 câu. Xếp theo số câu thì em làm 11/13 (85%) đứng dưới em làm
      -- 22/40 (55%) — hạng nhất trao nhầm người, mà cô đọc tên theo thứ tự
      -- này trước cả lớp.
      ORDER BY (a.status = 'submitted') DESC,
               (a.correct::numeric / GREATEST(a.total, 1)) DESC,
               a.submitted_at ASC`,
    [maLop(target)]
  );

  return rows.map((r) => ({
    attemptId: r.id,
    ten: r.ten,
    khach: r.khach,
    trangThai: r.status,
    dung: r.correct,
    tong: r.total,
    band: r.band === null ? null : Number(r.band),
    phutLam: Math.round((r.elapsed_seconds ?? 0) / 60),
    tuDongNop: r.auto_submitted,
    nopLuc: r.submitted_at ? new Date(r.submitted_at).toISOString() : null,
    tiLe: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
  }));
}

export interface TheLop {
  target: string;
  title: string;
  boDe: string;
  kyNang: "reading" | "listening";
  chuDe: string[];
  dangLam: number;
  daNop: number;
  matKetNoi: number;
  /** Tên vài em đang làm — cô nhận ra lớp mình qua tên, không qua mã đề. */
  tenDangLam: string[];
  batDauLuc: string;
}

/**
 * Màn chính của phần theo dõi: những lớp đang mở, gom theo bộ đề.
 *
 * Khác `danhSachLopDangMo` cũ ở chỗ mang theo đủ thứ để cô NHẬN RA lớp mình
 * mà không phải bấm vào: tên đề thật, chủ đề, và tên vài em đang làm. Trước
 * đây thẻ chỉ có mã đề dạng `cam12-test3` — cô dạy ba lớp trong ngày thì nhìn
 * ba cái mã đó không biết cái nào là lớp đang cần xem.
 */
export async function danhSachLop(): Promise<TheLop[]> {
  const { rows } = await pool.query(
    `WITH lop AS (
       SELECT ${MA_LOP_SQL} AS ma_lop,
              min(a.skill) AS skill,
              COALESCE(
                min(a.title) FILTER (WHERE a.target = ${MA_LOP_SQL}),
                min(a.title)
              ) AS title,
              max(a.started_at) AS moi_nhat,
              count(*) FILTER (WHERE a.status = 'in_progress') AS dang_lam,
              count(*) FILTER (WHERE a.status = 'submitted')   AS da_nop,
              count(*) FILTER (
                WHERE a.status = 'in_progress'
                  AND (p.last_beat_at IS NULL OR p.last_beat_at < now() - interval '20 seconds')
              ) AS mat_ket_noi,
              (array_agg(
                 COALESCE(s.name, a.guest_name, 'Học viên')
                 ORDER BY a.started_at DESC
               ) FILTER (WHERE a.status = 'in_progress'))[1:6] AS ten_dang_lam
         FROM attempts a
         LEFT JOIN students s          ON s.id = a.student_id
         LEFT JOIN attempt_progress p  ON p.attempt_id = a.id
        WHERE a.started_at > now() - interval '1 day'
        GROUP BY ${MA_LOP_SQL}
     )
     SELECT l.*,
            -- Bộ đề và chủ đề lấy từ bảng đề, không lấy từ lượt làm: lượt chỉ
            -- lưu tên đề tại thời điểm làm, còn đây là thông tin của chính đề.
            COALESCE(r.collection, li.collection, '') AS bo_de,
            COALESCE(r.chu_de, ARRAY[li.topic], ARRAY[]::text[]) AS chu_de
       FROM lop l
       LEFT JOIN LATERAL (
         SELECT min(collection) AS collection,
                array_agg(DISTINCT topic) FILTER (WHERE topic IS NOT NULL AND topic <> '') AS chu_de
           FROM reading_tests
          WHERE slug = l.ma_lop OR slug LIKE l.ma_lop || '-%'
       ) r ON l.skill = 'reading'
       LEFT JOIN LATERAL (
         SELECT collection, topic FROM listening_tests WHERE slug = l.ma_lop LIMIT 1
       ) li ON l.skill = 'listening'
      ORDER BY l.dang_lam DESC, l.moi_nhat DESC`
  );

  return rows.map((r) => ({
    target: r.ma_lop,
    title: r.title,
    boDe: r.bo_de ?? "",
    kyNang: r.skill,
    chuDe: (r.chu_de ?? []).filter(Boolean).slice(0, 4),
    dangLam: Number(r.dang_lam),
    daNop: Number(r.da_nop),
    matKetNoi: Number(r.mat_ket_noi),
    tenDangLam: (r.ten_dang_lam ?? []).filter(Boolean),
    batDauLuc: new Date(r.moi_nhat).toISOString(),
  }));
}

/**
 * Bìa của một lớp: tên đề thật, bộ, chủ đề.
 *
 * Màn chi tiết trước đây chỉ có mã đề trên tiêu đề (`cam12-test3`). Cô mở ba
 * tab cho ba lớp thì ba tab giống hệt nhau — phải nhìn thanh địa chỉ mới biết
 * đang xem lớp nào.
 */
export async function biaLop(
  target: string
): Promise<{ title: string; boDe: string; chuDe: string[]; kyNang: "reading" | "listening" } | null> {
  const ma = maLop(target);

  const r = await pool.query(
    `SELECT min(collection) AS bo,
            min(title) AS title,
            array_agg(DISTINCT topic) FILTER (WHERE topic IS NOT NULL AND topic <> '') AS chu_de
       FROM reading_tests
      WHERE slug = $1 OR slug LIKE $1 || '-%'`,
    [ma]
  );
  if (r.rows[0]?.title) {
    return {
      title: String(r.rows[0].title).replace(/ · Passage \d+.*$/, ""),
      boDe: r.rows[0].bo ?? "",
      chuDe: (r.rows[0].chu_de ?? []).filter(Boolean),
      kyNang: "reading",
    };
  }

  const l = await pool.query(
    `SELECT title, collection, topic FROM listening_tests WHERE slug = $1 LIMIT 1`,
    [ma]
  );
  if (l.rows.length) {
    return {
      title: l.rows[0].title,
      boDe: l.rows[0].collection ?? "",
      chuDe: l.rows[0].topic ? String(l.rows[0].topic).split(" · ") : [],
      kyNang: "listening",
    };
  }

  return null;
}
