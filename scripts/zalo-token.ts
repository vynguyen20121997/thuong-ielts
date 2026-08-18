/**
 * Lấy refresh token của Zalo OA — chạy MỘT LẦN, rồi quên đi.
 *
 * Vì sao cần script: Zalo bắt đi qua OAuth có PKCE để đổi lấy token, mà làm
 * tay thì phải tự sinh code_verifier, băm SHA-256, chép URL, rồi dán `code`
 * vào một lệnh curl dài — sai một ký tự là mã lỗi khó hiểu. Script làm hộ.
 *
 * Sau khi lấy được, token cất vào bảng `site_content` chứ không vào biến môi
 * trường: **Zalo đổi refresh token sau mỗi lần làm mới**, nên biến môi trường
 * sẽ lỗi thời sau đúng một giờ. Server đọc từ DB, tự làm mới, tự ghi lại.
 *
 * Chạy hai bước:
 *
 *   npx tsx scripts/zalo-token.ts             -> in ra đường link để bấm
 *   npx tsx scripts/zalo-token.ts <code>      -> đổi code lấy token, lưu vào DB
 *
 * Giữa hai bước, đừng chạy lệnh khác trong cùng cửa sổ: `code_verifier` được
 * ghi tạm ra file để bước hai đọc lại.
 */
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

const APP_ID = process.env.ZALO_OA_APP_ID;
const SECRET = process.env.ZALO_OA_SECRET_KEY;
// Phải trùng ĐÚNG cái đã khai trong ứng dụng Zalo, kể cả dấu / ở cuối.
const REDIRECT = process.env.ZALO_OA_REDIRECT_URI ?? "https://thuong-ielts.onrender.com/";

const NOI_GIU = path.join(os.tmpdir(), "zalo-code-verifier.txt");
const TOKEN_KEY = "zalo_oa_token";

function thieuBien(): boolean {
  if (APP_ID && SECRET) return false;
  console.error(
    "Thiếu ZALO_OA_APP_ID hoặc ZALO_OA_SECRET_KEY trong apps/web/.env.local.\n" +
      "Lấy ở developers.zalo.me > ứng dụng của bạn > Thông tin ứng dụng."
  );
  return true;
}

/** PKCE: code_challenge = base64url(sha256(code_verifier)). */
function taoPkce() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function buocMot() {
  const { verifier, challenge } = taoPkce();
  fs.writeFileSync(NOI_GIU, verifier, "utf-8");

  const url =
    "https://oauth.zaloapp.com/v4/oa/permission?" +
    new URLSearchParams({
      app_id: APP_ID!,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      state: "thuong-ielts",
    });

  console.log("\n1. Mở link này bằng tài khoản QUẢN TRỊ của Official Account:\n");
  console.log("   " + url + "\n");
  console.log("2. Bấm Cho phép. Trình duyệt sẽ nhảy về:");
  console.log(`   ${REDIRECT}?code=XXXXX&state=thuong-ielts`);
  console.log("   (trang đó có thể báo lỗi 404 — không sao, mình chỉ cần đoạn code trên URL)\n");
  console.log("3. Chép đoạn sau `code=` rồi chạy:\n");
  console.log("   npx tsx scripts/zalo-token.ts <code>\n");
  console.log(`   (code_verifier đã cất tạm ở ${NOI_GIU})`);
}

async function buocHai(code: string) {
  if (!fs.existsSync(NOI_GIU)) {
    console.error(
      "Không tìm thấy code_verifier. Chạy lại bước một (không kèm code) rồi lấy link mới."
    );
    process.exit(1);
  }
  const verifier = fs.readFileSync(NOI_GIU, "utf-8").trim();

  const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: SECRET!,
    },
    body: new URLSearchParams({
      code,
      app_id: APP_ID!,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });

  const payload = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: string;
    error?: number;
    error_description?: string;
    error_name?: string;
  };

  if (!payload.access_token || !payload.refresh_token) {
    console.error("Zalo từ chối:", JSON.stringify(payload, null, 2));
    console.error(
      "\nHay gặp nhất: `code` chỉ dùng được MỘT LẦN và hết hạn sau ít phút — " +
        "lấy link mới rồi làm lại. Hoặc redirect_uri khai trong ứng dụng Zalo " +
        `khác với "${REDIRECT}".`
    );
    process.exit(1);
  }

  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
  });

  await pool.query(
    `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [
      TOKEN_KEY,
      {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiresAt: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
      },
    ]
  );
  await pool.end();
  fs.unlinkSync(NOI_GIU);

  console.log("Xong. Token đã lưu vào DB (site_content/zalo_oa_token).");
  console.log("Từ giờ server tự làm mới, không phải đụng lại.");
  console.log("\nThử gửi một tin:  npx tsx scripts/zalo-test.ts 0912345678");
}

async function main() {
  if (thieuBien()) process.exit(1);
  const code = process.argv[2];
  if (!code) {
    buocMot();
    return;
  }
  await buocHai(code);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
