/**
 * Dựng/cập nhật bảng `vocab_*` từ `vocab-schema.sql`. Chạy lại nhiều lần vẫn an toàn.
 *
 * Usage: npm run migrate:vocab
 */
import fs from "fs";
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

const sql = fs.readFileSync(path.join(__dirname, "vocab-schema.sql"), "utf-8");
pool
  .query(sql)
  .then(() => console.log("Schema vocab_* ensured (kèm parent_id cho bộ con)."))
  .finally(() => pool.end());
