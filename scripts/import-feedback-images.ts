import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import { Pool } from "pg";

const CSV_URL =
  "https://drive.google.com/uc?export=download&id=1o7-d9ucqFqs6iLlXGu1ZJ3hpKI92K2Sk";
const apply = process.argv.includes("--apply");

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function assetKey(value: string): string | null {
  let decoded = value;
  for (let i = 0; i < 3; i++) {
    try { const next = decodeURIComponent(decoded); if (next === decoded) break; decoded = next; }
    catch { break; }
  }
  return decoded.match(/\b[a-f0-9]{32}\b/i)?.[0]?.toLowerCase() ?? null;
}

function extractAssets(body: Buffer, contentType: string, url: string) {
  const isZip = url.includes("/exports/photo-album/zip") ||
    contentType === "application/zip" || contentType === "application/x-zip-compressed";
  if (!isZip) {
    if (!contentType.startsWith("image/")) throw new Error(`Unsupported content type: ${contentType}`);
    return [{ data: body, contentType }];
  }
  return new AdmZip(body).getEntries()
    .filter((entry) => !entry.isDirectory && /\.(?:png|jpe?g|webp|gif)$/i.test(entry.entryName))
    .map((entry) => {
      const ext = entry.entryName.split(".").pop()?.toLowerCase();
      const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" :
        ext === "gif" ? "image/gif" : "image/jpeg";
      return { data: entry.getData(), contentType: type };
    });
}

async function main() {
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error(`Cannot download CSV: ${response.status}`);
  const matrix = parseCsv((await response.text()).replace(/^\uFEFF/, ""));
  const headers = matrix.shift() ?? [];
  const source = matrix.filter((r) => r.some(Boolean)).map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])) as Record<string, string>);

  const pool = new Pool({ host: process.env.PGHOST, port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false }, max: 5 });
  const { rows: feedbacks } = await pool.query("SELECT id, subject, image_url FROM feedbacks");
  const byAsset = new Map<string, typeof feedbacks>();
  const bySubject = new Map<string, typeof feedbacks>();
  for (const feedback of feedbacks) {
    const key = assetKey(feedback.image_url ?? "");
    if (key) byAsset.set(key, [...(byAsset.get(key) ?? []), feedback]);
    const subject = normalize(feedback.subject);
    bySubject.set(subject, [...(bySubject.get(subject) ?? []), feedback]);
  }

  const matched: Array<{ feedback: (typeof feedbacks)[number]; url: string }> = [];
  const unmatched: string[] = [];
  const ambiguous: string[] = [];
  for (const row of source) {
    const subject = row.Subject?.trim();
    const url = row["Attachment link"]?.trim();
    if (!subject || !url) continue;
    const key = assetKey(url);
    let candidates = key ? byAsset.get(key) ?? [] : [];
    if (!candidates.length) candidates = bySubject.get(normalize(subject)) ?? [];
    if (candidates.length === 1) matched.push({ feedback: candidates[0], url });
    else if (candidates.length > 1) ambiguous.push(subject);
    else unmatched.push(subject);
  }
  console.log({ sourceRows: source.length, databaseRows: feedbacks.length, matched: matched.length,
    unmatched, ambiguous });
  if (!apply) { await pool.end(); return; }
  if (unmatched.length || ambiguous.length) throw new Error("Refusing to apply unresolved matches");

  await pool.query(`CREATE TABLE IF NOT EXISTS feedback_media_assets (
    feedback_id TEXT NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (feedback_id, media_id))`);

  const downloads: Array<{ feedback: (typeof feedbacks)[number]; assets: ReturnType<typeof extractAssets> }> = [];
  const failed: string[] = [];
  for (const item of matched) {
    const imageResponse = await fetch(item.url);
    if (!imageResponse.ok) { failed.push(`${item.feedback.subject} (HTTP ${imageResponse.status})`); continue; }
    const type = imageResponse.headers.get("content-type")?.split(";")[0] ?? "";
    const assets = extractAssets(Buffer.from(await imageResponse.arrayBuffer()), type, item.url);
    if (!assets.length || assets.some((x) => !x.data.length || x.data.length > 15 * 1024 * 1024)) {
      failed.push(`${item.feedback.subject} (invalid/empty album)`); continue;
    }
    downloads.push({ feedback: item.feedback, assets });
    console.log(`Downloaded ${downloads.length}/${matched.length}: ${item.feedback.subject} (${assets.length})`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < downloads.length; i++) {
      const item = downloads[i];
      const ids: string[] = [];
      for (const asset of item.assets) {
        const digest = createHash("sha256").update(asset.data).digest("hex");
        const existing = await client.query("SELECT id FROM media_assets WHERE source_url=$1 LIMIT 1", [`sha256:${digest}`]);
        const id = existing.rows[0]?.id ?? randomUUID();
        if (!existing.rows.length) await client.query(
          "INSERT INTO media_assets(id,content_type,data,byte_size,source_url) VALUES($1,$2,$3,$4,$5)",
          [id, asset.contentType, asset.data, asset.data.length, `sha256:${digest}`]);
        ids.push(id);
      }
      await client.query("DELETE FROM feedback_media_assets WHERE feedback_id=$1", [item.feedback.id]);
      for (let position = 0; position < ids.length; position++) await client.query(
        "INSERT INTO feedback_media_assets(feedback_id,media_id,position) VALUES($1,$2,$3)",
        [item.feedback.id, ids[position], position]);
      await client.query("UPDATE feedbacks SET image_url=$1 WHERE id=$2", [`/api/media/${ids[0]}`, item.feedback.id]);
      console.log(`Stored ${i + 1}/${downloads.length}: ${item.feedback.subject}`);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); await pool.end(); }
  console.log({ imported: downloads.length, failed });
}

main().catch((error) => { console.error(error); process.exit(1); });
