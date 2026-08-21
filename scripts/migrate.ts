/**
 * Creates the schema (if not present) and upserts data from the existing
 * static TS data files (testimonialsData.ts, feedbackData.ts) into Postgres.
 * Idempotent: safe to re-run — rows are upserted by their existing string id.
 *
 * Usage: npx tsx scripts/migrate.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });
// Tài khoản quản trị nằm ở env của apps/admin, không phải apps/web. `seedFirstTeacher`
// cần đọc được nó. dotenv không ghi đè biến đã có, nên cấu hình DB ở trên vẫn thắng.
dotenv.config({ path: path.join(__dirname, "..", "apps", "admin", ".env.local") });
import { initialTestimonials } from "../apps/web/src/data/testimonialsData";
import { feedbackItems } from "../apps/web/src/data/feedbackData";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

// "dd/mm/yyyy" -> "yyyy-mm-dd" (Postgres DATE literal); null if unparseable.
function toIsoDate(date: string): string | null {
  const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

async function migrateSchema() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(sql);
  console.log("Schema ensured (testimonials, feedbacks, blog_posts).");
}

async function migrateTestimonials() {
  let count = 0;
  for (const t of initialTestimonials) {
    await pool.query(
      `INSERT INTO testimonials
        (id, student_name, score, before_score, after_score, school_or_job, course_id,
         course_name, comment, avatar_url, proof_urls, listening, reading, writing,
         speaking, rating, helpful_count, date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO UPDATE SET
         student_name = EXCLUDED.student_name,
         score = EXCLUDED.score,
         before_score = EXCLUDED.before_score,
         after_score = EXCLUDED.after_score,
         school_or_job = EXCLUDED.school_or_job,
         course_id = EXCLUDED.course_id,
         course_name = EXCLUDED.course_name,
         comment = EXCLUDED.comment,
         avatar_url = EXCLUDED.avatar_url,
         -- proof_urls is intentionally not updated here. Once a testimonial
         -- exists, its images are managed by the admin/import workflow. Seed
         -- migrations must never restore stale or expiring Padlet URLs.
         listening = EXCLUDED.listening,
         reading = EXCLUDED.reading,
         writing = EXCLUDED.writing,
         speaking = EXCLUDED.speaking,
         rating = EXCLUDED.rating,
         helpful_count = EXCLUDED.helpful_count,
         date = EXCLUDED.date`,
      [
        t.id,
        t.studentName,
        t.score,
        t.beforeScore ?? null,
        t.afterScore ?? null,
        t.schoolOrJob ?? null,
        t.courseId ?? null,
        t.courseName ?? null,
        t.comment ?? null,
        t.avatarUrl ?? null,
        t.proofUrl ?? [],
        t.subScores?.listening ?? null,
        t.subScores?.reading ?? null,
        t.subScores?.writing ?? null,
        t.subScores?.speaking ?? null,
        t.rating ?? null,
        t.helpfulCount ?? 0,
        toIsoDate(t.date),
      ]
    );
    count++;
  }
  console.log(`Upserted ${count} testimonials.`);
}

async function migrateFeedbacks() {
  let count = 0;
  for (const f of feedbackItems) {
    await pool.query(
      `INSERT INTO feedbacks (id, subject, image_url, date, is_class_summary)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET
         subject = EXCLUDED.subject,
         -- image_url is managed by the admin/import workflow. Never restore
         -- expiring Padlet seed URLs on an existing feedback row.
         date = EXCLUDED.date,
         is_class_summary = EXCLUDED.is_class_summary`,
      [f.id, f.subject, f.imageUrl, toIsoDate(f.date), f.isClassSummary ?? false]
    );
    count++;
  }
  console.log(`Upserted ${count} feedbacks.`);
}

/**
 * Chuyển tài khoản quản trị từ biến môi trường vào bảng `teachers`.
 *
 * Trang quản trị vốn đăng nhập bằng ADMIN_USERNAME + ADMIN_PASSWORD_HASH. Hàm
 * này gieo đúng cặp đó thành dòng giáo viên đầu tiên, để phần đăng nhập chuyển
 * sang đọc DB mà không ai phải đặt lại mật khẩu.
 *
 * Chỉ gieo khi bảng còn trống. Chạy lại sau khi cô đã đổi mật khẩu trong trang
 * quản trị mà vẫn ghi đè từ biến môi trường thì hoá ra là khôi phục mật khẩu cũ
 * — im lặng và rất khó hiểu chuyện gì vừa xảy ra.
 */
async function seedFirstTeacher() {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM teachers`);
  if (rows[0].n > 0) {
    console.log(`Teachers: đã có ${rows[0].n} dòng, không gieo lại.`);
    return;
  }

  if (!username || !passwordHash) {
    console.warn(
      "Teachers: bảng trống và chưa có ADMIN_USERNAME/ADMIN_PASSWORD_HASH — " +
        "bỏ qua. Trang quản trị vẫn đăng nhập được bằng biến môi trường."
    );
    return;
  }

  await pool.query(
    `INSERT INTO teachers (id, username, password_hash, name, is_owner)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (username) DO NOTHING`,
    ["teacher-thuong", username, passwordHash, "Cô Hồ Ngọc Thương"]
  );
  console.log(`Teachers: đã gieo giáo viên đầu tiên (${username}).`);
}

async function main() {
  await migrateSchema();
  await migrateTestimonials();
  await migrateFeedbacks();
  await seedFirstTeacher();

  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*) FROM testimonials) AS testimonials,
       (SELECT count(*) FROM feedbacks) AS feedbacks,
       (SELECT count(*) FROM blog_posts) AS blog_posts,
       (SELECT count(*) FROM teachers) AS teachers,
       (SELECT count(*) FROM attempts) AS attempts`
  );
  console.log("Row counts:", rows[0]);

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
