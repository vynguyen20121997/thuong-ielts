import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/admin/.env.local" });

/*
  Các CHỐT của bài cô giao — thứ `check-personas.ts` không chạm tới vì bộ đó
  chỉ đi đường thuận.

  Mỗi chốt dưới đây là một lời hứa cô thấy trên màn hình giao bài. Hỏng chốt
  nào thì hỏng im lặng: cô bật "chờ cô mở kết quả" mà đáp án vẫn nằm trong
  phản hồi mạng, hoặc cô đóng bài rồi mà vẫn có em nộp được.

  Cần cả hai dev server: web :2000, admin :2100.
*/

const WEB = process.env.CHECK_BASE_URL ?? "http://localhost:2000";
const ADMIN = process.env.CHECK_ADMIN_URL ?? "http://localhost:2100";

const CO = "sim-bg-co";
const EM = "sim-bg-em";

let hong = 0;
const loi: string[] = [];
function kiem(ten: string, dat: boolean, thuc?: unknown, mong?: unknown) {
  if (dat) {
    console.log(`  ok   ${ten}`);
    return;
  }
  hong += 1;
  const ct = mong === undefined ? "" : `: nhận ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`;
  loi.push(ten + ct);
  console.error(`  HỎNG ${ten}${ct}`);
}

async function goi(url: string, init: RequestInit & { cookie?: string } = {}) {
  const { cookie, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    redirect: "manual",
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(rest.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* HTML thì để nguyên text. */
  }
  return { status: res.status, body, text };
}

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");
  const phienAdmin = await import("../apps/admin/src/lib/sessionToken.js");

  const don = async () => {
    await pool.query("DELETE FROM attempts WHERE student_id = $1", [EM]);
    await pool.query("DELETE FROM assignments WHERE teacher_id = $1", [CO]);
    await pool.query("DELETE FROM teachers WHERE id = $1", [CO]);
    await pool.query("DELETE FROM students WHERE id = $1", [EM]);
  };
  await don();
  await pool.query(
    `INSERT INTO teachers (id, username, password_hash, name) VALUES ($1,$1,'x','Cô ảo')`,
    [CO],
  );
  await pool.query("INSERT INTO students (id,name) VALUES ($1,'Học sinh ảo')", [EM]);

  const veEm = `authjs.session-token=${await encode({
    token: { sub: EM, studentId: EM },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
    maxAge: 3600,
  })}`;
  const veCo = `${phienAdmin.SESSION_COOKIE}=${phienAdmin.createSessionToken(CO)}`;

  const { rows: de } = await pool.query<{ slug: string }>(
    `SELECT DISTINCT substring(slug from '^((?:cam[0-9]+|guide|train[12])-test[0-9]+)-') slug
       FROM reading_tests WHERE status='published'
        AND substring(slug from '^((?:cam[0-9]+|guide|train[12])-test[0-9]+)-') IS NOT NULL
      ORDER BY 1 LIMIT 1`,
  );
  const maDe = de[0].slug;

  const { rows: keyRows } = await pool.query<{
    answer_key: { questionId: string; answer: string }[];
  }>(
    `SELECT answer_key FROM reading_tests WHERE slug LIKE $1 || '-%' ORDER BY slug`,
    [maDe],
  );
  const key = keyRows.flatMap((r) => r.answer_key ?? []);
  const dungHet = Object.fromEntries(key.map((k) => [k.questionId, k.answer]));

  /*
    Dọn lượt đang mở giữa các phần.

    `openAttempt` CỐ Ý dùng lại lượt `in_progress` của cùng một đề — đó là cách
    duy nhất đúng khi học sinh F5 hoặc mở hai tab (giữ nguyên `expires_at`, nên
    tải lại trang không kéo dài giờ làm bài). Nhưng trong bài kiểm thì nó làm
    phần sau vớ phải lượt bỏ dở của phần trước, và lượt ấy mang `assignment_id`
    của bài giao khác — hoặc không mang gì cả.
  */
  const donLuot = async () => {
    await pool.query("DELETE FROM attempts WHERE student_id = $1", [EM]);
  };

  const giaoBai = async (them: Record<string, unknown> = {}) => {
    const r = await goi(`${ADMIN}/api/bai-giao`, {
      method: "POST",
      cookie: veCo,
      body: JSON.stringify({ skill: "reading", target: maDe, ...them }),
    });
    return { id: String(r.body.id ?? ""), token: String(r.body.token ?? ""), r };
  };

  const moVaNop = async (token: string, answers = dungHet) => {
    const mo = await goi(`${WEB}/api/practice/attempt/start`, {
      method: "POST",
      cookie: veEm,
      body: JSON.stringify({ skill: "reading", scope: "test", target: maDe, token }),
    });
    if (mo.status !== 200) return { mo, nop: null as null | Awaited<ReturnType<typeof goi>> };
    const nop = await goi(`${WEB}/api/practice/reading/test/${maDe}/submit`, {
      method: "POST",
      cookie: veEm,
      body: JSON.stringify({
        answers,
        elapsedSeconds: 600,
        attemptId: String(mo.body.attemptId ?? ""),
      }),
    });
    return { mo, nop };
  };

  /* ── 1. Chờ cô mở kết quả ────────────────────────────────────────────── */

  console.log("\n1) Cô bật 'chờ cô mở kết quả'");

  const kin = await giaoBai({ showScore: "khi_co_mo", showAnswers: "khi_co_mo" });
  const lan1 = await moVaNop(kin.token);
  kiem("học sinh nộp được", lan1.nop?.status === 200, lan1.nop?.status, 200);

  /*
    Giấu bằng giao diện là chưa đủ: mở tab Network là thấy. Phải cắt NGAY TRONG
    phản hồi của server.

    CHÚ Ý cách đọc — đã viết sai một lần: bản che KHÔNG bỏ trường `correct`, nó
    đặt về 0 kèm cờ `daChe` để giao diện nói "chờ cô mở" thay vì để học sinh
    nhìn 0/40 rồi tưởng mình sai hết bài. Và cũng đừng dò chuỗi đáp án trong cả
    phản hồi: `given` là thứ CHÍNH EM ẤY vừa gõ, dội lại là đúng. Thứ phải biến
    mất là `expected`, `explanation`, và `isCorrect`.
  */
  const goiTin = (lan1.nop?.body ?? {}) as {
    correct?: number;
    daChe?: { diem?: boolean; dapAn?: boolean };
    items?: { expected?: string; explanation?: string; isCorrect?: boolean }[];
  };

  kiem(
    "phản hồi khai rõ là bản đã che",
    goiTin.daChe?.diem === true && goiTin.daChe?.dapAn === true,
    goiTin.daChe,
    { diem: true, dapAn: true },
  );
  /* Em ấy trả lời ĐÚNG HẾT, mà điểm trả về vẫn phải là 0. */
  kiem("điểm bị cắt về 0 dù làm đúng hết", goiTin.correct === 0, goiTin.correct, 0);

  const conExpected = (goiTin.items ?? []).filter((i) => (i.expected ?? "") !== "");
  kiem(
    `không câu nào còn đáp án đúng (soi ${goiTin.items?.length ?? 0} câu)`,
    conExpected.length === 0,
    conExpected.slice(0, 2),
    [],
  );
  const conGiaiThich = (goiTin.items ?? []).filter((i) => i.explanation !== undefined);
  kiem("không câu nào còn lời giải thích", conGiaiThich.length === 0, conGiaiThich.length, 0);
  /* Đúng/sai từng câu cũng phải đi: suy ngược ra được điểm. */
  const loDungSai = (goiTin.items ?? []).filter((i) => i.isCorrect === true);
  kiem("không lộ câu nào đúng", loDungSai.length === 0, loDungSai.length, 0);

  const mo = await goi(`${ADMIN}/api/lop/bg-${kin.id}/mo-ket-qua`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({}),
  });
  kiem("cô mở được kết quả", mo.status === 200, mo.status, 200);

  const { rows: sauKhiMo } = await pool.query<{ results_opened_at: Date | null }>(
    "SELECT results_opened_at FROM assignments WHERE id=$1",
    [kin.id],
  );
  kiem("DB ghi mốc đã mở", sauKhiMo[0]?.results_opened_at !== null);

  const moLa = await goi(`${ADMIN}/api/lop/bg-${kin.id}/mo-ket-qua`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  kiem("người lạ không mở được kết quả", moLa.status !== 200, moLa.status, "khác 200");

  /* ── 2. Đóng bài ─────────────────────────────────────────────────────── */

  console.log("\n2) Cô đóng bài");

  await donLuot();
  const dong = await giaoBai();
  await pool.query("UPDATE assignments SET is_open = false WHERE id = $1", [dong.id]);
  const saukhiDong = await goi(`${WEB}/api/practice/attempt/start`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({ skill: "reading", scope: "test", target: maDe, token: dong.token }),
  });
  /*
    Đóng bài rồi thì link không còn tác dụng GẮN VÀO LỚP nữa. Em ấy vẫn tự
    luyện được (đó là quyền của em), nhưng lượt đó không được chui vào bảng
    điểm buổi học đã đóng.
  */
  const attemptDong = String(saukhiDong.body.attemptId ?? "");
  const { rows: gan } = await pool.query<{ assignment_id: string | null }>(
    "SELECT assignment_id FROM attempts WHERE id=$1",
    [attemptDong],
  );
  kiem(
    "bài đã đóng thì lượt mới KHÔNG gắn vào lớp đó",
    gan[0]?.assignment_id === null,
    gan[0]?.assignment_id,
    null,
  );

  await donLuot();
  const hetHan = await giaoBai();
  await pool.query(
    "UPDATE assignments SET closes_at = now() - interval '1 hour' WHERE id = $1",
    [hetHan.id],
  );
  const sauHetHan = await goi(`${WEB}/api/practice/attempt/start`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({ skill: "reading", scope: "test", target: maDe, token: hetHan.token }),
  });
  const { rows: gan2 } = await pool.query<{ assignment_id: string | null }>(
    "SELECT assignment_id FROM attempts WHERE id=$1",
    [String(sauHetHan.body.attemptId ?? "")],
  );
  kiem(
    "quá hạn đóng thì cũng không gắn vào lớp",
    gan2[0]?.assignment_id === null,
    gan2[0]?.assignment_id,
    null,
  );

  /* ── 3. Chỉ làm một lần ──────────────────────────────────────────────── */

  console.log("\n3) Cô bật 'chỉ làm một lần'");

  await donLuot();
  const motLan = await giaoBai({ oneAttempt: true });
  const lamLan1 = await moVaNop(motLan.token);
  kiem("lần một mở được", lamLan1.mo.status === 200, lamLan1.mo.body.error ?? lamLan1.mo.status, 200);
  kiem("lần một nộp được", lamLan1.nop?.status === 200, lamLan1.nop?.status, 200);
  const { rows: ganLan1 } = await pool.query<{ assignment_id: string | null; status: string }>(
    "SELECT assignment_id, status FROM attempts WHERE id=$1",
    [String(lamLan1.mo.body.attemptId ?? "")],
  );
  kiem(
    "lượt lần một gắn đúng vào bài giao",
    ganLan1[0]?.assignment_id === motLan.id,
    { gan: ganLan1[0]?.assignment_id, trangThai: ganLan1[0]?.status, mong: motLan.id },
    motLan.id,
  );

  const vaoLai = await goi(`${WEB}/vao/${motLan.token}`, { cookie: veEm });
  /*
    Trang `/vao/[token]` là cửa duy nhất học sinh đi qua khi bấm link cô gửi.
    Bật "chỉ làm một lần" thì lần thứ hai phải bị chặn NGAY Ở ĐÂY.
  */
  kiem(
    "vào lại lần hai bị chặn ở trang link",
    /đã làm|một lần|không thể|đã nộp/i.test(vaoLai.text),
    vaoLai.status,
    "trang báo đã làm rồi",
  );

  const { rows: demLuot } = await pool.query<{ n: string }>(
    "SELECT count(*) n FROM attempts WHERE student_id=$1 AND assignment_id=$2",
    [EM, motLan.id],
  );
  kiem("chỉ có một lượt gắn vào bài này", Number(demLuot[0].n) === 1, Number(demLuot[0].n), 1);

  /* ── 4. Khách vào bằng link ──────────────────────────────────────────── */

  console.log("\n4) Khách chưa có tài khoản");

  const choKhach = await giaoBai({ allowGuest: true });
  const vaoTen = await goi(`${WEB}/api/vao-bang-ten`, {
    method: "POST",
    body: JSON.stringify({ token: choKhach.token, ten: "Khách Ảo" }),
  });
  kiem("khách vào được bằng tên", vaoTen.status === 200, vaoTen.body.error ?? vaoTen.status, 200);

  const camKhach = await giaoBai({ allowGuest: false });
  const vaoTenCam = await goi(`${WEB}/api/vao-bang-ten`, {
    method: "POST",
    body: JSON.stringify({ token: camKhach.token, ten: "Khách Ảo" }),
  });
  kiem(
    "cô tắt cho khách thì khách bị từ chối",
    vaoTenCam.status !== 200,
    vaoTenCam.status,
    "khác 200",
  );

  const tenRong = await goi(`${WEB}/api/vao-bang-ten`, {
    method: "POST",
    body: JSON.stringify({ token: choKhach.token, ten: "   " }),
  });
  kiem("tên rỗng bị từ chối", tenRong.status !== 200, tenRong.status, "khác 200");

  const tokenBay = await goi(`${WEB}/api/vao-bang-ten`, {
    method: "POST",
    body: JSON.stringify({ token: "khong-co-that", ten: "Khách Ảo" }),
  });
  kiem("token bịa bị từ chối", tokenBay.status !== 200, tokenBay.status, "khác 200");

  /* ── 5. Listening đi hết vòng ────────────────────────────────────────── */

  console.log("\n5) Bài Listening cô giao");

  const { rows: deNghe } = await pool.query<{ slug: string }>(
    "SELECT slug FROM listening_tests WHERE status='published' ORDER BY slug LIMIT 1",
  );
  const maNghe = deNghe[0].slug;
  const giaoNghe = await goi(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ skill: "listening", target: maNghe }),
  });
  kiem("giao được bài nghe", giaoNghe.status === 200, giaoNghe.body.error, 200);

  const moNghe = await goi(`${WEB}/api/practice/attempt/start`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({
      skill: "listening",
      scope: "test",
      target: maNghe,
      token: String(giaoNghe.body.token ?? ""),
    }),
  });
  kiem("học sinh mở được bài nghe", moNghe.status === 200, moNghe.body.error, 200);

  const { rows: keyNghe } = await pool.query<{
    answer_key: { questionId: string; answer: string }[];
  }>("SELECT answer_key FROM listening_tests WHERE slug=$1", [maNghe]);
  const traLoiNghe = Object.fromEntries(
    (keyNghe[0]?.answer_key ?? []).map((k) => [k.questionId, k.answer]),
  );
  const nopNghe = await goi(`${WEB}/api/practice/listening/${maNghe}/submit`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({
      answers: traLoiNghe,
      elapsedSeconds: 1800,
      attemptId: String(moNghe.body.attemptId ?? ""),
    }),
  });
  kiem("nộp được bài nghe", nopNghe.status === 200, nopNghe.body.error ?? nopNghe.status, 200);
  kiem(
    "bài nghe đúng hết thì đúng hết",
    nopNghe.body.correct !== undefined && nopNghe.body.correct === nopNghe.body.total,
    `${nopNghe.body.correct}/${nopNghe.body.total}`,
    "đúng hết",
  );

  await don();
  await pool.query("DELETE FROM attempts WHERE guest_name = 'Khách Ảo'");

  console.log("");
  if (hong) {
    console.error(`${hong} mục HỎNG:`);
    for (const l of loi) console.error(`  - ${l}`);
    process.exit(1);
  }
  console.log("Mọi chốt của bài giao đều giữ được.");
  process.exit(0);
}

void main();
