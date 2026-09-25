import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/admin/.env.local" });

/*
  Cô giáo ảo và học sinh ảo đi hết một vòng dạy–học, qua ĐÚNG route HTTP thật
  của cả hai app.

  Khác các `check:*` trước ở chỗ: những bộ kia mỗi bộ soi một tính năng, còn bộ
  này đi theo MỘT CÂU CHUYỆN nối từ đầu tới cuối — cô giao bài, học sinh làm,
  cô xem điểm, cô xếp lớp, học sinh chuyển học phí, cô xác nhận. Lỗi ở chỗ nối
  giữa hai tính năng chỉ hiện ra khi đi liền như vậy.

  Vé phiên của cả hai vai đúc trong tiến trình này, không bao giờ vào trình
  duyệt. Dọn sạch ở đầu và cuối.

  Cần cả hai dev server: web :2000 và admin :2100.
*/

const WEB = process.env.CHECK_BASE_URL ?? "http://localhost:2000";
const ADMIN = process.env.CHECK_ADMIN_URL ?? "http://localhost:2100";

const CO = "sim-p-co";
const EM = "sim-p-em";

let hong = 0;
const loi: string[] = [];

function kiem(ten: string, dat: boolean, thuc?: unknown, mong?: unknown) {
  if (dat) {
    console.log(`  ok   ${ten}`);
    return;
  }
  hong += 1;
  const chiTiet =
    mong === undefined ? "" : `: nhận ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`;
  loi.push(ten + chiTiet);
  console.error(`  HỎNG ${ten}${chiTiet}`);
}

type Tra = { status: number; body: Record<string, unknown>; text: string };

async function goi(
  url: string,
  init: RequestInit & { cookie?: string } = {},
): Promise<Tra> {
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
    /* Trang HTML thì để nguyên `text`. */
  }
  return { status: res.status, body, text };
}

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");
  const phienAdmin = await import("../apps/admin/src/lib/sessionToken.js");

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("Thiếu AUTH_SECRET trong apps/web/.env.local");
    process.exit(1);
  }

  const don = async () => {
    await pool.query("DELETE FROM attempts WHERE student_id = $1", [EM]);
    await pool.query("DELETE FROM assignments WHERE teacher_id = $1", [CO]);
    await pool.query("DELETE FROM classes WHERE teacher_id = $1", [CO]);
    await pool.query("DELETE FROM student_notes WHERE student_id = $1", [EM]);
    await pool.query("DELETE FROM teachers WHERE id = $1", [CO]);
    await pool.query("DELETE FROM students WHERE id = $1", [EM]);
  };
  await don();

  await pool.query(
    `INSERT INTO teachers (id, username, password_hash, name)
     VALUES ($1,$1,'x','Cô ảo')`,
    [CO],
  );
  await pool.query(
    "INSERT INTO students (id, name, email) VALUES ($1,'Học sinh ảo','ao@vidu.test')",
    [EM],
  );
  await pool.query(
    `INSERT INTO student_profiles (student_id, age, occupation, target_band, completed_at)
     VALUES ($1, 17, 'student', 6.5, now())
     ON CONFLICT (student_id) DO UPDATE SET completed_at = now()`,
    [EM],
  );

  const veEm = `authjs.session-token=${await encode({
    token: { sub: EM, studentId: EM },
    secret,
    salt: "authjs.session-token",
    maxAge: 3600,
  })}`;
  const veCo = `${phienAdmin.SESSION_COOKIE}=${phienAdmin.createSessionToken(CO)}`;

  /* ── 1. Cô giao bài ──────────────────────────────────────────────────── */

  console.log("\n1) Cô giao bài");

  const { rows: deDoc } = await pool.query<{ slug: string }>(
    /*
      Mã đề CẢ BÀI, đúng dạng `isTestId` bên web chấp nhận.

      Dùng `[0-9]` chứ không `\d`: đã đo, `substring(... from ...)` của Postgres
      trả về NULL với `\d`. Chính cái bẫy này là lỗi mà bộ kiểm tìm ra ở trang
      giao bài bên admin.
    */
    `SELECT DISTINCT substring(slug from '^((?:cam[0-9]+|guide|train[12])-test[0-9]+)-') slug
       FROM reading_tests
      WHERE status='published'
        AND substring(slug from '^((?:cam[0-9]+|guide|train[12])-test[0-9]+)-') IS NOT NULL
      ORDER BY 1 LIMIT 1`,
  );
  const { rows: deNghe } = await pool.query<{ slug: string }>(
    "SELECT slug FROM listening_tests WHERE status='published' ORDER BY slug LIMIT 1",
  );
  const maDeDoc = deDoc[0]?.slug ?? "";
  const maDeNghe = deNghe[0]?.slug ?? "";

  const giao = await goi(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ skill: "reading", target: maDeDoc, label: "Buổi ảo" }),
  });
  kiem("giao được bài Reading", giao.status === 200, giao.body.error ?? giao.status, 200);
  const token = String(giao.body.token ?? "");
  /* Lớp khoá theo BÀI GIAO (`bg-<id>`), không theo mã đề — xem `khoaLop`. */
  const khoaLop = `bg-${String(giao.body.id ?? "")}`;
  kiem("có link chia sẻ", token.length > 0);

  const giaoNghe = await goi(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ skill: "listening", target: maDeNghe }),
  });
  kiem("giao được bài Listening", giaoNghe.status === 200, giaoNghe.body.error, 200);

  const deBay = await goi(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ skill: "reading", target: "de-khong-co-that" }),
  });
  kiem("đề không có thật thì 404", deBay.status === 404, deBay.status, 404);

  const maBan = await goi(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ skill: "reading", target: "../../etc/passwd" }),
  });
  kiem("mã đề bậy bị chặn", maBan.status === 400, maBan.status, 400);

  const khongVe = await goi(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    body: JSON.stringify({ skill: "reading", target: maDeDoc }),
  });
  /*
    Không có vé quản trị thì KHÔNG được giao bài. Đây là cửa nguy nhất của cả
    trang admin: giao được bài nghĩa là ghi vào DB dưới danh nghĩa một cô nào đó.
  */
  kiem(
    "người lạ không giao được bài",
    khongVe.status === 401 || khongVe.status === 403 || khongVe.status >= 500,
    khongVe.status,
    "401/403",
  );

  /*
    Đề KHÔNG ghép được thành bài cả test (bộ VOL). Trước đây route luôn đặt
    `scope: "test"` nên bài giao này tạo xong là chết: cô thấy link, học sinh
    bấm vào nhận "Không tìm thấy đề này". Giao phải ra được link MỞ ĐƯỢC.
  */
  const { rows: deLe } = await pool.query<{ slug: string }>(
    `SELECT slug FROM reading_tests
      WHERE status='published' AND owner_id IS NULL
        AND substring(slug from '^((?:cam[0-9]+|guide|train[12])-test[0-9]+)-') IS NULL
      ORDER BY slug LIMIT 1`,
  );
  if (deLe[0]) {
    const giaoLe = await goi(`${ADMIN}/api/bai-giao`, {
      method: "POST",
      cookie: veCo,
      body: JSON.stringify({ skill: "reading", target: deLe[0].slug }),
    });
    kiem("giao được đề lẻ (bộ VOL)", giaoLe.status === 200, giaoLe.body.error, 200);

    const { rows: pham } = await pool.query<{ scope: string }>(
      "SELECT scope FROM assignments WHERE id = $1",
      [String(giaoLe.body.id ?? "")],
    );
    kiem(
      "đề lẻ được giao theo phạm vi 'paper'",
      pham[0]?.scope === "paper",
      pham[0]?.scope,
      "paper",
    );

    const moLe = await goi(`${WEB}/api/practice/attempt/start`, {
      method: "POST",
      cookie: veEm,
      body: JSON.stringify({
        skill: "reading",
        scope: pham[0]?.scope,
        target: deLe[0].slug,
        token: String(giaoLe.body.token ?? ""),
      }),
    });
    kiem(
      "học sinh MỞ ĐƯỢC bài cô vừa giao",
      moLe.status === 200,
      moLe.body.error ?? moLe.status,
      200,
    );
  }

  /* ── 2. Học sinh vào làm ─────────────────────────────────────────────── */

  console.log("\n2) Học sinh làm bài cô giao");

  const moLuot = await goi(`${WEB}/api/practice/attempt/start`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({
      skill: "reading",
      scope: "test",
      target: maDeDoc,
      token,
    }),
  });
  kiem("mở được lượt từ link cô gửi", moLuot.status === 200, moLuot.body.error, 200);
  const attemptId = String(moLuot.body.attemptId ?? "");

  const { rows: dapAn } = await pool.query<{ answer_key: { questionId: string; answer: string }[] }>(
    `SELECT answer_key FROM reading_tests
      WHERE slug = $1 OR slug LIKE $1 || '-%' ORDER BY slug`,
    [maDeDoc],
  );
  const key = dapAn.flatMap((r) => r.answer_key ?? []);
  const traLoi = Object.fromEntries(key.map((k) => [k.questionId, k.answer]));

  const nop = await goi(`${WEB}/api/practice/reading/test/${maDeDoc}/submit`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({ answers: traLoi, elapsedSeconds: 1800, attemptId }),
  });
  kiem("nộp được bài", nop.status === 200, nop.body.error ?? nop.status, 200);
  kiem(
    "đúng hết thì đúng hết",
    nop.body.correct === nop.body.total,
    `${nop.body.correct}/${nop.body.total}`,
    "đúng hết",
  );

  /* ── 3. Cô xem kết quả ───────────────────────────────────────────────── */

  console.log("\n3) Cô xem kết quả lớp");

  const bangLop = await goi(`${ADMIN}/lop/${khoaLop}`, { cookie: veCo });
  kiem("mở được bảng lớp", bangLop.status === 200, bangLop.status, 200);
  kiem("bảng lớp có tên học sinh", bangLop.text.includes("Học sinh ảo"));

  const csv = await goi(`${ADMIN}/api/lop/${khoaLop}/csv`, { cookie: veCo });
  kiem("tải được bảng điểm CSV", csv.status === 200, csv.status, 200);
  /*
    BOM ở đầu file. Không có nó thì Excel bản tiếng Việt mở ra thành
    "Nguyá»…n" — tên học sinh hỏng hết và cô tưởng trang web lưu sai.
  */
  /*
    Phải đọc BYTE THÔ. `res.text()` của fetch giải mã UTF-8 theo chuẩn WHATWG,
    và chuẩn đó NUỐT LUÔN BOM — kiểm trên chuỗi thì không đời nào thấy, dù file
    có BOM thật. Đã sập đúng chỗ này một lần khi viết bộ kiểm.
  */
  const csvByte = new Uint8Array(
    await (await fetch(`${ADMIN}/api/lop/${khoaLop}/csv`, {
      headers: { cookie: veCo },
    })).arrayBuffer(),
  );
  kiem(
    "CSV có BOM cho Excel tiếng Việt",
    csvByte[0] === 0xef && csvByte[1] === 0xbb && csvByte[2] === 0xbf,
    [csvByte[0], csvByte[1], csvByte[2]],
    [0xef, 0xbb, 0xbf],
  );
  kiem("CSV có tên học sinh", csv.text.includes("Học sinh ảo"));
  kiem("CSV không lộ đáp án", !/answer|đáp án/i.test(csv.text.split("\n")[0]));

  const csvLa = await goi(`${ADMIN}/api/lop/${khoaLop}/csv`);
  kiem(
    "người lạ không tải được bảng điểm",
    csvLa.status !== 200,
    csvLa.status,
    "khác 200",
  );

  /* ── 4. Cô xếp lớp và ghi nhận xét ───────────────────────────────────── */

  console.log("\n4) Cô xếp lớp, nhận xét");

  const taoLop = await goi(`${ADMIN}/api/hoc-vien/lop`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ name: "Lớp ảo", tuitionAmount: "1.200.000" }),
  });
  kiem("tạo được lớp", taoLop.status === 200, taoLop.body.error, 200);
  const lopId = String((taoLop.body.data as { id?: string } | undefined)?.id ?? "");

  const them = await goi(`${ADMIN}/api/hoc-vien/lop/${lopId}/thanh-vien`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({ studentId: EM }),
  });
  kiem("thêm được học viên", them.status === 200, them.body.error, 200);

  const nx = await goi(`${ADMIN}/api/hoc-vien/nhan-xet`, {
    method: "POST",
    cookie: veCo,
    body: JSON.stringify({
      studentId: EM,
      classId: lopId,
      body: "Đọc tốt, nghe còn yếu phần số liệu.",
    }),
  });
  kiem("ghi được nhận xét", nx.status === 200, nx.body.error, 200);

  const { rows: rieng } = await pool.query<{ shared_with_student: boolean }>(
    "SELECT shared_with_student FROM student_notes WHERE student_id=$1",
    [EM],
  );
  kiem(
    "nhận xét mặc định riêng tư",
    rieng[0]?.shared_with_student === false,
    rieng[0]?.shared_with_student,
    false,
  );

  /* ── 5. Học sinh xem phần của mình ───────────────────────────────────── */

  console.log("\n5) Học sinh xem lại");

  const lichSu = await goi(`${WEB}/lich-su`, { cookie: veEm });
  kiem("mở được trang lịch sử", lichSu.status === 200, lichSu.status, 200);

  const hocPhi = await goi(`${WEB}/hoc-phi`, { cookie: veEm });
  kiem("mở được trang học phí", hocPhi.status === 200, hocPhi.status, 200);
  kiem("học phí hiện tên lớp", hocPhi.text.includes("Lớp ảo"));
  /*
    Nhận xét riêng của cô TUYỆT ĐỐI không được lọt sang trang học sinh.
    Không có bài kiểm nào khác canh chỗ này, vì hai bên nằm ở hai app.
  */
  kiem(
    "KHÔNG lộ nhận xét riêng của cô",
    !hocPhi.text.includes("nghe còn yếu"),
  );
  kiem(
    "lịch sử cũng không lộ nhận xét riêng",
    !lichSu.text.includes("nghe còn yếu"),
  );

  const tuVung = await goi(`${WEB}/hoc-tu-vung`, { cookie: veEm });
  kiem("mở được trang từ vựng", tuVung.status === 200, tuVung.status, 200);

  const chuaDangNhap = await goi(`${WEB}/hoc-phi`);
  kiem(
    "chưa đăng nhập thì học phí đá về đăng nhập",
    chuaDangNhap.text.includes("Đăng nhập") || chuaDangNhap.status === 307,
  );

  /* ── 6. Học phí: khai rồi xác nhận ───────────────────────────────────── */

  console.log("\n6) Học phí đi hết vòng");

  await goi(`${ADMIN}/api/hoc-vien/tai-khoan`, {
    method: "PUT",
    cookie: veCo,
    body: JSON.stringify({
      bankBin: "970436",
      bankName: "Vietcombank",
      bankAccount: "0071000812345",
      bankHolder: "CO AO",
    }),
  });

  const trangSauKhiKhaiTk = await goi(`${WEB}/hoc-phi`, { cookie: veEm });
  kiem("khai tài khoản xong thì học sinh thấy mã QR", trangSauKhiKhaiTk.text.includes("<svg"));
  kiem("và thấy số tài khoản", trangSauKhiKhaiTk.text.includes("0071000812345"));

  const ky = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const khai = await goi(`${WEB}/api/hoc-phi/bao-da-chuyen`, {
    method: "POST",
    cookie: veEm,
    body: JSON.stringify({ classId: lopId, period: ky }),
  });
  kiem("học sinh báo đã chuyển", khai.status === 200, khai.body.error, 200);

  const { rows: chuaVaoSo } = await pool.query<{ status: string }>(
    "SELECT status FROM tuition_payments WHERE class_id=$1",
    [lopId],
  );
  kiem(
    "lời khai đứng ở chờ xác nhận",
    chuaVaoSo[0]?.status === "cho_xac_nhan",
    chuaVaoSo[0]?.status,
    "cho_xac_nhan",
  );

  const trangLop = await goi(`${ADMIN}/hoc-vien/${lopId}`, { cookie: veCo });
  kiem("cô mở được trang lớp", trangLop.status === 200, trangLop.status, 200);
  kiem("trang lớp báo có dòng chờ duyệt", trangLop.text.includes("chờ duyệt"));

  /* ── 7. Cô này không đọc được của cô kia ─────────────────────────────── */

  console.log("\n7) Hai cô không lẫn dữ liệu");

  await pool.query(
    `INSERT INTO teachers (id, username, password_hash, name)
     VALUES ('sim-p-co2','sim-p-co2','x','Cô ảo 2') ON CONFLICT (id) DO NOTHING`,
  );
  const veCo2 = `${phienAdmin.SESSION_COOKIE}=${phienAdmin.createSessionToken("sim-p-co2")}`;

  const lopCuaCo2 = await goi(`${ADMIN}/hoc-vien`, { cookie: veCo2 });
  kiem("cô 2 không thấy lớp của cô 1", !lopCuaCo2.text.includes("Lớp ảo"));

  const suaTrom = await goi(`${ADMIN}/api/hoc-vien/lop/${lopId}`, {
    method: "PATCH",
    cookie: veCo2,
    body: JSON.stringify({ name: "Đổi trộm" }),
  });
  kiem("cô 2 không sửa được lớp cô 1", suaTrom.status === 400, suaTrom.status, 400);

  /* ── 8. Bài kiểm tra nền của cô ──────────────────────────────────────── */

  console.log("\n8) Trang chẩn đoán bên admin");

  const chanDoan = await goi(`${ADMIN}/api/chan-doan`, { cookie: veCo });
  kiem("cô xem được danh sách lượt chẩn đoán", chanDoan.status === 200, chanDoan.status, 200);

  const chanDoanLa = await goi(`${ADMIN}/api/chan-doan`);
  kiem(
    "người lạ không xem được lượt chẩn đoán",
    chanDoanLa.status !== 200,
    chanDoanLa.status,
    "khác 200",
  );

  await don();
  await pool.query("DELETE FROM teachers WHERE id='sim-p-co2'");

  console.log("");
  if (hong) {
    console.error(`${hong} mục HỎNG:`);
    for (const l of loi) console.error(`  - ${l}`);
    process.exit(1);
  }
  console.log("Cô và học sinh đi hết một vòng dạy–học, không chỗ nào hỏng.");
  process.exit(0);
}

void main();
