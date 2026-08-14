/**
 * Lists the slugs stored in a practice table, optionally filtered by collection.
 * A quick way to see which tests of a book are present.
 *
 *   npx tsx scripts/list-slugs.ts reading "Cambridge IELTS 11"
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
  const skill = process.argv[2] === "listening" ? "listening_tests" : "reading_tests";
  const collection = process.argv[3];

  const { rows } = await pool.query(
    `SELECT slug, title, question_count, sort_order
       FROM ${skill}
      ${collection ? "WHERE collection = $1" : ""}
      ORDER BY sort_order, slug`,
    collection ? [collection] : []
  );

  for (const row of rows) {
    console.log(
      `  ${String(row.sort_order).padStart(4)}  ${row.slug.padEnd(34)} ` +
        `${String(row.question_count).padStart(2)} câu  ${row.title}`
    );
  }
  console.log(`\n${rows.length} đề.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
