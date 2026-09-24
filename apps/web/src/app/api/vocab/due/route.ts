import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";
import { listDueCards } from "../../../../features/vocab/server/vocabRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const deckId = new URL(request.url).searchParams.get("deck") ?? undefined;
  return NextResponse.json(
    { cards: await listDueCards(student.id, deckId) },
    { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
  );
}
