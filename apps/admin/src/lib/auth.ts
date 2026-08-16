import crypto from "crypto";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface AdminSession {
  teacherId: string;
  expiresAt: number;
}

/*
  Token: "<expiresAtMs>:<teacherId>.<hmac>"

  `teacherId` nằm ngay trong token vì `proxy.ts` chạy ở edge runtime — không có
  `pg` ở đó, nên mỗi request không thể hỏi DB xem ai đang đăng nhập. Ký HMAC rồi
  thì nội dung token tin được mà không cần tra lại.

  Không nhét tên hay quyền vào đây: đổi tên trong trang quản trị xong, token cũ
  sẽ nói sai cho tới lần đăng nhập sau. Chỉ mang id — thứ không bao giờ đổi.
*/

export function createSessionToken(teacherId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}:${teacherId}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;

  // Cắt ở dấu chấm CUỐI: chữ ký là hex nên không chứa dấu chấm, còn id thì
  // không hứa gì cả. Dùng split(".") ở đây là một cái bẫy chờ sẵn.
  const cut = token.lastIndexOf(".");
  if (cut <= 0) return null;

  const payload = token.slice(0, cut);
  const signature = token.slice(cut + 1);

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  // Token cũ chỉ có "<expiresAtMs>", không có id giáo viên. Coi như không hợp
  // lệ để phiên cũ phải đăng nhập lại một lần — rẻ hơn nhiều so với việc mang
  // theo một nhánh "không biết ai" đi khắp phần còn lại của trang.
  const sep = payload.indexOf(":");
  if (sep <= 0) return null;

  const expiresAt = Number(payload.slice(0, sep));
  const teacherId = payload.slice(sep + 1);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;
  if (!teacherId) return null;

  return { teacherId, expiresAt };
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  return readSessionToken(token) !== null;
}

export { SESSION_COOKIE };
