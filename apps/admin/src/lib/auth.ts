/**
 * Bọc lại `sessionToken.js` cho phần TypeScript.
 *
 * Bản cài đặt thật nằm ở file JS bên cạnh, không phải ở đây: `server.js` chạy
 * thẳng bằng `node` nên không import được TypeScript, mà nó lại phải xác thực
 * đúng cái token này lúc trình duyệt của cô bắt tay WebSocket. Một bản cài đặt
 * cho cả hai, để không có ngày một bên đổi cách ký còn bên kia thì không.
 */
export {
  SESSION_COOKIE,
  createSessionToken,
  readSessionToken,
  isValidSessionToken,
  cookiePhien,
} from "./sessionToken.js";

export interface AdminSession {
  teacherId: string;
  expiresAt: number;
}
