import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });

/*
  Phòng luyện tập Reading — kiểm qua ĐÚNG route HTTP thật.

  Vì sao phải là script chứ không phải trình duyệt: mọi thứ ở đây đòi đăng
  nhập, mà đúc một vé phiên rồi dán vào trình duyệt thật là chuyện không nên
  làm. Ở đây vé chỉ tồn tại trong tiến trình này, ký bằng đúng khoá của trang,
  và học viên mô phỏng bị dọn sạch ở cả đầu lẫn cuối.

  Ba nhóm câu hỏi mà bấm tay KHÔNG trả lời được:

  1. Đáp án có rò ra trình duyệt không. Mắt nhìn màn hình thì không thấy, phải
     đọc nguyên phản hồi mạng mới biết. Đây là chốt đắt nhất của cả dự án:
     `answer_key` là cột riêng và mọi truy vấn phục vụ client đều không nhắc
     tới nó — nhưng "đừng quên" không phải một cơ chế, một bài kiểm tra mới là.

  2. Client có bỏ phiếu được vào điểm của chính mình không. Người dùng thật
     không gửi được body tự chế; script thì gửi được.

  3. Nộp trùng (F5, hai tab, mạng chập chờn gửi lại). Bấm tay gần như không
     tái hiện nổi, mà hậu quả là điểm nhân đôi hoặc lượt thứ hai đè lên lượt
     đã chốt.
*/

const GOC = process.env.CHECK_BASE_URL ?? "http://localhost:2000";

let hong = 0;
function kiem(ten: string, dat: boolean, thuc?: unknown, mong?: unknown) {
  if (dat) {
    console.log(`  ok   ${ten}`);
    return;
  }
  hong += 1;
  const chiTiet =
    mong === undefined
      ? ""
      : `: nhận ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`;
  console.error(`  HỎNG ${ten}${chiTiet}`);
}

type KeyEntry = { questionId: string; answer: string };

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("Thiếu AUTH_SECRET trong apps/web/.env.local");
    process.exit(1);
  }

  /* Học viên mô phỏng riêng, không mượn tài khoản thật của ai. */
  const HOC_VIEN = "sim-practice-qa";
  await pool.query(
    `INSERT INTO students (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [HOC_VIEN, "QA Phòng luyện tập"],
  );
  const don = () =>
    pool.query("DELETE FROM attempts WHERE student_id = $1", [HOC_VIEN]);
  await don();

  const token = await encode({
    token: { sub: HOC_VIEN, studentId: HOC_VIEN },
    secret,
    salt: "authjs.session-token",
    maxAge: 3600,
  });
  const cookie = `authjs.session-token=${token}`;
  const json = { "Content-Type": "application/json" };

  /*
    Chọn đề có NHIỀU CÂU TỰ GÕ nhất, không lấy đề đầu bảng.

    Lý do: phép kiểm rò rỉ đáp án chỉ có nghĩa với câu học sinh phải tự gõ.
    Lần đầu chạy, script vớ phải một đề toàn câu trắc nghiệm và in ra "dò 0
    câu" — xanh mà chẳng kiểm gì. Một bài test không bao giờ đỏ được thì không
    canh được gì cả.
  */
  const { rows: de } = await pool.query<{
    slug: string;
    answer_key: KeyEntry[];
  }>(
    `SELECT slug, answer_key,
            (SELECT count(*) FROM jsonb_array_elements(questions) q
              WHERE coalesce(jsonb_array_length(q->'options'), 0) = 0) AS tu_go
       FROM reading_tests
      WHERE jsonb_array_length(answer_key) > 3
      ORDER BY tu_go DESC, slug
      LIMIT 1`,
  );
  if (!de.length) {
    console.error("Chưa có đề đọc nào trong DB — chạy import trước.");
    process.exit(1);
  }
  const slug = de[0].slug;
  const key = de[0].answer_key;

  /* ── 1. Đáp án không được rời khỏi server ───────────────────────────── */

  console.log("\n1) Đáp án có rò ra trình duyệt không");

  const deRes = await fetch(`${GOC}/api/practice/reading/${slug}`, {
    headers: { cookie },
  });
  const deText = await deRes.text();

  kiem("lấy được đề", deRes.status === 200, deRes.status, 200);
  kiem(
    "phản hồi không có trường answerKey / answer_key",
    !/answer_?[Kk]ey/.test(deText),
    deText.match(/answer_?[Kk]ey/)?.[0] ?? null,
    "không có",
  );

  const dePayload = JSON.parse(deText) as {
    questions: {
      id: string;
      type?: string;
      group?: string;
      options?: string[];
      prompt?: string;
    }[];
  };

  /*
    Tìm tên trường thôi thì chưa đủ — đáp án có thể lọt ra dưới một tên khác.
    Nên dò cả hai hướng.

    Hướng 1: không câu nào được mang một trường có mùi đáp án.
  */
  const truongXau = /answer|expect|correct|solution|key$/i;
  const cauCoTruongXau = dePayload.questions.filter((q) =>
    Object.keys(q).some((k) => truongXau.test(k)),
  );
  kiem(
    "không câu nào mang trường đáp án",
    cauCoTruongXau.length === 0,
    cauCoTruongXau.slice(0, 2).map((q) => Object.keys(q)),
    [],
  );

  /*
    Hướng 2: đáp án không được GẮN VÀO CHÍNH CÂU HỎI của nó.

    Chú ý chỗ này, vì viết sai hai lần rồi:

    - Dò đáp án trong cả phản hồi là vô nghĩa. Đáp án câu điền từ vốn nằm
      trong BÀI ĐỌC — đó chính là đề bài, kỹ năng cần đo là tìm ra nó. Bài
      đọc bắt buộc phải gửi xuống trình duyệt.
    - Với câu trắc nghiệm và matching-headings, mọi lựa chọn kể cả lựa chọn
      đúng đều phải hiện ra mới trả lời được.

    Thứ thật sự đáng lo là đáp án đi KÈM ĐÚNG CÂU: chỉ cần nó nằm trong object
    của câu ấy là mở tab Network ra ghép một phát là xong cả bài. Nên so từng
    câu với từng đáp án của chính nó.
  */
  const theoId = new Map(dePayload.questions.map((q) => [q.id, q]));
  const doiChieu = key.filter((k) => String(k.answer ?? "").trim().length > 2);
  const loLot = doiChieu.filter((k) => {
    const cau = theoId.get(k.questionId);
    if (!cau) return false;
    /* Lựa chọn là thứ phải hiện; bỏ chúng ra rồi mới soi phần còn lại. */
    const { options: _options, ...phanConLai } = cau;
    return JSON.stringify(phanConLai)
      .toLowerCase()
      .includes(String(k.answer).trim().toLowerCase());
  });
  kiem(
    `đáp án không gắn vào chính câu hỏi của nó (đối chiếu ${doiChieu.length} câu)`,
    loLot.length === 0,
    loLot.slice(0, 3).map((k) => `${k.questionId}=${k.answer}`),
    [],
  );

  /* ── 2. Phải đăng nhập mới mở được lượt ─────────────────────────────── */

  console.log("\n2) Cửa đăng nhập");

  const khongVe = await fetch(`${GOC}/api/practice/attempt/start`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ skill: "reading", scope: "paper", target: slug }),
  });
  kiem(
    "không có vé phiên thì không mở được lượt",
    khongVe.status === 401,
    khongVe.status,
    401,
  );

  /* ── 3. Chấm ở server, client không bỏ phiếu ────────────────────────── */

  console.log("\n3) Ai quyết định điểm");

  const moLuot = async () => {
    const res = await fetch(`${GOC}/api/practice/attempt/start`, {
      method: "POST",
      headers: { ...json, cookie },
      body: JSON.stringify({ skill: "reading", scope: "paper", target: slug }),
    });
    const data = (await res.json()) as { attemptId?: string; total?: number };
    return data;
  };

  const nop = async (
    attemptId: string | null,
    answers: Record<string, string>,
    them: Record<string, unknown> = {},
  ) => {
    const res = await fetch(`${GOC}/api/practice/reading/${slug}/submit`, {
      method: "POST",
      headers: { ...json, cookie },
      body: JSON.stringify({
        answers,
        elapsedSeconds: 600,
        ...(attemptId ? { attemptId } : {}),
        ...them,
      }),
    });
    return {
      status: res.status,
      body: (await res.json()) as { correct?: number; total?: number },
    };
  };

  const dungHet = Object.fromEntries(key.map((k) => [k.questionId, k.answer]));
  const saiHet = Object.fromEntries(
    key.map((k) => [k.questionId, "chắc chắn không phải đáp án"]),
  );

  const luot1 = await moLuot();
  kiem("mở được lượt khi đã đăng nhập", Boolean(luot1.attemptId));
  const ketQuaDung = await nop(luot1.attemptId ?? null, dungHet);
  kiem(
    "trả lời đúng hết thì đúng hết",
    ketQuaDung.body.correct === ketQuaDung.body.total,
    `${ketQuaDung.body.correct}/${ketQuaDung.body.total}`,
    "đúng hết",
  );

  const luot2 = await moLuot();
  const ketQuaSai = await nop(luot2.attemptId ?? null, saiHet);
  kiem("trả lời sai hết thì được 0", ketQuaSai.body.correct === 0, ketQuaSai.body.correct, 0);

  /*
    Body tự chế: gửi kèm `correct`, `total`, `band` và cả một mảng `result`
    hoàn hảo. Server phải bỏ qua sạch và chấm lại từ đáp án của chính nó —
    nếu không thì ai cũng tự cho mình band 9.
  */
  const luot3 = await moLuot();
  const bịaĐiểm = await nop(luot3.attemptId ?? null, saiHet, {
    correct: 999,
    total: 999,
    band: 9,
    result: { correct: 999, total: 999, band: 9, items: [] },
  });
  kiem(
    "gửi kèm điểm tự chế thì server vẫn chấm lại từ đáp án của mình",
    bịaĐiểm.body.correct === 0,
    bịaĐiểm.body.correct,
    0,
  );

  const { rows: daGhi } = await pool.query<{ correct: number; band: string }>(
    "SELECT correct, band FROM attempts WHERE id = $1",
    [luot3.attemptId],
  );
  kiem(
    "DB cũng không nhận con số tự chế",
    daGhi[0]?.correct === 0,
    daGhi[0]?.correct,
    0,
  );

  /* ── 4. Nộp trùng: F5, hai tab, mạng gửi lại ────────────────────────── */

  console.log("\n4) Nộp cùng một lượt hai lần");

  const luot4 = await moLuot();
  await nop(luot4.attemptId ?? null, dungHet);
  const lanHai = await nop(luot4.attemptId ?? null, saiHet);

  kiem(
    "lần nộp thứ hai không trả lỗi cho học sinh",
    lanHai.status === 200,
    lanHai.status,
    200,
  );

  const { rows: sauHaiLan } = await pool.query<{
    correct: number;
    status: string;
  }>("SELECT correct, status FROM attempts WHERE id = $1", [luot4.attemptId]);
  /*
    Lượt đã chốt thì đóng hẳn: lần gửi sau KHÔNG được đè lên. Nếu đè thì một
    cú F5 ở màn kết quả là điểm đúng biến thành điểm của lần gửi lại.
  */
  kiem(
    "lượt đã chốt không bị lần gửi sau đè lên",
    sauHaiLan[0]?.correct === ketQuaDung.body.total,
    sauHaiLan[0]?.correct,
    ketQuaDung.body.total,
  );

  const { rows: demLuot } = await pool.query<{ n: string }>(
    "SELECT COUNT(*) n FROM attempts WHERE student_id = $1 AND target = $2",
    [HOC_VIEN, slug],
  );
  kiem(
    "không đẻ thêm lượt thứ năm",
    Number(demLuot[0].n) === 4,
    Number(demLuot[0].n),
    4,
  );

  /* ── 5. Persona "vội vàng" và "hết giờ" ─────────────────────────────── */

  console.log("\n5) Nộp nửa chừng, và tự nộp khi hết giờ");

  const nua = Object.fromEntries(
    key.slice(0, Math.floor(key.length / 2)).map((k) => [k.questionId, k.answer]),
  );
  const luot5 = await moLuot();
  const ketQuaNua = await nop(luot5.attemptId ?? null, nua);
  const mongDoi = Math.floor(key.length / 2);
  kiem(
    `làm nửa bài thì đúng khoảng nửa (${mongDoi})`,
    ketQuaNua.body.correct === mongDoi,
    ketQuaNua.body.correct,
    mongDoi,
  );

  const luot6 = await moLuot();
  await nop(luot6.attemptId ?? null, nua, { autoSubmitted: true });
  const { rows: tuNop } = await pool.query<{ auto_submitted: boolean }>(
    "SELECT auto_submitted FROM attempts WHERE id = $1",
    [luot6.attemptId],
  );
  /*
    "Tự nộp khi hết giờ" phải phân biệt được với "tự bấm nộp": trên bảng của
    cô, một em hết giờ và một em nộp sớm là hai câu chuyện khác nhau.
  */
  kiem(
    "lượt hết giờ được đánh dấu là tự nộp",
    tuNop[0]?.auto_submitted === true,
    tuNop[0]?.auto_submitted,
    true,
  );

  /* ── 6. Số giờ do client gửi ────────────────────────────────────────── */

  console.log("\n6) Số giây làm bài do client gửi lên");

  const luot7 = await moLuot();
  const res7 = await fetch(`${GOC}/api/practice/reading/${slug}/submit`, {
    method: "POST",
    headers: { ...json, cookie },
    body: JSON.stringify({
      answers: nua,
      elapsedSeconds: -99999,
      attemptId: luot7.attemptId,
    }),
  });
  kiem("số giây âm không làm hỏng lần nộp", res7.status === 200, res7.status, 200);
  const { rows: giay } = await pool.query<{ elapsed_seconds: number }>(
    "SELECT elapsed_seconds FROM attempts WHERE id = $1",
    [luot7.attemptId],
  );
  kiem(
    "số giây lưu xuống không bao giờ âm",
    Number(giay[0]?.elapsed_seconds) >= 0,
    giay[0]?.elapsed_seconds,
    ">= 0",
  );

  /* ── 7. Writing: đề do server tra, không nhận từ client ─────────────── */

  console.log("\n7) Writing — đề lấy từ đâu");

  const wr = (body: Record<string, unknown>) =>
    fetch(`${GOC}/api/practice/writing/check`, {
      method: "POST",
      headers: { ...json, cookie },
      body: JSON.stringify(body),
    });

  kiem(
    "thiếu mã đề thì từ chối",
    (await wr({ essay: "hello" })).status === 400,
    undefined,
  );
  kiem(
    "mã đề không có thật thì 404",
    (await wr({ promptId: "de-khong-ton-tai-xyz", essay: "hello" })).status === 404,
    undefined,
  );
  /*
    Gửi kèm "đề" tự chế: server phải bỏ qua và vẫn 404 vì mã đề không có thật.
    Nếu nó nhận đề từ body thì ai cũng gửi một cái đề khớp hoàn hảo với bài
    của mình rồi luôn được báo "đúng đề".
  */
  kiem(
    "đề tự chế gửi kèm body không được dùng",
    (
      await wr({
        promptId: "de-khong-ton-tai-xyz",
        essay: "hello",
        prompt: "Đề tôi tự viết cho khớp bài của tôi",
      })
    ).status === 404,
    undefined,
  );
  kiem(
    "bài dán quá dài bị chặn trước khi gọi dịch vụ ngoài",
    (await wr({ promptId: "bat-ky", essay: "x".repeat(12001) })).status === 413,
    undefined,
  );

  await don();
  await pool.query("DELETE FROM students WHERE id = $1", [HOC_VIEN]);

  if (hong) {
    console.error(`\n${hong} mục HỎNG.`);
    process.exit(1);
  }
  console.log("\nPhòng luyện tập: đáp án kín, điểm do server quyết, nộp trùng không hỏng.");
  process.exit(0);
}

void main();
