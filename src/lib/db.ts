import { Pool, types } from "pg";

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
