import { MA_DE_SQL, dongBaiGiao, moKetQua, pool } from "@thuong-ielts/db";

import { luuDeNoiBo, taoDeNoiBo, taoDeWritingNoiBo, xoaDeNoiBo } from "./deNoiBo";
import { LoiSoan, type DangCau, type DeSoan } from "./deNoiBoKieu";
import { LoiGiao, giaoBai } from "./giaoBai";

/**
 * Các tool MCP cho AI agent giao bài thay cô.
 *
 * Luật: mỗi tool gọi lại ĐÚNG hàm mà trang admin dùng (`giaoBai`,
 * `taoDeNoiBo`/`luuDeNoiBo`, `taoDeWritingNoiBo`…). Không có bản cài đặt thứ
 * hai cho agent — hai lối vào mà hai luật là có ngày agent làm được thứ trang
 * admin chặn. Mọi tool nhận `teacherId` từ TOKEN, không từ tham số.
 *
 * Đề Reading do agent soạn nằm `draft` (xem `luuDeNoiBo`): đáp án model viết
 * có thể sai, cô phải duyệt trên trang soạn rồi mới giao được.
 */

type Json = Record<string, unknown>;

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Json;
  annotations?: Json;
  chay: (teacherId: string, args: Json) => Promise<unknown>;
}

/** Lỗi mà agent đọc được và sửa được (sai tham số, đề không có…). */
export class LoiTool extends Error {}

const GOC_WEB = () => (process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:2000").replace(/\/$/, "");
const GOC_ADMIN = () => (process.env.ADMIN_URL ?? "http://localhost:2100").replace(/\/$/, "");

const chuoi = (v: unknown, ten: string, toiDa = 4000) => {
  if (typeof v !== "string" || !v.trim()) throw new LoiTool(`Thiếu "${ten}".`);
  return v.slice(0, toiDa);
};

const DANG_READING: DangCau[] = [
  "gap-fill",
  "multiple-choice",
  "true-false-not-given",
  "yes-no-not-given",
  "matching-headings",
  "matching-information",
  "matching-features",
  "matching-endings",
];

/* ── Đọc ─────────────────────────────────────────────────────────────────── */

async function danhSachDe(teacherId: string, args: Json) {
  const tim = typeof args.tim === "string" ? args.tim.trim().slice(0, 80) : "";
  const kyNang = args.kyNang;
  const like = `%${tim}%`;
  const ra: { kyNang: string; nguon: string; target: string; title: string; ghiChu?: string }[] = [];

  if (!kyNang || kyNang === "reading") {
    const { rows: noiBo } = await pool.query(
      `SELECT slug, title, status, question_count FROM reading_tests
        WHERE owner_id = $1 AND title ILIKE $2 ORDER BY updated_at DESC LIMIT 20`,
      [teacherId, like]
    );
    for (const r of noiBo)
      ra.push({
        kyNang: "reading",
        nguon: "noi-bo",
        target: r.slug,
        title: r.title,
        ...(r.status !== "published" || !r.question_count
          ? { ghiChu: r.question_count ? "chờ cô duyệt — chưa giao được" : "chưa có câu nào — chưa giao được" }
          : {}),
      });
    const { rows: kho } = await pool.query(
      `SELECT COALESCE(substring(slug from '${MA_DE_SQL}'), slug) AS target, min(title) AS title
         FROM reading_tests
        WHERE status = 'published' AND owner_id IS NULL AND title ILIKE $1
        GROUP BY 1 ORDER BY 1 LIMIT 30`,
      [like]
    );
    for (const r of kho)
      ra.push({ kyNang: "reading", nguon: "kho", target: r.target, title: String(r.title).replace(/ · Passage \d+.*$/, "") });
  }
  if (!kyNang || kyNang === "listening") {
    const { rows } = await pool.query(
      `SELECT slug, title FROM listening_tests
        WHERE status = 'published' AND owner_id IS NULL AND title ILIKE $1 ORDER BY slug LIMIT 30`,
      [like]
    );
    for (const r of rows) ra.push({ kyNang: "listening", nguon: "kho", target: r.slug, title: r.title });
  }
  if (!kyNang || kyNang === "writing") {
    const { rows } = await pool.query(
      `SELECT id, title, task FROM writing_prompts
        WHERE owner_id = $1 AND published AND title ILIKE $2 ORDER BY updated_at DESC LIMIT 20`,
      [teacherId, like]
    );
    for (const r of rows) ra.push({ kyNang: "writing", nguon: "noi-bo", target: r.id, title: `${r.title} (Task ${r.task})` });
  }
  return { soDe: ra.length, de: ra };
}

async function danhSachBaiDaGiao(teacherId: string, args: Json) {
  const gioiHan = Math.max(1, Math.min(50, Number(args.gioiHan) || 15));
  const { rows } = await pool.query(
    `SELECT a.id, a.skill, a.title, a.label, a.share_token, a.is_open, a.closes_at, a.created_at,
            (SELECT count(*) FROM attempts t WHERE t.assignment_id = a.id AND t.status = 'submitted')
              + (SELECT count(*) FROM writing_submissions w WHERE w.assignment_id = a.id) AS da_nop
       FROM assignments a WHERE a.teacher_id = $1
      ORDER BY a.created_at DESC LIMIT $2`,
    [teacherId, gioiHan]
  );
  return rows.map((r) => ({
    id: r.id,
    kyNang: r.skill,
    ten: r.label || r.title,
    link: `${GOC_WEB()}/vao/${r.share_token}`,
    dangMo: r.is_open && (!r.closes_at || new Date(r.closes_at).getTime() > Date.now()),
    daNop: Number(r.da_nop),
    taoLuc: new Date(r.created_at).toISOString(),
  }));
}

async function ketQuaBaiGiao(teacherId: string, args: Json) {
  const id = chuoi(args.id, "id", 64);
  const { rows: bai } = await pool.query(
    `SELECT id, skill, title, label FROM assignments WHERE id = $1 AND teacher_id = $2`,
    [id, teacherId]
  );
  if (!bai[0]) throw new LoiTool("Không tìm thấy bài giao này.");

  if (bai[0].skill === "writing") {
    const { rows } = await pool.query(
      `SELECT coalesce(s.name, w.guest_name, 'Khách') AS ten, w.words, w.essay, w.result, w.submitted_at
         FROM writing_submissions w LEFT JOIN students s ON s.id = w.student_id
        WHERE w.assignment_id = $1 ORDER BY w.submitted_at`,
      [id]
    );
    return {
      ten: bai[0].label || bai[0].title,
      kyNang: "writing",
      baiNop: rows.map((r) => ({
        hocSinh: r.ten,
        soTu: r.words,
        band: r.result?.kind === "graded" ? r.result.result.overall : null,
        tieuChi: r.result?.kind === "graded" ? r.result.result.criteria.map((c: { id: string; band: number }) => ({ [c.id]: c.band })) : null,
        trangThaiCham: r.result?.kind ?? "chua-cham",
        baiViet: r.essay,
        nopLuc: new Date(r.submitted_at).toISOString(),
      })),
      xemTrenAdmin: `${GOC_ADMIN()}/lop/giao/${id}`,
    };
  }

  const { rows } = await pool.query(
    `SELECT coalesce(s.name, t.guest_name, 'Khách') AS ten, t.status, t.correct, t.total, t.band, t.submitted_at
       FROM attempts t LEFT JOIN students s ON s.id = t.student_id
      WHERE t.assignment_id = $1 ORDER BY t.submitted_at`,
    [id]
  );
  return {
    ten: bai[0].label || bai[0].title,
    kyNang: bai[0].skill,
    luot: rows.map((r) => ({
      hocSinh: r.ten,
      daNop: r.status === "submitted",
      dung: r.status === "submitted" ? `${r.correct}/${r.total}` : null,
      band: r.status === "submitted" && r.band !== null ? Number(r.band) : null,
    })),
  };
}

/* ── Ghi ─────────────────────────────────────────────────────────────────── */

async function giaoBaiTool(teacherId: string, args: Json) {
  try {
    const kq = await giaoBai(teacherId, {
      skill: args.kyNang,
      target: args.target,
      label: args.tenBuoi,
      allowGuest: args.choKhach !== false,
      audience: args.choAi === "mot-ban" ? "one" : "class",
      showScore: args.hienDiem,
      showAnswers: args.hienDapAn,
      dongSauGio: typeof args.dongSauGio === "number" ? args.dongSauGio : 12,
    });
    return { id: kq.id, ten: kq.title, link: `${GOC_WEB()}/vao/${kq.token}`, ghiChu: "Gửi link này vào nhóm lớp." };
  } catch (err) {
    if (err instanceof LoiGiao) throw new LoiTool(err.message);
    throw err;
  }
}

async function taoDeWritingTool(teacherId: string, args: Json) {
  const task = Number(args.task) === 1 ? 1 : 2;
  try {
    const id = await taoDeWritingNoiBo(teacherId, {
      title: chuoi(args.ten, "ten", 200),
      task,
      prompt: chuoi(args.deBai, "deBai"),
      minWords: Number(args.soTuToiThieu ?? (task === 1 ? 150 : 250)),
      minutes: Number(args.soPhut ?? (task === 1 ? 20 : 40)),
    });
    return { target: id, kyNang: "writing", ghiChu: "Đề sẵn sàng. Gọi giao_bai với target này để lấy link." };
  } catch (err) {
    if (err instanceof LoiSoan) throw new LoiTool(err.message);
    throw err;
  }
}

async function taoDeReadingTool(teacherId: string, args: Json) {
  const nhom = Array.isArray(args.nhomCau) ? (args.nhomCau as Json[]) : [];
  const de: DeSoan = {
    code: chuoi(args.maDe, "maDe", 60),
    title: chuoi(args.ten, "ten", 200),
    minutes: Number(args.soPhut ?? 20),
    description: "Soạn bởi AI agent",
    passageTitle: typeof args.tieuDeBaiDoc === "string" ? args.tieuDeBaiDoc : "",
    passageText: chuoi(args.baiDoc, "baiDoc", 20000),
    labelParagraphs: args.danhChuDoan === true,
    groups: nhom.map((g, i) => {
      const type = g.dang as DangCau;
      if (!DANG_READING.includes(type)) throw new LoiTool(`Nhóm ${i + 1}: dạng "${String(g.dang)}" không hỗ trợ.`);
      const cau = Array.isArray(g.cau) ? (g.cau as Json[]) : [];
      return {
        type,
        instruction: typeof g.huongDan === "string" ? g.huongDan : "",
        options: Array.isArray(g.luaChonChung) ? g.luaChonChung.map(String) : [],
        maxWords: Number(g.toiDaSoTu ?? 2),
        questions: cau.map((c) => ({
          prompt: String(c.noiDung ?? ""),
          options: Array.isArray(c.luaChon) ? c.luaChon.map(String) : [],
          answer: String(c.dapAn ?? ""),
          acceptable: Array.isArray(c.chapNhanKhac) ? c.chapNhanKhac.map(String) : [],
          explanation: typeof c.giaiThich === "string" ? c.giaiThich : "",
        })),
      };
    }),
  };

  let id: string | null = null;
  try {
    id = await taoDeNoiBo(teacherId, { code: de.code, title: de.title, minutes: de.minutes, description: de.description });
    await luuDeNoiBo(teacherId, id, de, "ai");
  } catch (err) {
    // Tạo được vỏ mà nội dung hỏng thì xoá vỏ, để danh sách đề của cô không
    // mọc thêm một đề rỗng mỗi lần agent gửi sai.
    if (id) await xoaDeNoiBo(teacherId, id).catch(() => {});
    if (err instanceof LoiSoan) throw new LoiTool(err.message);
    throw err;
  }
  return {
    trangThai: "cho-co-duyet",
    ghiChu:
      "Đề đã lưu nhưng CHƯA giao được: cô phải mở link duyệt, đọc lại đáp án và bấm Lưu đề. " +
      "Báo cô mở link dưới đây. Đừng tự nhận là đã giao.",
    linkDuyet: `${GOC_ADMIN()}/de-noi-bo/${id}`,
  };
}

async function dongBai(teacherId: string, args: Json) {
  const id = chuoi(args.id, "id", 64);
  // `dongBaiGiao` im lặng bỏ qua id của người khác — kiểm trước để không báo
  // "đã đóng" cho một bài không hề đóng.
  const { rows } = await pool.query(`SELECT 1 FROM assignments WHERE id = $1 AND teacher_id = $2`, [id, teacherId]);
  if (!rows[0]) throw new LoiTool("Không tìm thấy bài giao này.");
  await dongBaiGiao(id, teacherId);
  return { daDong: true };
}

async function moKetQuaTool(teacherId: string, args: Json) {
  const id = chuoi(args.id, "id", 64);
  const { rows } = await pool.query(`SELECT 1 FROM assignments WHERE id = $1 AND teacher_id = $2`, [id, teacherId]);
  if (!rows[0]) throw new LoiTool("Không tìm thấy bài giao này.");
  await moKetQua(id, teacherId);
  return { daMo: true };
}

/* ── Khai báo ────────────────────────────────────────────────────────────── */

const MUC_HIEN = { type: "string", enum: ["ngay", "khi_co_mo", "khong"] };

export const TOOLS: McpTool[] = [
  {
    name: "danh_sach_de",
    description:
      "Tìm đề có thể giao: kho Reading/Listening (Cambridge…) và đề nội bộ của cô (Reading, Writing). " +
      "Trả về `target` để truyền vào giao_bai. Đề có `ghiChu` là chưa giao được.",
    inputSchema: {
      type: "object",
      properties: {
        tim: { type: "string", description: "Từ khoá trong tên đề, vd. 'Cam 12', 'Test 3', 'remote'." },
        kyNang: { type: "string", enum: ["reading", "listening", "writing"] },
      },
    },
    annotations: { readOnlyHint: true },
    chay: danhSachDe,
  },
  {
    name: "giao_bai",
    description:
      "Tạo link giao bài cho lớp từ một đề có sẵn (`target` lấy từ danh_sach_de). Trả về link để gửi vào nhóm lớp.",
    inputSchema: {
      type: "object",
      required: ["kyNang", "target"],
      properties: {
        kyNang: { type: "string", enum: ["reading", "listening", "writing"] },
        target: { type: "string" },
        tenBuoi: { type: "string", description: "Tên buổi học, vd. 'Lớp 9A · thứ 3'. Bỏ trống thì lấy tên đề." },
        choAi: { type: "string", enum: ["ca-lop", "mot-ban"], default: "ca-lop" },
        choKhach: { type: "boolean", default: true, description: "Cho học sinh chưa có tài khoản gõ tên để vào." },
        hienDiem: { ...MUC_HIEN, default: "ngay", description: "Khi nào học sinh thấy điểm/band." },
        hienDapAn: { ...MUC_HIEN, default: "ngay", description: "Khi nào học sinh thấy đáp án đúng (không áp dụng Writing)." },
        dongSauGio: { type: "number", default: 12, description: "Số giờ nữa link tự đóng (1–720)." },
      },
    },
    chay: giaoBaiTool,
  },
  {
    name: "tao_de_writing",
    description: "Tạo đề Writing nội bộ (Task 1 hoặc 2). Tạo xong giao được ngay bằng giao_bai.",
    inputSchema: {
      type: "object",
      required: ["ten", "deBai"],
      properties: {
        ten: { type: "string" },
        task: { type: "number", enum: [1, 2], default: 2 },
        deBai: { type: "string", description: "Đề bài nguyên văn như học sinh sẽ đọc." },
        soTuToiThieu: { type: "number", description: "Mặc định 150 (Task 1) / 250 (Task 2)." },
        soPhut: { type: "number", description: "Mặc định 20 (Task 1) / 40 (Task 2)." },
      },
    },
    chay: taoDeWritingTool,
  },
  {
    name: "tao_de_reading",
    description:
      "Soạn đề Reading nội bộ: bài đọc + các nhóm câu, kèm đáp án. Đề lưu ở trạng thái CHỜ CÔ DUYỆT — chưa giao được " +
      "cho tới khi cô đọc lại đáp án trên trang admin. Chỗ trống của dạng gap-fill đánh dấu bằng ___ trong `noiDung`. " +
      "Với dạng chọn, `dapAn` phải trùng y nguyên một lựa chọn (TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN là cố định).",
    inputSchema: {
      type: "object",
      required: ["maDe", "ten", "baiDoc", "nhomCau"],
      properties: {
        maDe: { type: "string", description: "Mã đề, vd. IT209-BUOI6. Không trùng đề cũ." },
        ten: { type: "string" },
        soPhut: { type: "number", default: 20 },
        tieuDeBaiDoc: { type: "string" },
        baiDoc: { type: "string", description: "Bài đọc; cách đoạn bằng một dòng trống." },
        danhChuDoan: { type: "boolean", description: "Đánh chữ A, B, C… cho đoạn (cần cho matching-headings/information)." },
        nhomCau: {
          type: "array",
          items: {
            type: "object",
            required: ["dang", "cau"],
            properties: {
              dang: { type: "string", enum: DANG_READING },
              huongDan: { type: "string" },
              toiDaSoTu: { type: "number", description: "gap-fill: tối đa số từ mỗi chỗ trống." },
              luaChonChung: { type: "array", items: { type: "string" }, description: "Các dạng matching-*: danh sách chung." },
              cau: {
                type: "array",
                items: {
                  type: "object",
                  required: ["noiDung", "dapAn"],
                  properties: {
                    noiDung: { type: "string" },
                    luaChon: { type: "array", items: { type: "string" }, description: "multiple-choice: 'A. …', 'B. …'." },
                    dapAn: { type: "string" },
                    chapNhanKhac: { type: "array", items: { type: "string" } },
                    giaiThich: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    chay: taoDeReadingTool,
  },
  {
    name: "danh_sach_bai_da_giao",
    description: "Các bài cô đã giao gần đây: link, còn mở không, bao nhiêu bài đã nộp.",
    inputSchema: { type: "object", properties: { gioiHan: { type: "number", default: 15 } } },
    annotations: { readOnlyHint: true },
    chay: danhSachBaiDaGiao,
  },
  {
    name: "ket_qua_bai_giao",
    description: "Kết quả một bài giao: Reading/Listening là số câu đúng + band; Writing là bài viết + band AI.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
    annotations: { readOnlyHint: true },
    chay: ketQuaBaiGiao,
  },
  {
    name: "dong_bai",
    description: "Đóng link một bài giao (không xoá bài đã nộp).",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
    annotations: { destructiveHint: true },
    chay: dongBai,
  },
  {
    name: "mo_ket_qua",
    description: "Mở điểm/đáp án cho cả lớp với bài đang để 'chờ cô mở'. Mở rồi không đóng lại được.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
    annotations: { destructiveHint: true },
    chay: moKetQuaTool,
  },
];
