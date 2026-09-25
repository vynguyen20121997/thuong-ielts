import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

/**
 * Dựng bảng cho phần Quản lý lớp. Chạy lại nhiều lần vẫn an toàn.
 *
 * Usage: npm run migrate:class
 */
async function main() {
  const { pool } = await import("@thuong-ielts/db");
  const sql = fs.readFileSync(path.join(__dirname, "class-schema.sql"), "utf-8");
  await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema='public'
        AND table_name IN ('classes','class_members','tuition_payments','student_notes')
      ORDER BY table_name`,
  );
  console.log("Đã có:", rows.map((r) => r.table_name).join(", "));
  process.exit(0);
}
void main();
