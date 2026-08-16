import { createHash, randomInt } from "crypto";

import { pool } from "@thuong-ielts/db";

import { OTP_LENGTH, OTP_TTL_SECONDS, type OtpRecord } from "../domain/otp";

/**
 * Kho mã OTP. Một số điện thoại chỉ có một mã đang sống — xin mã mới thì mã cũ
 * bị đè, nên không có chuyện hai mã cùng dùng được.
 *
 * Mã lưu dạng băm. Đây không phải mật khẩu nên SHA-256 kèm secret là đủ và
 * nhanh; bcrypt cho một chuỗi 6 số sống 5 phút chỉ tổ làm chậm mỗi lần xác
 * thực. Có secret riêng để ai đọc trộm được DB cũng không dò ngược ra bằng
 * cách băm thử cả triệu số.
 */

function hashCode(code: string): string {
  const secret = process.env.OTP_HASH_SECRET ?? process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

/** `randomInt` là bộ sinh ngẫu nhiên mật mã, không phải `Math.random`. */
export function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export async function getOtp(phone: string): Promise<OtpRecord | null> {
  const { rows } = await pool.query<{
    code_hash: string;
    expires_at: Date;
    attempts: number;
    last_sent_at: Date;
  }>(
    `SELECT code_hash, expires_at, attempts, last_sent_at FROM phone_otps WHERE phone = $1`,
    [phone]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    attempts: row.attempts,
    lastSentAt: row.last_sent_at,
  };
}

export async function saveOtp(phone: string, code: string): Promise<void> {
  await pool.query(
    `INSERT INTO phone_otps (phone, code_hash, expires_at, attempts, last_sent_at)
     VALUES ($1, $2, now() + ($3 || ' seconds')::interval, 0, now())
     ON CONFLICT (phone) DO UPDATE
        SET code_hash    = EXCLUDED.code_hash,
            expires_at   = EXCLUDED.expires_at,
            attempts     = 0,
            last_sent_at = now()`,
    [phone, hashCode(code), String(OTP_TTL_SECONDS)]
  );
}

export function codeMatches(record: OtpRecord, code: string): boolean {
  return record.codeHash === hashCode(code);
}

/** Đếm một lần gõ sai. Hết số lần thì phải xin mã mới. */
export async function countFailedAttempt(phone: string): Promise<void> {
  await pool.query(`UPDATE phone_otps SET attempts = attempts + 1 WHERE phone = $1`, [phone]);
}

/** Dùng xong thì xoá, để cùng một mã không dùng lại được lần hai. */
export async function consumeOtp(phone: string): Promise<void> {
  await pool.query(`DELETE FROM phone_otps WHERE phone = $1`, [phone]);
}
