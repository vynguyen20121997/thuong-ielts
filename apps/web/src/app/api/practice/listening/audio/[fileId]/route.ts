import { NextResponse } from "next/server";

/**
 * Streams a listening recording that lives in the teacher's Google Drive.
 *
 * Why this proxy exists: a browser cannot play a Drive file directly. Google
 * answers browser-originated media requests with an HTML interstitial and no
 * CORS header, so `<audio src="https://drive.google.com/...">` fails with a
 * decode error — verified for both a 28 MB and a 6 MB file. Server-to-server
 * requests get the real bytes, so the server fetches and relays them.
 *
 * Range requests are forwarded verbatim; without that the player cannot seek
 * and Safari refuses to start at all.
 *
 * The audio URL is a column in the database, so moving these files to object
 * storage later is a data change — this route simply stops being used.
 */

const DRIVE_ENDPOINT = "https://drive.usercontent.google.com/download";

/** Drive ids are opaque but bounded; reject anything that isn't one. */
const VALID_ID = /^[A-Za-z0-9_-]{20,60}$/;

/**
 * Drive drops a connection now and then — observed as roughly one failure in
 * two on a cold request. A single attempt therefore leaves the student staring
 * at a dead player, so retry briefly before giving up. The doc importer needed
 * the same treatment for the same reason.
 */
async function fetchWithRetry(fileId: string, range: string | null): Promise<Response> {
  const attempts = 3;
  let lastError: unknown;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(`${DRIVE_ENDPOINT}?id=${fileId}&export=download`, {
        headers: {
          // Drive serves the real bytes to a plain client; a browser-ish request
          // gets the virus-scan interstitial instead.
          "User-Agent": "curl/8.0",
          ...(range ? { Range: range } : {}),
        },
        cache: "no-store",
      });
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }

  throw lastError;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  if (!VALID_ID.test(fileId)) {
    return NextResponse.json({ error: "Mã file không hợp lệ." }, { status: 400 });
  }

  const range = request.headers.get("range");

  let upstream: Response;
  try {
    upstream = await fetchWithRetry(fileId, range);
  } catch (err) {
    // fetch() rejects (connection reset, DNS blip) rather than returning a
    // status, so without this the request escapes as a 500 and the student sees
    // a player that silently never starts.
    console.error(`Không gọi được Drive cho file ${fileId}:`, err);
    return NextResponse.json({ error: "Không tải được file nghe." }, { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    console.error(`Drive trả ${upstream.status} cho file ${fileId}`);
    return NextResponse.json({ error: "Không tải được file nghe." }, { status: 502 });
  }

  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("audio/") && !type.startsWith("video/")) {
    // An HTML body here means Drive refused; surfacing it as audio would give
    // the student an undecodable stream and no explanation.
    console.error(`Drive trả content-type "${type}" cho file ${fileId}`);
    return NextResponse.json({ error: "File nghe không khả dụng." }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    // Recordings never change; let the browser and any CDN keep them.
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  for (const h of ["content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
