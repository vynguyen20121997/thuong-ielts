import { cookies } from "next/headers";

import { SESSION_COOKIE, readSessionToken } from "./auth";

/**
 * Ai đang đăng nhập trang quản trị.
 *
 * `proxy.ts` đã chặn mọi đường vào khu vực này, nên tới đây thì chắc chắn có
 * phiên hợp lệ. Hàm này chỉ để lấy `teacherId` ra dùng — thứ mà `assignments`
 * và luật lọc kho đề riêng đều cần trỏ tới.
 *
 * Ném lỗi thay vì trả `null`: nếu tới được đây mà không có phiên thì proxy đã
 * hỏng, và im lặng bỏ qua chuyện đó là cách tốt nhất để dữ liệu lẫn giữa các
 * giáo viên sau này.
 */
export async function teacherHienTai(): Promise<string> {
  const store = await cookies();
  const phien = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!phien) throw new Error("Không có phiên quản trị — proxy lẽ ra phải chặn từ trước.");
  return phien.teacherId;
}
