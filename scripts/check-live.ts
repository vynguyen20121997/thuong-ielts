import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/admin/.env.local" });

/*
  Nhịp realtime lên bảng lớp của cô — và CHỈ của cô ấy.

  Đi đúng đường thật: học sinh gọi route web → web `NOTIFY` qua Postgres →
  server.js của admin `LISTEN` → Socket.IO tới trình duyệt cô. Hai cô ảo cùng
  nối socket; cô chủ bài phải nghe thấy em vào bài, cô kia không được nghe gì
  — kể cả khi tự xin vào phòng chi tiết bằng đúng mã lớp.

  Lỗ thứ hai đã đo được trước khi có bộ này: cô nào cũng nghe tên học sinh và
  đúng/sai từng câu của lớp người khác, vì trang /lop chỉ lọc lúc vẽ.

  Cần cả hai dev server: web :2000 và admin :2100.
*/

const WEB = process.env.CHECK_BASE_URL ?? "http://localhost:2000";
const ADMIN = process.env.CHECK_ADMIN_URL ?? "http://localhost:2100";
const CO = "sim-live-co-chu";
const CO_KHAC = "sim-live-co-khac";
const EM = "sim-live-em";

let hong = 0;
function kiem(ten: string, dat: boolean, thuc?: unknown) {
  if (dat) return console.log(`  ok   ${ten}`);
  hong += 1;
  console.error(`  HỎNG ${ten}${thuc === undefined ? "" : `: nhận ${JSON.stringify(thuc).slice(0, 200)}`}`);
}
const cho = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const { encode } = await import("@auth/core/jwt");
  const phien = await import("../apps/admin/src/lib/sessionToken.js");
  const { io } = await import("socket.io-client");

  const don = async () => {
    await pool.query("DELETE FROM attempts WHERE student_id = $1", [EM]);
    for (const co of [CO, CO_KHAC]) {
      await pool.query("DELETE FROM assignments WHERE teacher_id = $1", [co]);
      await pool.query("DELETE FROM teachers WHERE id = $1", [co]);
    }
    await pool.query("DELETE FROM students WHERE id = $1", [EM]);
  };
  await don();
  for (const co of [CO, CO_KHAC])
    await pool.query(`INSERT INTO teachers (id, username, password_hash, name) VALUES ($1,$1,'x','Cô ảo')`, [co]);
  await pool.query("INSERT INTO students (id, name, email) VALUES ($1,'Em ảo live','live@vidu.test')", [EM]);
  await pool.query(
    `INSERT INTO student_profiles (student_id, age, occupation, target_band, completed_at)
     VALUES ($1, 17, 'student', 6.5, now()) ON CONFLICT (student_id) DO UPDATE SET completed_at = now()`,
    [EM],
  );

  const ve = (co: string) => `${phien.SESSION_COOKIE}=${phien.createSessionToken(co)}`;
  const veEm = `authjs.session-token=${await encode({
    token: { sub: EM, studentId: EM, name: "Em ảo live" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
    maxAge: 3600,
  })}`;

  const res = await fetch(`${ADMIN}/api/bai-giao`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: ve(CO) },
    body: JSON.stringify({ skill: "reading", target: "cam15-test1", label: "check live" }),
  });
  const bai = (await res.json()) as { id: string; token: string };
  kiem("cô chủ giao được bài", res.ok, bai);
  const lop = `bg-${bai.id}`;

  /** Nối socket như trình duyệt của cô, ghi lại mọi thứ nghe được. */
  const nghe = (co: string) => {
    const nhan: { loai: string; ten?: string }[] = [];
    const s = io(ADMIN, { path: "/socket.io", extraHeaders: { cookie: ve(co) }, transports: ["polling"] });
    s.on("connect", () => {
      s.emit("xem-tat-ca");
      // Xin thẳng vào phòng chi tiết bằng đúng mã lớp — cô khác phải bị từ chối.
      s.emit("xem", lop);
    });
    s.on("tom-tat", (t: { ten?: string }) => nhan.push({ loai: "tom-tat", ten: t.ten }));
    s.on("nhip", (g: { ten?: string }) => nhan.push({ loai: "nhip", ten: g.ten }));
    return { s, nhan };
  };
  const chu = nghe(CO);
  const khac = nghe(CO_KHAC);
  await cho(2500);

  const mo = await fetch(`${WEB}/api/practice/attempt/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: veEm },
    body: JSON.stringify({ skill: "reading", scope: "test", target: "cam15-test1", token: bai.token }),
  });
  kiem("em mở được lượt qua link giao", mo.ok, mo.status);
  await cho(4000);

  console.log("\n1) Cô chủ bài nghe thấy");
  kiem("màn chính nhận tóm tắt em vào bài", chu.nhan.some((n) => n.loai === "tom-tat" && n.ten === "Em ảo live"), chu.nhan);
  kiem("phòng chi tiết nhận nhịp của em", chu.nhan.some((n) => n.loai === "nhip"), chu.nhan);

  console.log("\n2) Cô khác không nghe được gì của lớp này");
  kiem("không nhận tóm tắt, không nhận nhịp", khac.nhan.length === 0, khac.nhan);

  chu.s.close();
  khac.s.close();
  await don();
  console.log("");
  if (hong) {
    console.error(`${hong} mục HỎNG.`);
    process.exit(1);
  }
  console.log("Nhịp tới đúng bảng của cô chủ bài, không lọt sang cô khác.");
  process.exit(0);
}

void main();
