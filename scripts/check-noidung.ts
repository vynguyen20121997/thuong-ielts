import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/admin/.env.local" });

/*
  Soạn nội dung: cô gõ ở admin, học sinh phải THẤY ở web.

  Đây là điều duy nhất đáng kiểm ở đây. Mấy trang soạn thảo mà lưu đúng vào DB
  nhưng nội dung không chạy tới màn hình học sinh thì cũng vô dụng y như lúc
  chưa có — mà lại khó phát hiện hơn, vì cô thấy mọi thứ mình gõ vẫn còn đó.

  Cần cả hai dev server: web :2000, admin :2100.
*/

const WEB = process.env.CHECK_BASE_URL ?? "http://localhost:2000";
const ADMIN = process.env.CHECK_ADMIN_URL ?? "http://localhost:2100";

const CO = "sim-nd-co";
const EM = "sim-nd-em";

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

const id = (r: { body: Record<string, unknown> }) =>
  String((r.body.data as { id?: string } | undefined)?.id ?? "");

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");
  const phienAdmin = await import("../apps/admin/src/lib/sessionToken.js");

  const don = async () => {
    await pool.query("DELETE FROM vocab_decks WHERE creator_id = ANY($1)", [[CO, EM]]);
    await pool.query("DELETE FROM writing_prompts WHERE topic = 'ChuDeMoPhong'");
    await pool.query("DELETE FROM teachers WHERE id = $1", [CO]);
    await pool.query("DELETE FROM students WHERE id = $1", [EM]);
  };
  await don();
  await pool.query(
    `INSERT INTO teachers (id, username, password_hash, name) VALUES ($1,$1,'x','Cô ảo')`,
    [CO],
  );
  await pool.query("INSERT INTO students (id,name) VALUES ($1,'Học sinh ảo')", [EM]);
  await pool.query(
    `INSERT INTO student_profiles (student_id, age, occupation, target_band, completed_at)
     VALUES ($1, 17, 'student', 6.5, now())
     ON CONFLICT (student_id) DO UPDATE SET completed_at = now()`,
    [EM],
  );

  const veEm = `authjs.session-token=${await encode({
    token: { sub: EM, studentId: EM },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
    maxAge: 3600,
  })}`;
  const veCo = `${phienAdmin.SESSION_COOKIE}=${phienAdmin.createSessionToken(CO)}`;

  /* ── 1. Cửa đăng nhập ────────────────────────────────────────────────── */

  console.log("\n1) Người lạ không soạn được nội dung");

  for (const [ten, duongDan, body] of [
    ["bộ thẻ", "/api/noi-dung/bo-the", { name: "Bộ trộm" }],
    ["đề Writing", "/api/noi-dung/de-writing", { topic: "x", title: "x", prompt: "x" }],
  ] as [string, string, Record<string, unknown>][]) {
    const r = await goi(`${ADMIN}${duongDan}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    kiem(`không có vé thì không tạo được ${ten}`, r.status !== 200, r.status, "khác 200");
  }

  /* ── 2. Từ vựng: cô soạn -> học sinh thấy ────────────────────────────── */

  console.log("\n2) Từ vựng");

  const bo = await goi(`${ADMIN}/api/noi-dung/bo-the`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ name: "Bộ mô phỏng", topic: "ChuDeMoPhong" }),
  });
  kiem("tạo được bộ thẻ", bo.status === 200, bo.body.error, 200);
  const boId = id(bo);

  const the1 = await goi(`${ADMIN}/api/noi-dung/the`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({
      deckId: boId,
      word: "zyxwtest",
      ipa: "/ˈskruːtəni/",
      vietnamese: "từ mô phỏng",
      examples: "A zyxwtest sentence for the simulated deck.",
    }),
  });
  kiem("thêm được thẻ", the1.status === 200, the1.body.error, 200);

  /*
    BỘ CHƯA GIAO THÌ HỌC VIÊN KHÔNG THẤY GÌ.

    `ensureReviews` bên web chỉ lấy thẻ từ bộ đã giao (`vocab_assignments`)
    hoặc bộ chính em ấy tự tạo. Kiểm trước khi giao để chắc chắn luật này còn,
    rồi mới giao — nếu không, một ngày nào đó bộ chưa giao lọt sang học sinh mà
    không ai biết.
  */
  const truocKhiGiao = await goi(`${WEB}/api/vocab/due`, { cookie: veEm });
  kiem(
    "bộ CHƯA giao thì học viên không thấy thẻ nào của nó",
    !truocKhiGiao.text.includes("zyxwtest"),
  );

  const giao = await goi(`${ADMIN}/api/noi-dung/bo-the`, {
    method: "PATCH",
    cookie: veCo,
    body: JSON.stringify({ deckId: boId, giaoCaLop: true }),
  });
  kiem("giao được bộ cho cả lớp", giao.status === 200, giao.body.error, 200);

  /* Thẻ CHƯA có nghĩa: lưu được, nhưng đứng ngoài lịch ôn. */
  const the2 = await goi(`${ADMIN}/api/noi-dung/the`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ deckId: boId, word: "ubiquitous" }),
  });
  kiem("thẻ chưa có nghĩa vẫn lưu được", the2.status === 200, the2.body.error, 200);

  await goi(`${ADMIN}/api/noi-dung/the`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({}),
  }).then((r) => kiem("thiếu mã bộ thẻ thì từ chối", r.status === 400, r.status, 400));

  await goi(`${ADMIN}/api/noi-dung/the`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ deckId: boId, word: "   " }),
  }).then((r) => kiem("từ rỗng thì từ chối", r.status === 400, r.status, 400));

  /*
    ĐÂY là mục quan trọng nhất: thẻ cô vừa gõ phải chạy tới lịch ôn của học
    sinh. Gọi đúng route học sinh dùng.
  */
  const denHan = await goi(`${WEB}/api/vocab/due`, { cookie: veEm });
  kiem("học sinh gọi được lịch ôn", denHan.status === 200, denHan.status, 200);
  kiem(
    "giao xong thì thẻ cô soạn vào lịch ôn của học sinh",
    denHan.text.includes("zyxwtest"),
    denHan.text.slice(0, 160),
    "có chữ zyxwtest",
  );
  /* Thẻ chưa có nghĩa KHÔNG được vào lịch — luật cũ của phần từ vựng. */
  kiem(
    "thẻ chưa có nghĩa KHÔNG vào lịch ôn",
    !denHan.text.includes("ubiquitous"),
  );

  /* Điền nghĩa xong thì nó phải vào. */
  const { rows: theRong } = await pool.query<{ id: string }>(
    "SELECT id FROM vocab_cards WHERE deck_id=$1 AND word='ubiquitous'",
    [boId],
  );
  await goi(`${ADMIN}/api/noi-dung/the`, {
    method: "PATCH",
    cookie: veCo,
    body: JSON.stringify({ cardId: theRong[0].id, vietnamese: "có mặt khắp nơi" }),
  });
  const denHan2 = await goi(`${WEB}/api/vocab/due`, { cookie: veEm });
  kiem(
    "điền nghĩa xong thì thẻ vào lịch ngay",
    denHan2.text.includes("ubiquitous"),
    undefined,
  );

  /* Bộ của học sinh thì cô không sửa. */
  const { randomUUID } = await import("crypto");
  const boRieng = randomUUID();
  await pool.query(
    `INSERT INTO vocab_decks (id,name,description,topic,type,creator_id)
     VALUES ($1,'Bộ riêng của em','','','personal',$2)`,
    [boRieng, EM],
  );
  const suaTrom = await goi(`${ADMIN}/api/noi-dung/bo-the`, {
    method: "PATCH",
    cookie: veCo,
    body: JSON.stringify({ deckId: boRieng, name: "Cô đổi trộm" }),
  });
  kiem("cô không sửa được bộ học viên tự tạo", suaTrom.status === 400, suaTrom.status, 400);

  const themTrom = await goi(`${ADMIN}/api/noi-dung/the`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ deckId: boRieng, word: "trom" }),
  });
  kiem("cũng không thêm thẻ vào đó được", themTrom.status === 400, themTrom.status, 400);

  /* ── 3. Đề Writing: cô soạn -> học sinh thấy ─────────────────────────── */

  console.log("\n3) Đề Writing");

  const de = await goi(`${ADMIN}/api/noi-dung/de-writing`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({
      task: 2,
      topic: "ChuDeMoPhong",
      title: "Đề mô phỏng",
      prompt:
        "Some people think that students should learn a foreign language at primary school. To what extent do you agree or disagree?",
    }),
  });
  kiem("tạo được đề", de.status === 200, de.body.error, 200);
  const deId = id(de);

  const y = await goi(`${ADMIN}/api/noi-dung/y-tuong`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({
      promptId: deId,
      side: "pos",
      label: "Trẻ nhỏ bắt chước phát âm nhanh hơn",
      starter: "Young learners pick up pronunciation far more naturally.",
      questions: "Em học ngoại ngữ từ mấy tuổi?",
    }),
  });
  kiem("thêm được luận điểm", y.status === 200, y.body.error, 200);

  const kt = await goi(`${ADMIN}/api/noi-dung/kien-thuc`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({
      promptId: deId,
      topic: "Độ tuổi vàng học ngoại ngữ",
      body: "Nhiều nghiên cứu cho rằng khả năng bắt chước âm giảm dần sau tuổi dậy thì.",
    }),
  });
  kiem("thêm được kiến thức nền", kt.status === 200, kt.body.error, 200);

  const yBay = await goi(`${ADMIN}/api/noi-dung/y-tuong`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ promptId: "de-khong-co-that", side: "pos", label: "x" }),
  });
  kiem("thêm ý vào đề không có thật thì từ chối", yBay.status === 400, yBay.status, 400);

  /*
    Nội dung phải chạy tới đúng màn học sinh luyện Writing.

    Ngân hàng ý và từ gợi ý KHÔNG nằm trong HTML của trang: `WritingDesk` tải
    chúng bằng `fetch("/api/practice/writing/coach")` sau khi trang đã hiện.
    Kiểm bằng cách dò chữ trong HTML là kiểm nhầm chỗ — đã sai một lần ở đây.
  */
  const trangDe = await goi(`${WEB}/kiem-tra-kien-thuc/writing/${deId}`, { cookie: veEm });
  kiem("học sinh mở được đề vừa soạn", trangDe.status === 200, trangDe.status, 200);
  kiem("đề bài hiện ra", trangDe.text.includes("foreign language at primary school"));

  const coach = await goi(`${WEB}/api/practice/writing/coach`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({ promptId: deId, essay: "" }),
  });
  kiem("gọi được bộ gợi ý", coach.status === 200, coach.body.error ?? coach.status, 200);
  kiem(
    "luận điểm cô soạn tới được mục Idea Development",
    coach.text.includes("bắt chước phát âm nhanh hơn"),
  );
  kiem(
    "kiến thức nền cô soạn cũng tới nơi",
    coach.text.includes("Độ tuổi vàng"),
  );
  /*
    Từ vựng gợi ý lấy từ bộ thẻ CÙNG CHỦ ĐỀ. Đề và bộ thẻ ở đây đều mang chủ đề
    'ChuDeMoPhong', nên từ phải hiện sang — đó là chỗ hai tính năng nối nhau.
  */
  kiem(
    "từ trong bộ thẻ cùng chủ đề được gợi ý ở màn Writing",
    coach.text.includes("zyxwtest"),
  );

  /* Tắt xuất bản thì học sinh không thấy nữa. */
  await goi(`${ADMIN}/api/noi-dung/de-writing`, {
    method: "PATCH",
    cookie: veCo,
    body: JSON.stringify({ promptId: deId, published: false }),
  });
  const sauKhiTat = await goi(`${WEB}/kiem-tra-kien-thuc/writing`, { cookie: veEm });
  kiem(
    "tắt xuất bản thì đề biến khỏi danh sách của học sinh",
    !sauKhiTat.text.includes("Đề mô phỏng"),
  );

  await don();
  await pool.query("DELETE FROM vocab_decks WHERE id = $1", [boRieng]);

  console.log("");
  if (hong) {
    console.error(`${hong} mục HỎNG:`);
    for (const l of loi) console.error(`  - ${l}`);
    process.exit(1);
  }
  console.log("Cô soạn ở admin, học sinh thấy ngay ở web.");
  process.exit(0);
}

void main();
