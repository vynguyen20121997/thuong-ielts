import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";
import {
  createDeck,
  listStudentDecks,
} from "../../../../features/vocab/server/vocabRepository";

/*
  Bộ thẻ của người đang đăng nhập.

  Khác bản gốc: bản gốc nhận `x-user-id` từ header do CLIENT gửi — ai cũng đổi
  được thành id người khác rồi xem và sửa thẻ của họ. Ở đây danh tính lấy từ
  phiên Auth.js phía server, client không nói được mình là ai.
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET() {
  const student = await currentStudent();
  if (!student) return NextResponse.json({ decks: [] }, { headers: noStore });
  return NextResponse.json(
    { decks: await listStudentDecks(student.id) },
    { headers: noStore },
  );
}

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
  if (!name)
    return NextResponse.json({ error: "Thiếu tên bộ thẻ." }, { status: 400 });

  /*
    Học sinh chỉ tạo được bộ `personal`. Bộ `official` là bộ của cô và phải đi
    qua trang quản trị — nhận `type` từ client là cho ai cũng tự phong bộ của
    mình thành bộ chính thức rồi giao cho cả lớp.
  */
  const deck = await createDeck({
    name,
    description:
      typeof body?.description === "string"
        ? body.description.slice(0, 400)
        : "",
    topic: typeof body?.topic === "string" ? body.topic.slice(0, 60) : "",
    type: "personal",
    creatorId: student.id,
  });
  return NextResponse.json({ deck }, { headers: noStore });
}
