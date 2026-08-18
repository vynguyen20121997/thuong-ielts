import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Khách vãng lai — học sinh vào bằng link cô gửi, chỉ gõ tên.
 *
 * CỐ Ý KHÔNG tạo tài khoản. Tên chỉ nằm trong lượt làm bài; bảng `students`
 * vẫn chỉ chứa người đã đăng nhập thật. Cô gửi link giữa buổi dạy mà bắt cả
 * lớp lập tài khoản rồi khai tuổi/nghề/target là chặn đứng buổi học.
 *
 * `guestKey` trong cookie để em ấy tải lại trang vẫn là chính mình, chứ không
 * thành người thứ hai trên bảng lớp — và để luật "một link làm một lần" có gì
 * mà đối chiếu, vì khách không có tài khoản.
 */

const COOKIE_KHACH = "khach";
const SONG_NGAY = 60 * 60 * 24; // 1 ngày — đúng bằng lúc cron dọn khách

export interface Khach {
  key: string;
  ten: string;
}

export async function khachHienTai(): Promise<Khach | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_KHACH)?.value;
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { key?: string; ten?: string };
    if (!d.key || !d.ten) return null;
    return { key: d.key, ten: d.ten };
  } catch {
    return null;
  }
}

export async function datKhach(ten: string): Promise<Khach> {
  const khach: Khach = { key: crypto.randomUUID(), ten: ten.slice(0, 60) };
  const store = await cookies();
  store.set(COOKIE_KHACH, JSON.stringify(khach), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SONG_NGAY,
  });
  return khach;
}
