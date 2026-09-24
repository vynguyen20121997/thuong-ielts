import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";
import { studentStats } from "../../../../features/vocab/server/vocabRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  return NextResponse.json(
    { stats: await studentStats(student.id) },
    { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
  );
}
