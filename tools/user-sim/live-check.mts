/**
 * Thả học sinh ảo vào làm bài, để kiểm tra đường realtime tới bảng lớp của cô.
 *
 * KHÁC với `personas.json` + `feedback.py`: bộ đó đo trải nghiệm giao diện và
 * lấy nhận xét. Bộ này chỉ đo **đường đi của dữ liệu** — mở lượt, nhịp tiến độ,
 * nộp bài — nên học sinh chạy ở tầng HTTP chứ không mở trình duyệt. Phần cần
 * mắt nhìn là màn hình của cô, và phần đó dùng trình duyệt thật.
 *
 * Học sinh ảo đăng nhập bằng cách ĐÚC THẲNG phiên next-auth, không qua Google:
 * OAuth thật không tự động hoá được, và ở đây thứ đang kiểm tra là nhịp chứ
 * không phải nút đăng nhập. Chỉ chạy trên máy dev — script này không đi kèm
 * bản build nào.
 *
 * Chạy:  npx tsx tools/user-sim/live-check.mts [--giu]
 *   --giu : giữ lại dữ liệu giả sau khi chạy (mặc định là dọn sạch)
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";
import { encode } from "next-auth/jwt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", "apps", "web", ".env.local") });

const WEB = process.env.SIM_WEB_URL ?? "http://localhost:2000";
const TARGET = process.env.SIM_TARGET ?? "cam12-test3";
const GIU_LAI = process.argv.includes("--giu");

/** Sáu học sinh, mỗi em một kiểu làm bài khác nhau — không phải cho đông. */
const HOC_SINH = [
  { ten: "Ngọc Ánh", kieu: "cham", moTa: "làm chậm, sai nhiều" },
  { ten: "Minh Khôi", kieu: "nhanh", moTa: "làm nhanh, đúng nhiều" },
  { ten: "Thu Hà", kieu: "deu", moTa: "làm đều tay" },
  { ten: "Gia Huy", kieu: "bo-ngang", moTa: "làm được một lúc rồi biến mất" },
  { ten: "Bảo Ngọc", kieu: "nop-som", moTa: "làm xong sớm rồi nộp" },
  { ten: "Khánh Linh", kieu: "deu", moTa: "làm đều tay" },
];

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

const cho = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function taoHocSinh(ten: string, i: number) {
  const id = `sim-${Date.now().toString(36)}-${i}`;
  await pool.query(
    `INSERT INTO students (id, email, name) VALUES ($1, $2, $3)`,
    [id, `${id}@sim.local`, ten]
  );
  // Hồ sơ phải đầy đủ, nếu không `requireStudent` sẽ đá về trang khai hồ sơ.
  await pool.query(
    `INSERT INTO student_profiles (student_id, age, age_recorded_at, occupation, target_band, completed_at)
     VALUES ($1, 17, CURRENT_DATE, 'student', 7.0, now())`,
    [id]
  );

  const token = await encode({
    token: { studentId: id, sub: id, name: ten },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  return { id, ten, cookie: `authjs.session-token=${token}` };
}

async function layCauHoi(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT questions FROM reading_tests WHERE slug LIKE $1
      ORDER BY COALESCE((questions -> 0 ->> 'number')::int, 999), slug`,
    [`${TARGET}-%`]
  );
  return rows.flatMap((r) => (r.questions ?? []).map((q: { id: string }) => q.id));
}

/** Đáp án đúng, để học sinh ảo "làm đúng" được thật chứ không đoán bừa. */
async function layDapAn(): Promise<Map<string, string>> {
  const { rows } = await pool.query(
    `SELECT answer_key FROM reading_tests WHERE slug LIKE $1`,
    [`${TARGET}-%`]
  );
  const m = new Map<string, string>();
  for (const r of rows) {
    for (const e of r.answer_key ?? []) m.set(e.questionId, e.answer);
  }
  return m;
}

interface KetQua {
  ten: string;
  kieu: string;
  attemptId: string | null;
  soNhip: number;
  nhipLoi: number;
  daLam: number;
  diem: string | null;
  ghiChu: string[];
}

async function chayMotEm(
  em: { id: string; ten: string; cookie: string },
  kieu: string,
  cauHoi: string[],
  dapAn: Map<string, string>
): Promise<KetQua> {
  const kq: KetQua = { ten: em.ten, kieu, attemptId: null, soNhip: 0, nhipLoi: 0, daLam: 0, diem: null, ghiChu: [] };

  // Thử lại y như client thật làm — DNS của RDS chập chờn, và một cú trượt
  // đúng giây bắt đầu là em này vô hình với cô suốt buổi.
  let res: Response | null = null;
  for (let lan = 1; lan <= 3; lan++) {
    res = await fetch(`${WEB}/api/practice/attempt/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: em.cookie },
      body: JSON.stringify({ skill: "reading", scope: "test", target: TARGET }),
    });
    if (res.ok) break;
    if (res.status < 500) break;
    kq.ghiChu.push(`mở lượt trượt lần ${lan}: HTTP ${res.status} — thử lại`);
    await cho(400 * lan);
  }
  if (!res || !res.ok) {
    kq.ghiChu.push(`mở lượt HỎNG HẲN: HTTP ${res?.status ?? "?"}`);
    return kq;
  }
  const { attemptId } = (await res.json()) as { attemptId: string };
  kq.attemptId = attemptId;

  // Mỗi kiểu học sinh: bao nhiêu câu mỗi vòng, tỉ lệ đúng, làm mấy vòng.
  const kichBan: Record<string, { moiVong: number; tiLeDung: number; soVong: number }> = {
    cham: { moiVong: 2, tiLeDung: 0.35, soVong: 5 },
    nhanh: { moiVong: 6, tiLeDung: 0.85, soVong: 5 },
    deu: { moiVong: 4, tiLeDung: 0.6, soVong: 5 },
    "bo-ngang": { moiVong: 4, tiLeDung: 0.5, soVong: 2 },
    "nop-som": { moiVong: 8, tiLeDung: 0.75, soVong: 4 },
  };
  const kb = kichBan[kieu] ?? kichBan.deu;

  const traLoi: Record<string, string> = {};
  for (let vong = 0; vong < kb.soVong; vong++) {
    for (let i = 0; i < kb.moiVong; i++) {
      const q = cauHoi[kq.daLam];
      if (!q) break;
      const dung = Math.random() < kb.tiLeDung;
      traLoi[q] = dung ? (dapAn.get(q) ?? "x") : "sai-roi";
      kq.daLam++;
    }

    const beat = await fetch(`${WEB}/api/practice/attempt/${attemptId}/beat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: em.cookie },
      body: JSON.stringify({ answers: traLoi, part: `Passage ${Math.min(3, vong + 1)}` }),
    });
    if (beat.ok) {
      kq.soNhip++;
      // ĐIỀU QUAN TRỌNG NHẤT PHẢI KIỂM: học sinh không được nhìn thấy đúng/sai.
      const body = await beat.text();
      if (/marks|correct|expected|isCorrect/i.test(body)) {
        kq.ghiChu.push(`RÒ ĐÁP ÁN trong phản hồi nhịp: ${body.slice(0, 120)}`);
      }
    } else {
      kq.nhipLoi++;
    }

    await cho(5200); // đúng chu kỳ nhịp thật
  }

  if (kieu === "bo-ngang") {
    kq.ghiChu.push("bỏ ngang, không nộp — phải hiện 'mất kết nối' rồi 'đã rời'");
    return kq;
  }

  const nop = await fetch(`${WEB}/api/practice/reading/test/${TARGET}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: em.cookie },
    body: JSON.stringify({ answers: traLoi, elapsedSeconds: 1200, attemptId, autoSubmitted: false }),
  });
  if (!nop.ok) {
    kq.ghiChu.push(`nộp hỏng: HTTP ${nop.status}`);
    return kq;
  }
  const graded = (await nop.json()) as { correct: number; total: number; band: number };
  kq.diem = `${graded.correct}/${graded.total} band ${graded.band}`;
  return kq;
}

async function main() {
  console.log(`SIM đề: ${TARGET} — web: ${WEB}`);

  const cauHoi = await layCauHoi();
  const dapAn = await layDapAn();
  console.log(`SIM đề có ${cauHoi.length} câu, ${dapAn.size} đáp án`);
  if (cauHoi.length === 0) {
    console.error("SIM không tìm thấy đề. Đặt SIM_TARGET cho đúng.");
    await pool.end();
    process.exit(1);
  }

  const dsHocSinh = [];
  for (let i = 0; i < HOC_SINH.length; i++) {
    dsHocSinh.push(await taoHocSinh(HOC_SINH[i].ten, i));
  }
  console.log(`SIM đã tạo ${dsHocSinh.length} học sinh ảo`);
  console.log(`SIM ==> MỞ NGAY bảng lớp của cô: http://localhost:2100/lop/${TARGET}`);

  // Vào phòng lệch nhau vài giây, giống một lớp thật chứ không phải bấm đồng loạt.
  const chay = dsHocSinh.map(async (em, i) => {
    await cho(i * 1500);
    return chayMotEm(em, HOC_SINH[i].kieu, cauHoi, dapAn);
  });
  const ketQua = await Promise.all(chay);

  console.log("\nSIM ===== KẾT QUẢ =====");
  for (const k of ketQua) {
    console.log(
      `SIM ${k.ten.padEnd(11)} [${k.kieu.padEnd(9)}] nhịp ${k.soNhip} (lỗi ${k.nhipLoi})` +
        ` | đã làm ${k.daLam} | ${k.diem ?? "chưa nộp"}`
    );
    for (const g of k.ghiChu) console.log(`SIM    - ${g}`);
  }

  const { rows } = await pool.query(
    `SELECT a.status, count(*)::int AS n FROM attempts a
      WHERE a.student_id LIKE 'sim-%' GROUP BY a.status ORDER BY a.status`
  );
  console.log("SIM trạng thái trong DB:", rows.map((r) => `${r.status}=${r.n}`).join(", "));

  if (GIU_LAI) {
    console.log("SIM giữ lại dữ liệu giả (--giu). Dọn sau bằng cách chạy lại không có cờ này.");
  } else {
    const d = await pool.query(`DELETE FROM students WHERE id LIKE 'sim-%'`);
    console.log(`SIM đã dọn ${d.rowCount} học sinh ảo (lượt làm bài xoá theo).`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
