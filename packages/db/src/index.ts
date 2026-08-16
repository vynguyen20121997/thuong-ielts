import { Pool, types } from "pg";

export * from "./types";

// Return DATE columns as plain "yyyy-mm-dd" strings instead of JS Date
// objects — avoids the classic node-postgres timezone off-by-one bug where
// a DATE parsed into a local-midnight Date shifts a day when serialized.
types.setTypeParser(1082, (val) => val);

// Reused across route handlers within the same server process (Next.js
// keeps modules warm between requests in dev and in a running server).
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool =
  global.__pgPool ??
  new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

// "yyyy-mm-dd" (raw Postgres DATE string) -> "dd/mm/yyyy" (format the rest
// of the app's date parsing utilities expect).
export function toDisplayDate(isoDate: string | null): string {
  if (!isoDate) return "";
  const [yyyy, mm, dd] = isoDate.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

// Generic editable site content, stored one JSON blob per section key
// (e.g. "hero"). Falls back to `fallback` if the row doesn't exist yet.
export async function getSiteContent<T>(key: string, fallback: T): Promise<T> {
  const { rows } = await pool.query(`SELECT data FROM site_content WHERE key = $1`, [key]);
  if (rows.length === 0) return fallback;
  return { ...fallback, ...rows[0].data } as T;
}

export async function setSiteContent<T>(key: string, data: T): Promise<void> {
  await pool.query(
    `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [key, JSON.stringify(data)]
  );
}

/*
  Hợp đồng realtime giữa hai tiến trình `web` và `admin` — xem ./live.ts.

  Đặt ở CUỐI file, sau khi `pool` đã dựng xong: `live.ts` import ngược lại
  chính file này, nên để ở đầu là một vòng lặp import mà thứ tự khởi tạo phụ
  thuộc vào trình đóng gói. Ở cuối thì không phải nghĩ tới nữa.
*/
export * from "./live";
