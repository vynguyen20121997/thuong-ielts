/**
 * Prints what content the practice section actually has, per collection.
 *
 * The importers report what they wrote; this reports what is there now. Useful
 * before a release to answer "is anything missing?" without reading two tables
 * by hand.
 *
 * Usage: npm run check:coverage
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

interface Row {
  collection: string | null;
  tests: string;
  questions: string;
  incomplete: string;
}

async function report(table: "reading_tests" | "listening_tests", label: string) {
  // `note` only exists on listening; reading has no partial-content concept yet.
  const incomplete = table === "listening_tests" ? "count(*) FILTER (WHERE note IS NOT NULL)" : "0";
  const { rows } = await pool.query<Row>(
    `SELECT collection, count(*) AS tests, sum(question_count) AS questions,
            ${incomplete} AS incomplete
       FROM ${table}
      WHERE status = 'published'
      GROUP BY collection
      ORDER BY collection`
  );

  console.log(`\n${label}`);
  let tests = 0;
  let questions = 0;
  for (const row of rows) {
    tests += Number(row.tests);
    questions += Number(row.questions);
    const flag = Number(row.incomplete) > 0 ? `  (${row.incomplete} đề thiếu audio)` : "";
    console.log(
      `  ${(row.collection ?? "—").padEnd(22)} ${String(row.tests).padStart(3)} đề, ` +
        `${String(row.questions).padStart(4)} câu${flag}`
    );
  }
  console.log(`  ${"TỔNG".padEnd(22)} ${String(tests).padStart(3)} đề, ${String(questions).padStart(4)} câu`);
}

async function main() {
  await report("reading_tests", "READING");
  await report("listening_tests", "LISTENING");
  await pool.end();
}

main().catch((err) => {
  console.error("Coverage report failed:", err);
  process.exit(1);
});
