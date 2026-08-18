/**
 * Dọn khách vãng lai sau 1 ngày.
 *
 * Khách vào bằng link cô gửi thì chỉ có cái tên nằm trong lượt làm bài — không
 * có tài khoản, không có hồ sơ. Giữ lại vô thời hạn là tích trữ tên người lạ
 * mà chẳng dùng vào việc gì.
 *
 * CÔ CẦN BIẾT: sau khi dọn, bảng điểm buổi đó KHÔNG còn tên khách nữa. Muốn
 * giữ thì xuất file trước khi hết ngày — trang bảng điểm có nói rõ chuyện này.
 *
 * Chạy lại nhiều lần vẫn an toàn.
 *
 * Usage: npx tsx scripts/clean-guests.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // Chỉ đụng lượt của KHÁCH (`student_id IS NULL`). Lượt của học sinh có tài
  // khoản là lịch sử học tập của các em, không bao giờ dọn ở đây.
  const { rowCount } = await pool.query(
    `DELETE FROM attempts
      WHERE student_id IS NULL
        AND guest_name IS NOT NULL
        AND started_at < now() - interval '1 day'`
  );
  console.log(`Đã dọn ${rowCount ?? 0} lượt của khách vãng lai (quá 1 ngày).`);

  await pool.end();
}

main().catch((err) => {
  console.error("Dọn khách vãng lai thất bại:", err);
  process.exit(1);
});
