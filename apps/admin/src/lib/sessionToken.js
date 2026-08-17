import crypto from "crypto";

/**
 * Ký và đọc token phiên quản trị.
 *
 * Viết bằng JS thuần, và đó là chủ ý: `server.js` chạy thẳng bằng `node` nên
 * không import được TypeScript, mà nó lại phải xác thực đúng cái token này lúc
 * trình duyệt của cô bắt tay WebSocket. Hai bản cài đặt song song thì sẽ có
 * ngày một bên đổi cách ký còn bên kia thì không — và triệu chứng sẽ là
 * "socket tự nhiên không nối được", rất khó lần ra.
 *
 * `auth.ts` chỉ bọc lại file này để phần TypeScript có kiểu.
 */

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/*
  Token: "<expiresAtMs>:<teacherId>.<hmac>"

  `teacherId` nằm ngay trong token vì `proxy.ts` chạy ở edge runtime — không có
  `pg` ở đó, nên mỗi request không thể hỏi DB xem ai đang đăng nhập. Ký HMAC rồi
  thì nội dung token tin được mà không cần tra lại.

  Không nhét tên hay quyền vào đây: đổi tên trong trang quản trị xong, token cũ
  sẽ nói sai cho tới lần đăng nhập sau. Chỉ mang id — thứ không bao giờ đổi.
*/

/**
 * @param {string} teacherId
 * @returns {string}
 */
export function createSessionToken(teacherId) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}:${teacherId}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * @param {string | undefined | null} token
 * @returns {{ teacherId: string, expiresAt: number } | null}
 */
export function readSessionToken(token) {
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

/**
 * @param {string | undefined | null} token
 * @returns {boolean}
 */
export function isValidSessionToken(token) {
  return readSessionToken(token) !== null;
}

/**
 * Lấy cookie phiên từ header `Cookie` thô.
 *
 * Socket.IO đưa cho mình request HTTP nguyên bản lúc bắt tay, không có sẵn bộ
 * phân tích cookie như Next.
 *
 * @param {string | undefined} header
 * @returns {string | undefined}
 */
export function cookiePhien(header) {
  if (!header) return undefined;
  for (const phan of header.split(";")) {
    const dau = phan.indexOf("=");
    if (dau < 0) continue;
    if (phan.slice(0, dau).trim() === SESSION_COOKIE) {
      return decodeURIComponent(phan.slice(dau + 1).trim());
    }
  }
  return undefined;
}
