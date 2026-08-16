/**
 * Luật của mã OTP — thuần, không I/O.
 *
 * Tách khỏi chỗ gửi và chỗ lưu để đọc được thành lời: mã sống bao lâu, gõ sai
 * mấy lần thì khoá, bao lâu mới cho gửi lại. Ba con số đó là thứ quyết định
 * vừa an toàn vừa không đốt tiền tin nhắn, nên để ở một chỗ nhìn thấy được.
 */

export const OTP_LENGTH = 6;

/** Đủ để đọc tin Zalo rồi gõ lại, chưa đủ để dò. */
export const OTP_TTL_SECONDS = 5 * 60;

/** Gõ sai quá số này thì phải xin mã mới. */
export const OTP_MAX_ATTEMPTS = 5;

/** Chặn bấm "gửi lại" liên tục — mỗi tin ZNS đều mất tiền. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export interface OtpRecord {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
}

export type OtpCheck =
  | { ok: true }
  | { ok: false; reason: "expired" | "too-many-attempts" | "wrong-code" | "not-requested" };

/** Còn trong thời hạn và chưa vượt số lần gõ sai không. */
export function checkOtp(record: OtpRecord | null, matches: boolean, now: Date): OtpCheck {
  if (!record) return { ok: false, reason: "not-requested" };
  if (record.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "too-many-attempts" };
  if (record.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  if (!matches) return { ok: false, reason: "wrong-code" };
  return { ok: true };
}

/** Còn phải chờ bao nhiêu giây nữa mới được gửi lại; 0 là gửi được ngay. */
export function resendWaitSeconds(record: OtpRecord | null, now: Date): number {
  if (!record) return 0;
  const elapsed = (now.getTime() - record.lastSentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
}

export const OTP_ERROR_MESSAGES: Record<Exclude<OtpCheck, { ok: true }>["reason"], string> = {
  expired: "Mã đã hết hạn. Bấm gửi lại để nhận mã mới.",
  "too-many-attempts": "Sai quá nhiều lần. Bấm gửi lại để nhận mã mới.",
  "wrong-code": "Mã không đúng. Kiểm tra lại tin nhắn Zalo.",
  "not-requested": "Chưa có mã nào cho số này. Bấm gửi mã trước.",
};
