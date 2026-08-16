import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";

/**
 * Ai đang đăng nhập, đủ để vẽ chip tài khoản trên header.
 *
 * Header hỏi qua route này thay vì đọc phiên ngay trong layout: `auth()` phải
 * đọc cookie, mà đọc cookie trong layout là ép MỌI trang thành dynamic — kể cả
 * trang giới thiệu vốn không cần biết ai đang xem.
 *
 * Cũng không nhét tên và band vào JWT: sửa hồ sơ xong là token cũ nói sai cho
 * tới lần đăng nhập sau. Hỏi DB một câu theo khoá chính thì luôn đúng.
 */
export async function GET() {
  const student = await currentStudent();
  if (!student) return NextResponse.json({ student: null });

  return NextResponse.json({
    student: {
      name: student.name ?? null,
      avatarUrl: student.avatarUrl ?? null,
      targetBand: student.profile?.targetBand ?? null,
    },
  });
}
