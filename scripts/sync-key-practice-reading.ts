/** Synchronise Key Practice Reading wording from the owner-supplied Drive files. */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";
import { fetchDocLines } from "./lib/ielts-doc";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "apps", "web", ".env.local") });
const dry = process.argv.includes("--dry");
const onlyBook = Number(process.argv.find((argument) => argument.startsWith("--book="))?.split("=")[1]);

const SOURCES = [
  [10, 1, "1M7aHDNLWQ-oD3TSQzQCkC3DkPT9AH_Oz"], [10, 2, "1vS7fetVgcs0Xu9GzzuhWoqCYAw1mRoqO"], [10, 3, "17F5ZXEwZasGfxKA36e6Vvco23jQ88R49"], [10, 4, "1UotoIPc4Gm42w4R45b2Kw-kW5qyyckNh"],
  [11, 1, "1iLDtSIupqYxTKMd5ZR1_Oqor9fmfFWfh"], [11, 2, "12ruJNDQbZYQ_eNN7lVrK-9NVmjQ8TBLf"], [11, 3, "1VSIUCeMTHdmfMDLf5UES8c9p_Fp7K5X7"],
  [12, 1, "1Dp7oK4vTrasuvh5BI0WsLw9ezaHd1Rtg"], [12, 2, "18s-ylckDkqHaqSgTjJy0N1oo67f0oAyr"], [12, 3, "1JmSe8tANdfmYZGkYr1I5V4s6jyJec18A"], [12, 4, "1tlr6rk9rZlbyss9XPzEmCl72LX-PFXUV"],
  [13, 1, "15dluTRjiakOx4bMYUAfjNM9qGy1TLkJb"], [13, 2, "1S7f_DnUhtIc18q8urU1bO40r5vtjxy1X"], [13, 3, "1IM26RMnJ8FJFCVIxnAf07ZmjqlgLkZpd"], [13, 4, "1SL8gN7tOx-ikgpJq5Advxp8wdiptofMa"],
  [14, 1, "1VaMZBiN06PWjIXi2RCZriJAoDwczFYhw"], [14, 2, "1XPH6AJ2f8wVcpnipSXw9QKlLvy1ed8qM"], [14, 3, "13GQcDJdCA_yKLg4EKusDNEX3rOBv-6kN"], [14, 4, "1QAcK1fmXeY0yuZF98DGlNOu_fmZ36_QQ"],
  [15, 1, "1LFrbak_kSi3rDgpzlWaKYanE5hgPX5D0"], [15, 2, "1e-i-GfJnOh82OqC2iEy5Af5wL660k5AE"], [15, 3, "14waB5Pb62JgvljfEAU0JgS6oD-WiHJgJ"], [15, 4, "1_KaaplrLUYudA7VsryZYj_cMa1u8g1_k"],
  [16, 1, "1-beYx9kdVYj8NTjZNabamCZ4z4HGW6bT"], [16, 2, "1SOXglkUnrSX60WeKgkRGYuYCu4qt5VQ2"], [16, 3, "1d7nxvhYxZWS33h3Ghjp8hTQokG0yYMeH"], [16, 4, "1GX7VgyU_b_cpF4iNU4nbPSscwZtv12tl"],
  [17, 1, "1auZLVD3xUBR4mJ7P5zO5FPCqpjvY2bKA"], [17, 2, "1p0Qi5xXIiHdrMLaXw6SHImTC6ezS2ayG"], [17, 3, "1iJntbBkwd5FuL6RHk6A1HqBPI4UrJNxS"], [17, 4, "1EoEnwViHsK8T1coXwwP9iY8xAMs5ivAy"],
  [18, 1, "1oBz2Pe1scd5wwaRMxgm34_xzWgoyS6-r"], [18, 2, "1UQ3c61HKASw9MJjhSrI_zQiBvVFcgtrg"], [18, 3, "1aYTUzSctul2MwUCvdbzu4OxU2_83Z7ex"], [18, 4, "15Ptotz-XaqKMWg88Gv0oD8j0J8dYrLiN"],
] as const;

type Question = { number: number; group?: string; [key: string]: unknown };
type Passage = { title: string; intro?: string; paragraphs: { label?: string; text: string }[] };
type Group = { count: number; text: string };

const clean = (line: string) => line.replace(/\u00a0/g, " ").trim();
const rangeOf = (line: string) => line.match(/^Questions?\s+(\d+)\s*(?:[-–&]|and)\s*(\d+)/i);
const slugWords = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((word) => word.length > 2);

function instructionEnd(block: string[], from: number, to: number, start: number, fallback: number) {
  for (let index = start + 1; index < fallback; index += 1) {
    const number = block[index].match(/^(\d{1,2})(?:[.)]\s*|\s{2,})/);
    if (number && Number(number[1]) >= from && Number(number[1]) <= to) return index;
  }
  return fallback;
}

function parsePassages(source: string[]): { passage: Passage; groups: Group[] }[] {
  const starts = source.map((line, index) => (/^READING\s+PASSAGE\s+[123]\s*$/i.test(clean(line)) ? index : -1)).filter((index) => index >= 0);
  return starts.map((start, part) => {
    const block = source.slice(start, starts[part + 1] ?? source.length).map(clean).filter(Boolean);
    const introIndex = block.findIndex((line) => /^You should spend about/i.test(line));
    const titleIndex = introIndex >= 0 ? introIndex + 1 : 1;
    const firstQuestions = block.findIndex((line) => /^Questions?\s+\d+/i.test(line));
    const prose = block.slice(titleIndex + 1, firstQuestions >= 0 ? firstQuestions : block.length);
    const paragraphs: Passage["paragraphs"] = [];
    let label: string | undefined;
    for (const line of prose) {
      if (/^[A-Z]$/.test(line)) { label = line; continue; }
      paragraphs.push(label ? { label, text: line } : { text: line });
      label = undefined;
    }
    const groups: Group[] = [];
    for (let index = firstQuestions; index >= 0 && index < block.length;) {
      const match = rangeOf(block[index]);
      if (!match) { index++; continue; }
      const from = Number(match[1]);
      const to = Number(match[2]);
      const count = to - from + 1;
      let next = index + 1;
      while (next < block.length && !rangeOf(block[next])) next++;
      const end = instructionEnd(block, from, to, index, next);
      groups.push({ count, text: block.slice(index, end).join("\n") });
      index = next;
    }
    return { passage: { title: block[titleIndex] ?? "Reading passage", ...(introIndex >= 0 ? { intro: block[introIndex] } : {}), paragraphs }, groups };
  });
}

async function main() {
  const inspectId = process.argv.find((argument) => argument.startsWith("--inspect="))?.split("=")[1];
  if (inspectId) {
    console.log((await fetchDocLines(inspectId)).join("\n"));
    return;
  }
  const pool = new Pool({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, ssl: { rejectUnauthorized: false } });
  let updated = 0;
  for (const [book, test, docId] of SOURCES) {
    if (Number.isFinite(onlyBook) && book !== onlyBook) continue;
    const source = parsePassages(await fetchDocLines(docId));
    const { rows } = await pool.query("SELECT slug, title, passage, questions FROM reading_tests WHERE slug LIKE $1", [`cam${book}-test${test}-%`]);
    for (const row of rows) {
      const rowWords = new Set(slugWords(row.slug));
      const parsed = source.find(({ passage }) => {
        const titleWords = slugWords(passage.title);
        return titleWords.length > 0 && titleWords.filter((word) => rowWords.has(word)).length >= Math.min(2, titleWords.length);
      });
      if (!parsed) continue;
      const questionCount = (row.questions as Question[]).length;
      const sourceQuestionCount = parsed.groups.reduce((sum, group) => sum + group.count, 0);
      if (questionCount !== sourceQuestionCount) {
        console.warn(`Skip ${row.slug}: DB has ${questionCount} questions; source has ${sourceQuestionCount}.`);
        continue;
      }
      let groupIndex = 0;
      let remaining = parsed.groups[0]?.count ?? 0;
      const questions = (row.questions as Question[]).map((question) => {
        const group = parsed.groups[groupIndex];
        const next = { ...question, ...(group ? { group: group.text } : {}) };
        if (--remaining === 0 && groupIndex < parsed.groups.length - 1) { groupIndex++; remaining = parsed.groups[groupIndex].count; }
        return next;
      });
      if (!dry) await pool.query("UPDATE reading_tests SET passage = $1, questions = $2, updated_at = now() WHERE slug = $3", [JSON.stringify(parsed.passage), JSON.stringify(questions), row.slug]);
      updated++;
    }
  }
  await pool.end();
  console.log(`${dry ? "Would update" : "Updated"} ${updated} Key Practice passages.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
