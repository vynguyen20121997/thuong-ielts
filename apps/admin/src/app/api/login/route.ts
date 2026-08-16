import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, createSessionToken } from "../../../lib/auth";
import { findTeacherByUsername, hasAnyTeacher, touchLastLogin } from "../../../lib/teachers";

/**
 * Đăng nhập trang quản trị.
 *
 * Danh tính giờ nằm ở bảng `teachers` chứ không ở biến môi trường — phiên phải
 * biết được ai đang đăng nhập thì `assignments.teacher_id` và luật lọc kho đề
 * riêng mới có thứ để trỏ tới.
 *
 * Vẫn giữ một đường lui: bảng còn trống thì cho đăng nhập bằng ADMIN_USERNAME +
 * ADMIN_PASSWORD_HASH như cũ. Bảng trống chỉ có nghĩa là chưa chạy
 * `npm run migrate` sau lần deploy này; khoá cô ra khỏi trang quản trị của
 * chính mình vì một bước migrate còn thiếu thì quá đắt. Có một dòng giáo viên
 * rồi là đường lui đóng lại, DB thành nguồn duy nhất.
 */

/** Không nói sai tài khoản hay sai mật khẩu — nói thế là chỉ chỗ cho người dò. */
const SAI = "Sai tài khoản hoặc mật khẩu";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const teacher = await findTeacherByUsername(String(username ?? ""));

  if (teacher) {
    if (!(await bcrypt.compare(String(password ?? ""), teacher.passwordHash))) {
      return NextResponse.json({ error: SAI }, { status: 401 });
    }
    await touchLastLogin(teacher.id);
    return dungPhien(teacher.id);
  }

  // Không tìm thấy trong DB. Nếu bảng đã có người thì đây đúng là sai tài khoản.
  if (await hasAnyTeacher()) {
    return NextResponse.json({ error: SAI }, { status: 401 });
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !passwordHash) {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 500 });
  }

  if (username !== expectedUsername || !(await bcrypt.compare(password ?? "", passwordHash))) {
    return NextResponse.json({ error: SAI }, { status: 401 });
  }

  console.warn(
    "Đăng nhập bằng biến môi trường vì bảng `teachers` còn trống. " +
      "Chạy `npm run migrate` để chuyển tài khoản này vào DB."
  );
  // Id tạm, đúng bằng id mà `seedFirstTeacher` sẽ dùng — nhờ vậy sau khi chạy
  // migrate thì phiên đang mở vẫn trỏ đúng người, không phải đăng nhập lại.
  return dungPhien("teacher-thuong");
}

function dungPhien(teacherId: string) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(teacherId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
