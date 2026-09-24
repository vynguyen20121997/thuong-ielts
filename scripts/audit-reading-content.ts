import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "apps", "web", ".env.local") });

type Question = { number: number; group?: string; prompt?: string };
type Passage = { title?: string; intro?: string; paragraphs?: { text?: string }[] };
const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;

async function main() {
  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });
  const { rows } = await pool.query("SELECT slug, collection, passage, questions FROM reading_tests WHERE status = 'published' ORDER BY sort_order, slug");
  const vietnamese: string[] = [];
  const missingInstructions: string[] = [];
  for (const row of rows) {
    const passage = row.passage as Passage;
    const questions = row.questions as Question[];
    const readingText = [passage.title, passage.intro, ...(passage.paragraphs ?? []).map((item) => item.text)].filter(Boolean).join("\n");
    if (VIETNAMESE.test(readingText)) vietnamese.push(row.slug);
    const byGroup = new Map<string, Question[]>();
    for (const question of questions) {
      const key = question.group?.trim() ?? "";
      if (!key) missingInstructions.push(`${row.slug}: Q${question.number}`);
      else byGroup.set(key, [...(byGroup.get(key) ?? []), question]);
    }
  }
  console.log(JSON.stringify({ testsScanned: rows.length, passagesWithVietnamese: vietnamese, missingInstructionQuestions: missingInstructions }, null, 2));
  await pool.end();
}

main().catch((error) => { console.error(error); process.exit(1); });
