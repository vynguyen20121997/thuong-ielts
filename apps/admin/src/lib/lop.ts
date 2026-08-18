import { docKhoaLop, maLop, pool } from "@thuong-ielts/db";

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
  /** 'test' = thi cả bài, 'paper' = một passage lẻ. */
  phamVi: "paper" | "test";
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
// 25 giây, so với nhịp rỗng 10 giây của học sinh: chịu được một nhịp lỡ mà
// không báo động giả. Xem ghi chú ở `useProgressBeat`.
const NGUONG_MAT_KET_NOI = 25; // giây
const NGUONG_DA_ROI = 60;

/**
 * Một lớp = một BÀI CÔ GIAO, hoặc nhóm "tự luyện" của một đề.
 *
 * `khoa` có hai dạng: `bg-<id bài giao>` và `tl-<mã đề>`. Xem `khoaLop` ở
 * packages/db — hai tiến trình phải hiểu khoá này giống hệt nhau.
 */
export async function docLop(khoa: string): Promise<HocSinhTrongLop[]> {
  const k = docKhoaLop(khoa);
  if (!k) return [];

  // Bài giao: lấy đúng những lượt gắn vào nó. Tự luyện: lấy những lượt KHÔNG
  // gắn bài giao nào, cùng đề — em vào bằng link của cô thì không nằm ở đây.
  const dieuKien =
    k.loai === "bai-giao"
      ? "a.assignment_id = $1"
      : "a.assignment_id IS NULL AND (a.target = $1 OR a.target LIKE $1 || '-%')";
  const thamSo = k.loai === "bai-giao" ? k.id : maLop(k.target);

  const { rows } = await pool.query(
    `SELECT a.id, a.status, a.scope, a.total, a.correct, a.band,
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
      WHERE ${dieuKien}
        AND a.started_at > now() - interval '1 day'
      ORDER BY a.started_at DESC`,
    [thamSo]
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
      phamVi: row.scope,
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
export async function bangDiemLop(khoa: string): Promise<DongBangDiem[]> {
  const k = docKhoaLop(khoa);
  if (!k) return [];

  const dieuKien =
    k.loai === "bai-giao"
      ? "a.assignment_id = $1"
      : "a.assignment_id IS NULL AND (a.target = $1 OR a.target LIKE $1 || '-%')";
  const thamSo = k.loai === "bai-giao" ? k.id : maLop(k.target);

  const { rows } = await pool.query(
    `SELECT a.id, a.status, a.total, a.correct, a.band, a.elapsed_seconds,
            a.auto_submitted, a.submitted_at,
            COALESCE(s.name, a.guest_name, 'Học viên') AS ten,
            (a.student_id IS NULL) AS khach
       FROM attempts a
       LEFT JOIN students s ON s.id = a.student_id
      WHERE ${dieuKien}
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
    [thamSo]
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
  /** Khoá lớp: `bg-<id>` hoặc `tl-<mã đề>`. Dùng thẳng làm đường dẫn. */
  khoa: string;
  /** 'bai-giao' = cô giao; 'tu-luyen' = học sinh tự vào làm. */
  loai: "bai-giao" | "tu-luyen";
  /** 'class' = giao cả lớp, 'one' = gửi riêng một bạn. Chỉ có với bài giao. */
  choAi: "class" | "one" | null;
  /** Tên cô đặt cho buổi, hoặc tên đề khi tự luyện. */
  nhan: string;
  title: string;
  boDe: string;
  kyNang: "reading" | "listening";
  chuDe: string[];
  dangLam: number;
  daNop: number;
  matKetNoi: number;
  tenDangLam: string[];
  moiNhat: string;
  conMo: boolean;
}

/**
 * Màn chính: mọi lớp đang mở, tách theo BA TÌNH HUỐNG THẬT.
 *
 *   1. Cô giao cho cả lớp        -> một thẻ, khoá `bg-<id>`
 *   2. Cô gửi riêng cho một bạn  -> một thẻ RIÊNG, cũng `bg-<id>`
 *   3. Học sinh tự luyện         -> gom theo đề, khoá `tl-<mã đề>`
 *
 * Gom theo ĐỀ như trước là dồn cả ba vào một chỗ: em ở tỉnh khác tự luyện Cam
 * 12 Test 3 hiện ngay trong lớp cô đang dạy, và bài gửi riêng cho Minh Khôi
 * cũng lẫn vào đó. Bảng điểm buổi học vì thế có tên người lạ.
 *
 * Hai câu truy vấn chứ không phải một: hai nhóm gom theo hai khoá khác nhau,
 * ép vào một câu thì phải UNION rồi lại tách ra, dài hơn mà không nhanh hơn.
 */
export async function danhSachLop(teacherId: string): Promise<TheLop[]> {
  const chung = `
      count(*) FILTER (WHERE a.status = 'in_progress') AS dang_lam,
      count(*) FILTER (WHERE a.status = 'submitted')   AS da_nop,
      count(*) FILTER (
        WHERE a.status = 'in_progress'
          AND (p.last_beat_at IS NULL OR p.last_beat_at < now() - interval '25 seconds')
      ) AS mat_ket_noi,
      (array_agg(
         COALESCE(s.name, a.guest_name, 'Học viên') ORDER BY a.started_at DESC
       ) FILTER (WHERE a.status = 'in_progress'))[1:6] AS ten_dang_lam,
      max(a.started_at) AS moi_nhat,
      min(a.skill) AS skill,
      min(a.target) AS target`;

  // 1 + 2. Bài cô giao. Lấy CẢ bài chưa ai vào — cô vừa tạo link xong thì thẻ
  // phải hiện ngay để cô biết nó tồn tại, chứ không phải đợi em đầu tiên bấm.
  const baiGiao = await pool.query(
    `SELECT g.id, g.label, g.title, g.audience, g.is_open, g.closes_at, g.target AS g_target,
            g.skill AS g_skill, ${chung}
       FROM assignments g
       LEFT JOIN attempts a          ON a.assignment_id = g.id
       LEFT JOIN students s          ON s.id = a.student_id
       LEFT JOIN attempt_progress p  ON p.attempt_id = a.id
      WHERE g.teacher_id = $1
        AND g.created_at > now() - interval '2 days'
      GROUP BY g.id
      ORDER BY max(a.started_at) DESC NULLS LAST, g.created_at DESC`,
    [teacherId]
  );

  // 3. Tự luyện: những lượt KHÔNG gắn bài giao nào.
  const tuLuyen = await pool.query(
    `SELECT ${MA_LOP_SQL} AS ma_lop,
            COALESCE(
              min(a.title) FILTER (WHERE a.target = ${MA_LOP_SQL}),
              min(a.title)
            ) AS title,
            ${chung}
       FROM attempts a
       LEFT JOIN students s          ON s.id = a.student_id
       LEFT JOIN attempt_progress p  ON p.attempt_id = a.id
      WHERE a.assignment_id IS NULL
        AND a.started_at > now() - interval '1 day'
      GROUP BY ${MA_LOP_SQL}
      ORDER BY max(a.started_at) DESC`
  );

  const maDe = [
    ...baiGiao.rows.map((r) => r.g_target as string),
    ...tuLuyen.rows.map((r) => r.ma_lop as string),
  ];
  const bia = await biaNhieuDe(maDe);

  const the: TheLop[] = [
    ...baiGiao.rows.map((r) => {
      const b = bia.get(r.g_target as string);
      return {
        khoa: `bg-${r.id}`,
        loai: "bai-giao" as const,
        choAi: (r.audience ?? "class") as "class" | "one",
        nhan: r.label || r.title,
        title: r.title,
        boDe: b?.boDe ?? "",
        kyNang: (r.g_skill ?? "reading") as "reading" | "listening",
        chuDe: b?.chuDe ?? [],
        dangLam: Number(r.dang_lam),
        daNop: Number(r.da_nop),
        matKetNoi: Number(r.mat_ket_noi),
        tenDangLam: (r.ten_dang_lam ?? []).filter(Boolean),
        moiNhat: new Date(r.moi_nhat ?? Date.now()).toISOString(),
        conMo: r.is_open && (!r.closes_at || new Date(r.closes_at).getTime() > Date.now()),
      };
    }),
    ...tuLuyen.rows.map((r) => {
      const b = bia.get(r.ma_lop as string);
      return {
        khoa: `tl-${r.ma_lop}`,
        loai: "tu-luyen" as const,
        choAi: null,
        nhan: r.title,
        title: r.title,
        boDe: b?.boDe ?? "",
        kyNang: (r.skill ?? "reading") as "reading" | "listening",
        chuDe: b?.chuDe ?? [],
        dangLam: Number(r.dang_lam),
        daNop: Number(r.da_nop),
        matKetNoi: Number(r.mat_ket_noi),
        tenDangLam: (r.ten_dang_lam ?? []).filter(Boolean),
        moiNhat: new Date(r.moi_nhat).toISOString(),
        conMo: true,
      };
    }),
  ];

  return the;
}

/** Bộ đề + chủ đề cho nhiều mã đề một lượt, đỡ N+1 truy vấn. */
async function biaNhieuDe(
  maDe: string[]
): Promise<Map<string, { boDe: string; chuDe: string[] }>> {
  const m = new Map<string, { boDe: string; chuDe: string[] }>();
  const ds = [...new Set(maDe.filter(Boolean))];
  if (ds.length === 0) return m;

  const r = await pool.query(
    `SELECT COALESCE(substring(slug from '^(cam\d+-test\d+)-'), slug) AS ma,
            min(collection) AS bo,
            array_agg(DISTINCT topic) FILTER (WHERE topic IS NOT NULL AND topic <> '') AS chu_de
       FROM reading_tests
      WHERE COALESCE(substring(slug from '^(cam\d+-test\d+)-'), slug) = ANY($1)
      GROUP BY 1`,
    [ds]
  );
  for (const x of r.rows) {
    m.set(x.ma, { boDe: x.bo ?? "", chuDe: (x.chu_de ?? []).filter(Boolean).slice(0, 4) });
  }

  const l = await pool.query(
    `SELECT slug AS ma, collection AS bo, topic FROM listening_tests WHERE slug = ANY($1)`,
    [ds]
  );
  for (const x of l.rows) {
    m.set(x.ma, {
      boDe: x.bo ?? "",
      chuDe: x.topic ? String(x.topic).split(" · ").slice(0, 4) : [],
    });
  }

  return m;
}

/**
 * Bìa của một lớp: tên buổi, tên đề, bộ, chủ đề.
 *
 * Nhận KHOÁ LỚP chứ không phải mã đề — với bài cô giao thì tiêu đề phải là tên
 * buổi cô đặt ("Lớp 9A · thứ 3"), không phải tên đề, vì cô có thể giao cùng
 * một đề cho ba lớp khác nhau trong ngày.
 */
export async function biaLop(khoa: string): Promise<{
  nhan: string;
  title: string;
  boDe: string;
  chuDe: string[];
  kyNang: "reading" | "listening";
  loai: "bai-giao" | "tu-luyen";
  choAi: "class" | "one" | null;
  /** Cài đặt hiển thị kết quả — chỉ có với bài cô giao. */
  hienDiem: string | null;
  hienDapAn: string | null;
  daMoKetQua: boolean;
} | null> {
  const k = docKhoaLop(khoa);
  if (!k) return null;

  let target: string;
  let nhan: string | null = null;
  let choAi: "class" | "one" | null = null;
  let hienDiem: string | null = null;
  let hienDapAn: string | null = null;
  let daMoKetQua = false;

  if (k.loai === "bai-giao") {
    const { rows } = await pool.query(
      `SELECT target, title, label, audience, show_score, show_answers, results_opened_at
         FROM assignments WHERE id = $1 LIMIT 1`,
      [k.id]
    );
    if (!rows.length) return null;
    target = rows[0].target;
    nhan = rows[0].label || rows[0].title;
    choAi = rows[0].audience ?? "class";
    hienDiem = rows[0].show_score ?? "ngay";
    hienDapAn = rows[0].show_answers ?? "ngay";
    daMoKetQua = rows[0].results_opened_at !== null;
  } else {
    target = maLop(k.target);
  }

  const bia = (await biaNhieuDe([target])).get(target);

  const t = await pool.query(
    `SELECT min(title) AS title FROM reading_tests WHERE slug = $1 OR slug LIKE $1 || '-%'`,
    [target]
  );
  let title: string = t.rows[0]?.title
    ? String(t.rows[0].title).replace(/ · Passage \d+.*$/, "")
    : "";
  let kyNang: "reading" | "listening" = "reading";
  if (!title) {
    const l = await pool.query(`SELECT title FROM listening_tests WHERE slug = $1 LIMIT 1`, [
      target,
    ]);
    title = l.rows[0]?.title ?? target;
    kyNang = "listening";
  }

  return {
    nhan: nhan ?? title,
    title,
    boDe: bia?.boDe ?? "",
    chuDe: bia?.chuDe ?? [],
    kyNang,
    loai: k.loai,
    choAi,
    hienDiem,
    hienDapAn,
    daMoKetQua,
  };
}

export interface CauKho {
  so: number;
  daLam: number;
  dung: number;
  tiLe: number;
  dapAn: string | null;
  /** Những câu trả lời SAI hay gặp nhất, kèm số em mắc. */
  saiHayGap: Array<{ chu: string; soEm: number }>;
}

/**
 * Insights: cả lớp sai nhiều nhất ở câu nào.
 *
 * Đây là thứ biến bảng điểm thành công cụ dạy: bảng điểm nói AI cần giúp,
 * cái này nói CHỮA CÂU NÀO TRƯỚC. Cô có 15 phút cuối buổi, chữa được ba câu —
 * phải là ba câu cả lớp sai chứ không phải ba câu đầu tiên.
 *
 * Kèm luôn những đáp án sai hay gặp: mười em cùng viết "pleasure" thay vì
 * "dopamine" là cả lớp hiểu sai cùng một chỗ, và đó mới là điều đáng giảng —
 * khác hẳn với mười em sai mười kiểu khác nhau.
 */
export async function cauKhoNhat(khoa: string, gioiHan = 10): Promise<CauKho[]> {
  const k = docKhoaLop(khoa);
  if (!k) return [];

  const dieuKien =
    k.loai === "bai-giao"
      ? "a.assignment_id = $1"
      : "a.assignment_id IS NULL AND (a.target = $1 OR a.target LIKE $1 || '-%')";
  const thamSo = k.loai === "bai-giao" ? k.id : maLop(k.target);

  // Mở `results` (mảng { q, n, ok }) thành từng dòng rồi gom theo số câu.
  const { rows } = await pool.query(
    `SELECT (r ->> 'n')::int                              AS so,
            min(r ->> 'q')                                AS qid,
            count(*) FILTER (WHERE r ->> 'ok' <> 'null')  AS da_lam,
            count(*) FILTER (WHERE (r ->> 'ok')::boolean) AS dung
       FROM attempts a, jsonb_array_elements(a.results) r
      WHERE ${dieuKien}
        AND a.status = 'submitted'
        AND a.started_at > now() - interval '30 days'
      GROUP BY 1
      HAVING count(*) FILTER (WHERE r ->> 'ok' <> 'null') > 0
      ORDER BY (count(*) FILTER (WHERE (r ->> 'ok')::boolean))::numeric
               / NULLIF(count(*) FILTER (WHERE r ->> 'ok' <> 'null'), 0) ASC,
               1 ASC
      LIMIT $2`,
    [thamSo, gioiHan]
  );
  if (rows.length === 0) return [];

  // Đáp án đúng + những câu trả lời sai hay gặp, cho đúng các câu vừa lọc.
  const qids = rows.map((r) => r.qid as string).filter(Boolean);
  const dapAn = await dapAnCua(qids);
  const sai = await traLoiSaiHayGap(dieuKien, thamSo, qids);

  return rows.map((r) => {
    const daLam = Number(r.da_lam);
    const dung = Number(r.dung);
    return {
      so: Number(r.so),
      daLam,
      dung,
      tiLe: daLam > 0 ? Math.round((dung / daLam) * 100) : 0,
      dapAn: dapAn.get(r.qid) ?? null,
      saiHayGap: sai.get(r.qid) ?? [],
    };
  });
}

/**
 * Đáp án đúng theo id câu hỏi.
 *
 * Đây là một trong hai chỗ `answer_key` đi ra khỏi server, và nó nằm trong app
 * `admin` sau `proxy.ts` — xem ghi chú ở /api/luot/[id].
 */
async function dapAnCua(qids: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  if (qids.length === 0) return m;

  for (const bang of ["reading_tests", "listening_tests"]) {
    const { rows } = await pool.query(
      `SELECT e ->> 'questionId' AS qid, e ->> 'answer' AS dap
         FROM ${bang}, jsonb_array_elements(answer_key) e
        WHERE e ->> 'questionId' = ANY($1)`,
      [qids]
    );
    for (const r of rows) if (r.qid && !m.has(r.qid)) m.set(r.qid, r.dap);
  }
  return m;
}

/** Những chữ học sinh gõ SAI hay gặp nhất, theo từng câu. */
async function traLoiSaiHayGap(
  dieuKien: string,
  thamSo: string,
  qids: string[]
): Promise<Map<string, Array<{ chu: string; soEm: number }>>> {
  const m = new Map<string, Array<{ chu: string; soEm: number }>>();
  if (qids.length === 0) return m;

  const { rows } = await pool.query(
    `WITH cau AS (
       SELECT r ->> 'q' AS qid,
              (r ->> 'ok')::boolean AS ok,
              btrim(a.answers ->> (r ->> 'q')) AS chu
         FROM attempts a, jsonb_array_elements(a.results) r
        WHERE ${dieuKien}
          AND a.status = 'submitted'
          AND a.started_at > now() - interval '30 days'
     )
     SELECT qid, chu, count(*)::int AS so_em
       FROM cau
      WHERE qid = ANY($2) AND ok IS FALSE AND chu IS NOT NULL AND chu <> ''
      GROUP BY qid, chu
      ORDER BY qid, count(*) DESC
     `,
    [thamSo, qids]
  );

  for (const r of rows) {
    const ds = m.get(r.qid) ?? [];
    // Chỉ giữ ba kiểu sai phổ biến nhất mỗi câu — dài hơn thì thành danh sách
    // lỗi chính tả, không còn là thông tin để giảng.
    if (ds.length < 3) ds.push({ chu: r.chu, soEm: Number(r.so_em) });
    m.set(r.qid, ds);
  }
  return m;
}
