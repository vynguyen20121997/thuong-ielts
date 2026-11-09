import { NextResponse } from "next/server";

import { taoToken, thuHoiToken } from "../../../lib/apiToken";
import { teacherHienTai } from "../../../lib/phien";

/** Token cho AI agent: POST tạo (trả token MỘT lần), DELETE thu hồi. Cần phiên của cô. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const teacherId = await teacherHienTai();
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const kq = await taoToken(teacherId, typeof body.name === "string" ? body.name : "");
  return NextResponse.json(kq);
}

export async function DELETE(request: Request) {
  const teacherId = await teacherHienTai();
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof body.id !== "string") return NextResponse.json({ error: "Thiếu id." }, { status: 400 });
  await thuHoiToken(teacherId, body.id);
  return NextResponse.json({ ok: true });
}
