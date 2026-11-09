import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/admin/.env.local" });

/*
  Dựng một lớp ảo để LÁI BẰNG TRÌNH DUYỆT THẬT: một cô, ba học sinh, một bài
  Reading cô giao. In ra vé đăng nhập của từng người để dán vào trình duyệt.

  Khác `check:personas`: bộ đó đi bằng HTTP, kiểm thứ máy đọc được. Script này
  chỉ dựng sân khấu — phần kiểm là mắt nhìn trên màn hình cô (bảng lớp trực
  tiếp) và màn hình em (đồng hồ hết giờ thì tự nộp), thứ HTTP không thấy.

  Chạy:  npx tsx scripts/sim-lop.ts        (dựng)
         npx tsx scripts/sim-lop.ts --don  (dọn sạch)
*/

const CO = "sim-v-co-lan";
const EM = [
  { id: "sim-v-em-an", ten: "An (làm chậm, sẽ hết giờ)" },
  { id: "sim-v-em-binh", ten: "Bình (làm nhanh)" },
  { id: "sim-v-em-chi", ten: "Chi (bỏ dở)" },
];

async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const don = async () => {
    for (const e of EM) {
      await pool.query("DELETE FROM attempts WHERE student_id = $1", [e.id]);
      await pool.query("DELETE FROM students WHERE id = $1", [e.id]);
    }
    await pool.query("DELETE FROM attempts WHERE assignment_id IN (SELECT id FROM assignments WHERE teacher_id = $1)", [CO]);
    await pool.query("DELETE FROM assignments WHERE teacher_id = $1", [CO]);
    await pool.query("DELETE FROM teachers WHERE id = $1", [CO]);
  };
  await don();
  if (process.argv.includes("--don")) {
    console.log("Đã dọn lớp ảo.");
    process.exit(0);
  }

  const { encode } = await import("@auth/core/jwt");
  const phienAdmin = await import("../apps/admin/src/lib/sessionToken.js");
  const secret = process.env.AUTH_SECRET!;

  await pool.query(`INSERT INTO teachers (id, username, password_hash, name) VALUES ($1,$1,'x','Cô Lan (ảo)')`, [CO]);
  for (const e of EM) {
    await pool.query("INSERT INTO students (id, name, email) VALUES ($1,$2,$3)", [e.id, e.ten, `${e.id}@vidu.test`]);
    await pool.query(
      `INSERT INTO student_profiles (student_id, age, occupation, target_band, completed_at)
       VALUES ($1, 17, 'student', 6.5, now())
       ON CONFLICT (student_id) DO UPDATE SET completed_at = now()`,
      [e.id],
    );
  }

  const ve: Record<string, string> = {
    co: `${phienAdmin.SESSION_COOKIE}=${phienAdmin.createSessionToken(CO)}`,
  };
  // Giao qua ĐÚNG route của trang admin (gọi thẳng lib thì tsx không nạp được).
  const res = await fetch(`${process.env.CHECK_ADMIN_URL ?? "http://localhost:2100"}/api/bai-giao`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: ve.co },
    body: JSON.stringify({ skill: "reading", target: "cam15-test1", label: "Lớp ảo — kiểm tra trực tiếp" }),
  });
  const bai = await res.json();
  if (!res.ok) throw new Error(`Giao bài hỏng ${res.status}: ${JSON.stringify(bai)}`);
  for (const e of EM)
    ve[e.id] = `authjs.session-token=${await encode({
      token: { sub: e.id, studentId: e.id, name: e.ten },
      secret,
      salt: "authjs.session-token",
      maxAge: 4 * 3600,
    })}`;

  console.log(JSON.stringify({ baiGiao: bai, ve }, null, 2));
  process.exit(0);
}

void main();
