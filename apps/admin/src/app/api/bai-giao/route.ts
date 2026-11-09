import { NextResponse } from "next/server";

import { LoiGiao, giaoBai } from "../../../lib/giaoBai";
import { teacherHienTai } from "../../../lib/phien";

/** Tạo một bài giao. Luật nằm ở `lib/giaoBai.ts`, dùng chung với MCP. */
export async function POST(request: Request) {
  const teacherId = await teacherHienTai();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  try {
    const { id, token } = await giaoBai(teacherId, body);
    return NextResponse.json({ id, token });
  } catch (err) {
    if (err instanceof LoiGiao) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
