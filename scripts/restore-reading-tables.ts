import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { fetchDocLines } from './lib/ielts-doc';

dotenv.config({ path: 'apps/web/.env.local' });
const decode = (text: string) => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
function tables(buffer: Buffer) {
  const xml = new AdmZip(buffer).readAsText('word/document.xml');
  return [...xml.matchAll(/<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g)].map(([table]) => {
    const rawRows = [...table.matchAll(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g)].map(([row]) => [...row.matchAll(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g)].map(([cell]) => ({
      text: [...cell.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map(([, p]) => [...p.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(([, text]) => decode(text)).join('')).filter(Boolean).join('\n'),
      colSpan: Number(cell.match(/<w:gridSpan\b[^>]*w:val="(\d+)"/)?.[1] ?? 1),
      merge: /<w:vMerge\b/.test(cell) ? (/w:vMerge[^>]*w:val="restart"/.test(cell) ? 'start' : 'continue') : '',
      rowSpan: 1,
    })));
    const active = new Map<number, typeof rawRows[number][number]>();
    const rows = rawRows.map((row) => {
      let column = 0;
      return row.filter((cell) => {
        const at = column; column += cell.colSpan;
        if (cell.merge === 'continue' && active.has(at)) { active.get(at)!.rowSpan++; return false; }
        if (cell.merge === 'start') active.set(at, cell); else active.delete(at);
        return true;
      });
    });
    const numbers = [...rows.flat().map((c) => c.text).join('\n').matchAll(/\b(\d{1,2})\s*[£$%€]?\s*[….]{2,}/g)].map((m) => Number(m[1]));
    return numbers.length && rows.length > 1 ? { rows, numbers } : null;
  }).filter((table) => table !== null);
}

async function main() {
  const pool = new Pool({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, ssl: { rejectUnauthorized: false } });
  const book = Number(process.argv.find((arg) => arg.startsWith('--book='))?.split('=')[1]);
  if (process.argv.includes('--polar')) {
    const lines = await fetchDocLines('1-beYx9kdVYj8NTjZNabamCZ4z4HGW6bT');
    const start = lines.findIndex(line => line.trim() === 'Reasons why polar bears should be protected');
    const end = lines.findIndex((line, index) => index > start && /^READING PASSAGE 2/.test(line));
    if(start < 0 || end < 0) throw new Error('Polar Bears source boundaries missing');
    const rows = lines.slice(start,end).map(line=>line.trim()).filter(Boolean).map(text=>[{text}]);
    const slug = 'cam16-test1-protect-polar-bears';
    const result = await pool.query('SELECT questions FROM reading_tests WHERE slug=$1',[slug]);
    const questions = result.rows[0].questions;
    const group = questions.filter((q:any)=>q.number>=8 && q.number<=13);
    if(group.length!==6) throw new Error('Polar Bears questions mismatch');
    fs.mkdirSync('.tmp/table-backups',{recursive:true});
    const backup = `.tmp/table-backups/${slug}.json`;
    if(!fs.existsSync(backup)) fs.writeFileSync(backup,JSON.stringify(questions));
    for(const q of group) q.group=group[0].group;
    group[0].tableLayout={rows};
    await pool.query('UPDATE reading_tests SET questions=$1,updated_at=now() WHERE slug=$2',[JSON.stringify(questions),slug]);
    console.log('Restored source notes block for Polar Bears (8–13).');
    await pool.end(); return;
  }
  if (process.argv.includes('--audit')) {
    const { rows } = await pool.query("SELECT slug, questions FROM reading_tests WHERE status='published'");
    const missing = rows.filter((row) => row.questions.some((q: any) => /complete (?:the )?table/i.test(q.group ?? '') && !q.tableLayout) && !row.questions.some((q: any) => q.tableLayout));
    console.log(JSON.stringify(missing.map((row) => ({ slug: row.slug, instruction: row.questions.find((q: any) => /complete (?:the )?table/i.test(q.group ?? ''))?.group?.slice(0, 200) })), null, 2));
    await pool.end(); return;
  }
  const source = fs.readFileSync('scripts/sync-key-practice-reading.ts', 'utf8');
  const sources = [...source.matchAll(/\[(\d+), (\d+), "([^"]+)"\]/g)].filter((m) => !Number.isFinite(book) || Number(m[1]) === book);
  const inputs: { prefix: string; docId?: string; file?: string }[] = sources.map(([, volume, test, id]) => ({ prefix: `cam${volume}-test${test}-%`, docId: id }));
  if (!Number.isFinite(book)) for (let test = 1; test <= 7; test++) {
    const file = `.tmp/guide-source/r${test}q.docx`;
    if (fs.existsSync(file)) inputs.push({ prefix: `guide-test${test}-%`, file });
  }
  if (process.argv.includes('--guide')) inputs.splice(0, sources.length);
  if (process.argv.includes('--train')) {
    inputs.length = 0;
    inputs.push({ prefix: 'train1-test2-%', file: '.tmp/train-source/t1r2q.txt' }, { prefix: 'train1-test4-%', file: '.tmp/train-source/t1r4q.txt' });
  }
  let count = 0;
  for (const input of inputs) {
    let buffer: Buffer;
    if (input.file) buffer = fs.readFileSync(input.file);
    else {
      const response = await fetch(`https://docs.google.com/document/d/${input.docId}/export?format=docx`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${input.docId}: ${response.status}`);
      buffer = Buffer.from(await response.arrayBuffer());
    }
    let layouts = tablesFromInput(buffer, input.file);
    if (process.argv.includes('--inspect')) { console.log(input.prefix, JSON.stringify(layouts)); continue; }
    const { rows } = await pool.query('SELECT slug, questions FROM reading_tests WHERE slug LIKE $1', [input.prefix]);
    for (const row of rows) {
      let changed = false;
      for (const table of layouts) {
        const questions = row.questions.filter((q: any) => table.numbers.includes(q.number));
        if (questions.length !== new Set(table.numbers).size || questions.some((q: any) => q.type !== 'gap-fill')) continue;
        if (!questions.some((q: any) => /complete the table/i.test(q.group ?? ''))) continue;
        const first = questions[0];
        first.tableLayout = { rows: table.rows };
        // All cells share one question group, including imports that only label its first question.
        for (const question of questions) question.group = first.group;
        changed = true;
        count++;
        console.log(`${row.slug}: table questions ${table.numbers.join(', ')}`);
      }
      if (changed) {
        fs.mkdirSync('.tmp/table-backups', { recursive: true });
        const backup = path.join('.tmp/table-backups', `${row.slug}.json`);
        if (!fs.existsSync(backup)) {
          const original = await pool.query('SELECT questions FROM reading_tests WHERE slug=$1', [row.slug]);
          fs.writeFileSync(backup, JSON.stringify(original.rows[0].questions));
        }
        await pool.query('UPDATE reading_tests SET questions=$1, updated_at=now() WHERE slug=$2', [JSON.stringify(row.questions), row.slug]);
      }
    }
  }
  await pool.end();
  console.log(`Restored ${count} tables.`);
}
main().catch((error) => { console.error(error); process.exit(1); });

function tablesFromInput(buffer: Buffer, file?: string): ReturnType<typeof tables> {
  if (!file?.endsWith('.txt')) return tables(buffer);
  const raw = buffer.toString('utf8');
  const creature = raw.includes('CREATURE');
  const start = raw.indexOf(creature ? 'CREATURE' : 'Subjects');
  const endMarker = creature ? 'READING PASSAGE 2' : 'Question 8';
  const block = raw.slice(start, raw.indexOf(endMarker, start));
  const cells = block.split(/\r?\n\t/).map((text) => text.trim()).filter(Boolean).map((text) => text.replace(/\b(\d{1,2})[ \t]{3,}/g, '$1…………'));
  const columns = creature ? 2 : 3;
  const rows: { text: string; colSpan: number; rowSpan: number; merge: string }[][] = [];
  for (let index = 0; index < cells.length;) {
    const span = cells[index] === 'Amphibians, fish and insects';
    const row = cells.slice(index, index + (span ? 1 : columns));
    if (!span && row.length !== columns) throw new Error(`${file}: invalid source table row`);
    rows.push(row.map((text) => ({ text, colSpan: span ? columns : 1, rowSpan: 1, merge: '' })));
    index += row.length;
  }
  const numbers = [...rows.flat().map((cell) => cell.text).join('\n').matchAll(/\b(\d{1,2})\s*[….]{2,}/g)].map((match) => Number(match[1]));
  return [{ rows, numbers }];
}
