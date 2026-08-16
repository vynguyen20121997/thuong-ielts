import { pool } from "@thuong-ielts/db";

/**
 * Gửi mã OTP qua Zalo ZNS (Zalo Notification Service).
 *
 * Vì sao Zalo chứ không phải SMS: ở Việt Nam gần như ai cũng có Zalo, mỗi tin
 * ZNS rẻ hơn SMS, và không phải đăng ký brandname SMS — thủ tục mất vài ngày.
 *
 * Ba thứ phải có trong biến môi trường, lấy từ Zalo Official Account:
 *   ZALO_OA_APP_ID, ZALO_OA_SECRET_KEY  — của ứng dụng Zalo
 *   ZALO_ZNS_TEMPLATE_ID                — mẫu tin OTP đã được Zalo duyệt
 *   ZALO_OA_REFRESH_TOKEN               — token dài hạn, đổi lấy access token
 *
 * Access token của Zalo chỉ sống 1 giờ và **refresh token đổi mới sau mỗi lần
 * làm mới** — dùng lại token cũ là hỏng. Nên cả hai được cất vào bảng
 * `site_content` (key/value JSONB có sẵn) chứ không giữ trong biến môi trường
 * hay trong RAM: server chạy nhiều tiến trình, và deploy lại thì RAM mất.
 */

const TOKEN_KEY = "zalo_oa_token";
const TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const ZNS_URL = "https://business.openapi.zalo.me/message/template";

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  /** Mốc hết hạn dạng epoch ms. */
  expiresAt: number;
}

export class ZaloNotConfiguredError extends Error {
  constructor() {
    super("Chưa cấu hình Zalo OA — thiếu biến môi trường.");
    this.name = "ZaloNotConfiguredError";
  }
}

export function isZaloConfigured(): boolean {
  return Boolean(
    process.env.ZALO_OA_APP_ID &&
      process.env.ZALO_OA_SECRET_KEY &&
      process.env.ZALO_ZNS_TEMPLATE_ID &&
      (process.env.ZALO_OA_REFRESH_TOKEN || true)
  );
}

async function readStoredToken(): Promise<StoredToken | null> {
  const { rows } = await pool.query<{ data: StoredToken }>(
    `SELECT data FROM site_content WHERE key = $1`,
    [TOKEN_KEY]
  );
  return rows[0]?.data ?? null;
}

async function writeStoredToken(token: StoredToken): Promise<void> {
  await pool.query(
    `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [TOKEN_KEY, token]
  );
}

/**
 * Lấy access token còn hạn. Làm mới trước khi hết hạn 5 phút, và ghi lại
 * refresh token mới ngay — Zalo chỉ cho dùng mỗi refresh token một lần.
 */
async function getAccessToken(): Promise<string> {
  const stored = await readStoredToken();
  if (stored && stored.expiresAt > Date.now() + 5 * 60 * 1000) {
    return stored.accessToken;
  }

  const refreshToken = stored?.refreshToken ?? process.env.ZALO_OA_REFRESH_TOKEN;
  if (!refreshToken || !process.env.ZALO_OA_APP_ID || !process.env.ZALO_OA_SECRET_KEY) {
    throw new ZaloNotConfiguredError();
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: process.env.ZALO_OA_SECRET_KEY,
    },
    body: new URLSearchParams({
      app_id: process.env.ZALO_OA_APP_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const payload = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: string;
    error?: number;
    error_description?: string;
  };

  if (!res.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(
      `Zalo từ chối làm mới token: ${payload.error_description ?? payload.error ?? res.status}`
    );
  }

  const next: StoredToken = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
  };
  await writeStoredToken(next);
  return next.accessToken;
}

/**
 * Gửi mã. ZNS nhận số dạng "84…" (không dấu cộng), còn trong DB mình giữ E.164
 * — đổi ngay ở đây để phần còn lại của hệ thống chỉ biết một dạng.
 */
export async function sendOtpViaZalo(phoneE164: string, code: string): Promise<void> {
  const templateId = process.env.ZALO_ZNS_TEMPLATE_ID;
  if (!templateId) throw new ZaloNotConfiguredError();

  const accessToken = await getAccessToken();

  const res = await fetch(ZNS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: accessToken },
    body: JSON.stringify({
      phone: phoneE164.replace(/^\+/, ""),
      template_id: templateId,
      template_data: { otp: code },
    }),
  });

  const payload = (await res.json()) as { error?: number; message?: string };
  // ZNS trả HTTP 200 kèm error != 0 khi hỏng, nên phải xem thân tin nhắn chứ
  // không chỉ nhìn mã HTTP.
  if (!res.ok || (payload.error !== undefined && payload.error !== 0)) {
    throw new Error(`Zalo không gửi được mã: ${payload.message ?? payload.error ?? res.status}`);
  }
}
