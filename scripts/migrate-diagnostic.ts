import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config({ path: 'apps/web/.env.local' });
const pool = new Pool({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, ssl: { rejectUnauthorized: false } });
async function main(){try { await pool.query(readFileSync('scripts/diagnostic-schema.sql', 'utf8')); console.log('Diagnostic schema ready.'); } finally { await pool.end(); }}
main().catch(error=>{console.error(error);process.exitCode=1;});
