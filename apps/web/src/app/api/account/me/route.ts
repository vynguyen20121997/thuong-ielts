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
 *
 * ## Câu trả lời này KHÔNG được cache, ở bất cứ tầng nào
 *
 * Trước đây route trả về không kèm header cache nào. Hai hậu quả, đã đo bằng
 * `curl -D -`: không có `Cache-Control` thì trình duyệt được phép tự đoán hạn
 * dùng, nên bản `{"student":null}` xin lúc chưa đăng nhập còn nằm đó — đăng
 * nhập xong quay lại, header vẫn vẽ như người lạ cho tới khi bấm tải lại cứng.
 * Nặng hơn: `Vary` không có `Cookie`, nên bất kỳ cache dùng chung nào (CDN,
 * proxy công ty) cũng có quyền đưa tên học viên này cho máy học viên khác.
 *
 * `force-dynamic` là lớp chặn thứ hai: `auth()` có đọc cookie nên Next vốn đã
 * coi đây là động, nhưng nói thẳng ra thì ai đổi ruột hàm sau này cũng không
 * vô tình biến nó thành route dựng sẵn lúc build.
 */
export const dynamic = "force-dynamic";

/** Dữ liệu riêng từng người: không lưu ở đâu hết, và đổi theo cookie. */
const RIENG_TU = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
};

export async function GET() {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ student: null }, { headers: RIENG_TU });

  return NextResponse.json(
    {
      student: {
        name: student.name ?? null,
        avatarUrl: student.avatarUrl ?? null,
        targetBand: student.profile?.targetBand ?? null,
      },
    },
    { headers: RIENG_TU },
  );
}
