/**
 * Chốt những lượt đã hết giờ mà không ai bấm nộp.
 *
 * Học sinh đóng tab giữa chừng, máy sập nguồn, hoặc mạng rớt hẳn — lượt đó nằm
 * mãi ở `in_progress`. Hậu quả không chỉ là một dòng rác: bảng lớp của cô sẽ
 * mang theo những em không còn ở đó, và lịch sử làm bài của học sinh thì thiếu
 * mất bài em ấy đã làm dở.
 *
 * CHỐT BẰNG ĐÚNG NHỮNG GÌ EM ẤY ĐÃ LÀM ĐƯỢC, không phải bằng phiếu trắng —
 * `attempt_progress` giữ sẵn số câu đúng và nội dung đã gõ tính tới nhịp cuối.
 * Ai làm được 24 câu rồi mất mạng thì phải thấy điểm của 24 câu ấy.
 *
 * Chạy lại nhiều lần vẫn an toàn: mệnh đề `WHERE status = 'in_progress'` khiến
 * lần chạy thứ hai không đụng vào lượt nào đã chốt.
 *
 * Usage: npx tsx scripts/close-expired-attempts.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

import { bandFromScore } from "../apps/web/src/features/practice/domain/bandScore";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

/**
 * Đợi thêm một phút sau giờ hết hạn rồi mới chốt.
 *
 * Học sinh bấm nộp đúng giây cuối thì request của em ấy còn đang trên đường.
 * Chốt ngay lúc `expires_at` là có ngày cướp mất lần nộp thật, và em ấy sẽ thấy
 * "bài đã được nộp tự động" dù vừa tự bấm.
 */
const AN_TOAN_GIAY = 60;

async function main() {
  const { rows } = await pool.query(
    `SELECT a.id, a.total,
            COALESCE(p.correct, 0)         AS correct,
            COALESCE(p.answers, '{}'::jsonb) AS answers,
            COALESCE(p.marks, '[]'::jsonb)   AS marks,
            EXTRACT(EPOCH FROM (a.expires_at - a.started_at))::int AS thoi_luong
       FROM attempts a
       LEFT JOIN attempt_progress p ON p.attempt_id = a.id
      WHERE a.status = 'in_progress'
        AND a.expires_at < now() - make_interval(secs => $1::int)`,
    [AN_TOAN_GIAY]
  );

  if (rows.length === 0) {
    console.log("Không có lượt nào quá hạn.");
    await pool.end();
    return;
  }

  let dem = 0;
  for (const row of rows) {
    const total: number = row.total ?? 0;
    const correct: number = row.correct ?? 0;

    // `results` dựng lại từ `marks` để ngăn chi tiết của cô vẫn xem được, mà
    // không phải chấm lại — và vẫn không mang theo đáp án đúng.
    const marks: (boolean | null)[] = Array.isArray(row.marks) ? row.marks : [];
    const results = marks.map((ok, i) => ({ q: null, n: i + 1, ok: ok === true }));

    await pool.query(
      `UPDATE attempts
          SET status = 'submitted',
              submitted_at = expires_at,
              auto_submitted = true,
              elapsed_seconds = $2,
              correct = $3,
              band = $4,
              answers = $5,
              results = $6
        WHERE id = $1 AND status = 'in_progress'`,
      [
        row.id,
        row.thoi_luong ?? 0,
        correct,
        bandFromScore(correct, total),
        JSON.stringify(row.answers ?? {}),
        JSON.stringify(results),
      ]
    );
    dem++;
  }

  console.log(`Đã chốt ${dem} lượt quá hạn.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Chốt lượt quá hạn thất bại:", err);
  process.exit(1);
});
