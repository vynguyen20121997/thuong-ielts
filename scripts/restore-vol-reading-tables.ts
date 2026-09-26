import fs from 'node:fs';
import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config({ path: 'apps/web/.env.local' });
const pool = new Pool({host:process.env.PGHOST,port:Number(process.env.PGPORT??5432),user:process.env.PGUSER,password:process.env.PGPASSWORD,database:process.env.PGDATABASE,ssl:{rejectUnauthorized:false}});
const text = (html: string) => html.replace(/<br\s*\/?\s*>|<\/p>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
async function json(url: string) { const response = await fetch(url,{signal:AbortSignal.timeout(15000)}); if(!response.ok) throw new Error(`Source HTTP ${response.status}`); return response.json(); }
async function main() {
  const {rows} = await pool.query("SELECT slug, questions FROM reading_tests WHERE slug LIKE 'vol-%' AND status='published'");
  for (const row of rows) {
    if (!row.questions.some((q:any)=>/complete (?:the )?table/i.test(q.group??'')) || row.questions.some((q:any)=>q.tableLayout)) continue;
    const match = row.slug.match(/^vol-(\d+)-test-(\d+)-passage-(\d+)$/)!;
    const testSet = `VOL ${match[1]} TEST ${match[2]}`;
    try {
      const params = new URLSearchParams({type:'reading',contentType:'academic',source:'vol',testSet,status:'waiting',page:'1',limit:'100'});
      const list = await json(`https://api.ieltsmate.vn/api/study-room?${params}`);
      const room = list.data.find((r:any)=>r.title===`${testSet} PASSAGE ${match[3]}`);
      if(!room) throw new Error('Source passage unavailable');
      const detail = await json(`https://api.ieltsmate.vn/api/study-room/room/${room.id}`);
      const sets = detail.content.parts[0].question_sets.filter((s:any)=>/table/i.test(s.description??s.instruction??''));
      let restored = 0;
      for(const set of sets) {
        const html = [set.description,set.instruction,set.content].filter(Boolean).join('\n');
        const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
        for(const [,table] of tables) {
          const tableRows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(([,r])=>[...r.matchAll(/<(?:td|th)\b([^>]*)>([\s\S]*?)<\/(?:td|th)>/gi)].map(([,attrs,cell])=>({text:text(cell),colSpan:Number(attrs.match(/colspan=["']?(\d+)/i)?.[1]??1),rowSpan:Number(attrs.match(/rowspan=["']?(\d+)/i)?.[1]??1)})));
          const numbers = [...tableRows.flat().map(c=>c.text).join('\n').matchAll(/\b(\d{1,2})\s*[….]{2,}/g)].map(m=>Number(m[1]));
          const questions = row.questions.filter((q:any)=>numbers.includes(q.number));
          if(!numbers.length || questions.length!==new Set(numbers).size || questions.some((q:any)=>q.type!=='gap-fill')) continue;
          const instruction = text(html.slice(0,html.indexOf('<table')));
          for(const q of questions) q.group = instruction;
          questions[0].tableLayout = {rows:tableRows}; restored++;
        }
        if(!tables.length) console.log(`${row.slug}: source has no HTML table; fields=${Object.keys(set).filter(k=>k!=='questions').join(',')}; description=${text(html).slice(0,150)}`);
      }
      if(restored) {
        fs.mkdirSync('.tmp/table-backups',{recursive:true});
        const backup = `.tmp/table-backups/${row.slug}.json`;
        if(!fs.existsSync(backup)) { const previous=await pool.query('SELECT questions FROM reading_tests WHERE slug=$1',[row.slug]); fs.writeFileSync(backup,JSON.stringify(previous.rows[0].questions)); }
        await pool.query('UPDATE reading_tests SET questions=$1,updated_at=now() WHERE slug=$2',[JSON.stringify(row.questions),row.slug]);
        console.log(`${row.slug}: restored ${restored} tables`);
      }
    } catch(error) { console.log(`${row.slug}: ${(error as Error).message}`); }
  }
  await pool.end();
}
main().catch(async error=>{console.error(error);await pool.end();process.exitCode=1;});
