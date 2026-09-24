import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";
import { cardGenerator } from "../../../../features/vocab/infrastructure";

/**
 * Sinh phiên âm / nghĩa / ví dụ cho một danh sách từ.
 *
 * Hôm nay bộ sinh chưa nối (xem `features/vocab/application/ports.ts`): model
 * TypeSafe đang dùng chỉ trả lời câu hỏi có sẵn lựa chọn, không sinh được văn
 * bản tự do. Route vẫn tồn tại và trả `available: false` để giao diện nói
 * thẳng điều đó, thay vì im lặng như hỏng.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const words = Array.isArray(body?.words)
    ? body.words
        .filter((w: unknown) => typeof w === "string" && w.trim())
        .slice(0, 50)
    : [];

  if (!words.length)
    return NextResponse.json({ error: "Chưa có từ nào." }, { status: 400 });

  return NextResponse.json(
    {
      available: cardGenerator.available(),
      cards: await cardGenerator.generate(words),
    },
    { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
  );
}
