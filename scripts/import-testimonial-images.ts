import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";
import AdmZip from "adm-zip";

const CSV_URL =
  "https://drive.google.com/uc?export=download&id=1pCWnymeeHRTmnu7S3lH76diqcjmIbOWJ";
const apply = process.argv.includes("--apply");
const nameOverrides: Record<string, string> = {
  "Nguyễn Ái Nghi (PS392) - Chuyên Lê Hồng Phong": "Nguyễn Ái Nghi",
  "IT.ON48 Hồng Hạnh (Online Hà Nội - Người đi làm cần nhập cư)":
    "IT.ON48 Hồng Hạnh (Online Hà Nội",
};

type CsvRow = Record<string, string>;

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:sr|ps|mt|it|on|hcm)\.?\s*[-.]?\s*\d+\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:overall|ielts)?\b/gi, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

// Padlet/GCS URLs change their signatures, but retain the same 32-character
// object identifier in the path (including inside nested `url`/`original-url`
// query parameters). That identifier is a safer join key than a student name.
function assetKey(value: string): string | null {
  let decoded = value;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded.match(/\b[a-f0-9]{32}\b/i)?.[0]?.toLowerCase() ?? null;
}

async function main() {
  const csvResponse = await fetch(CSV_URL);
  if (!csvResponse.ok) throw new Error(`Cannot download CSV: ${csvResponse.status}`);
  const matrix = parseCsv((await csvResponse.text()).replace(/^\uFEFF/, ""));
  const headers = matrix.shift() ?? [];
  const source: CsvRow[] = matrix
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));

  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  const { rows: students } = await pool.query(
    "SELECT id, student_name, proof_urls FROM testimonials ORDER BY date DESC"
  );

  const byName = new Map<string, typeof students>();
  const byAsset = new Map<string, typeof students>();
  for (const student of students) {
    const key = normalizeName(student.student_name);
    byName.set(key, [...(byName.get(key) ?? []), student]);
    for (const url of student.proof_urls ?? []) {
      const key = assetKey(url);
      if (key) byAsset.set(key, [...(byAsset.get(key) ?? []), student]);
    }
  }

  const matched: Array<{ student: (typeof students)[number]; url: string; sourceName: string }> = [];
  const unmatched: string[] = [];
  const ambiguous: string[] = [];
  for (const row of source) {
    const sourceName = row.Subject?.trim();
    const url = row["Attachment link"]?.trim();
    if (!sourceName || !url) continue;
    const key = assetKey(url);
    let candidates = key ? byAsset.get(key) ?? [] : [];
    if (candidates.length === 0) candidates = byName.get(normalizeName(sourceName)) ?? [];
    if (candidates.length === 0) {
      const sourceKey = normalizeName(sourceName);
      candidates = students.filter((student) => {
        const studentKey = normalizeName(student.student_name);
        return sourceKey === studentKey || sourceKey.startsWith(`${studentKey} `);
      });
    }
    if (candidates.length === 0 && nameOverrides[sourceName]) {
      candidates = students.filter((student) => student.student_name === nameOverrides[sourceName]);
    }
    if (candidates.length > 1) {
      const alreadyImported = candidates.filter((student) =>
        (student.proof_urls ?? []).some((url: string) => url.startsWith("/api/media/"))
      );
      if (alreadyImported.length === 1) candidates = alreadyImported;
    }
    if (candidates.length === 1) matched.push({ student: candidates[0], url, sourceName });
    else if (candidates.length > 1) ambiguous.push(sourceName);
    else unmatched.push(sourceName);
  }

  console.log({ sourceRows: source.length, matched: matched.length, unmatched, ambiguous });
  if (!apply) {
    console.log("Dry run only. Re-run with --apply after reviewing the match report.");
    await pool.end();
    return;
  }
  if (unmatched.length || ambiguous.length) {
    throw new Error("Refusing to apply while unmatched or ambiguous rows remain.");
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY, content_type TEXT NOT NULL, data BYTEA NOT NULL,
    byte_size INTEGER NOT NULL, source_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const downloads: Array<
    (typeof matched)[number] & { assets: Array<{ data: Buffer; contentType: string }> }
  > = [];
  const failedDownloads: string[] = [];
  for (const item of matched) {
    let response: Response | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(item.url);
        if (response.ok || response.status < 500) break;
      } catch {
        // Retry transient network failures.
      }
    }
    if (!response?.ok) {
      failedDownloads.push(`${item.sourceName} (HTTP ${response?.status ?? "network error"})`);
      console.warn(`Skipped: ${failedDownloads.at(-1)}`);
      continue;
    }
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
    const body = Buffer.from(await response.arrayBuffer());
    let assets: Array<{ data: Buffer; contentType: string }> = [];
    const isAlbum = item.url.includes("/exports/photo-album/zip") ||
      contentType === "application/zip" || contentType === "application/x-zip-compressed";
    if (isAlbum) {
      const zip = new AdmZip(body);
      assets = zip
        .getEntries()
        .filter((entry) => !entry.isDirectory && /\.(?:png|jpe?g|webp|gif)$/i.test(entry.entryName))
        .map((entry) => {
          const ext = entry.entryName.split(".").pop()?.toLowerCase();
          const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" :
            ext === "gif" ? "image/gif" : "image/jpeg";
          return { data: entry.getData(), contentType: mime };
        });
    } else if (contentType.startsWith("image/")) {
      assets = [{ data: body, contentType }];
    } else {
      throw new Error(`${item.sourceName}: not an image or album (${contentType})`);
    }
    if (!assets.length || assets.some(({ data }) => data.length === 0 || data.length > 15 * 1024 * 1024)) {
      throw new Error(`${item.sourceName}: album is empty or contains an invalid image`);
    }
    downloads.push({ ...item, assets });
    console.log(
      `Downloaded ${downloads.length}/${matched.length}: ${item.student.student_name} (${assets.length} image${assets.length === 1 ? "" : "s"})`
    );
  }
  console.log({ downloadable: downloads.length, failedDownloads });

  let imported = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of downloads) {
      const urls: string[] = [];
      for (const { data, contentType } of item.assets) {
        const digest = createHash("sha256").update(data).digest("hex");
        const existing = await client.query(
          "SELECT id FROM media_assets WHERE source_url = $1 LIMIT 1",
          [`sha256:${digest}`]
        );
        const id = existing.rows[0]?.id ?? randomUUID();
        if (!existing.rows.length) {
          await client.query(
            "INSERT INTO media_assets (id, content_type, data, byte_size, source_url) VALUES ($1,$2,$3,$4,$5)",
            [id, contentType, data, data.length, `sha256:${digest}`]
          );
        }
        urls.push(`/api/media/${id}`);
      }
      await client.query("UPDATE testimonials SET proof_urls = $1 WHERE id = $2", [urls, item.student.id]);
      imported++;
      console.log(`Stored ${imported}/${matched.length}: ${item.student.student_name} (${urls.length} images)`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
  console.log(`Imported and linked ${imported} testimonial images.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
