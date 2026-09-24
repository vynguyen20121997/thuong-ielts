import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";
import { rateCard } from "../../../../features/vocab/server/vocabRepository";
import type { Rating } from "../../../../features/vocab/domain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const cardId = typeof body?.cardId === "string" ? body.cardId : "";
  const rating = body?.rating as Rating;
  if (!cardId || !RATINGS.includes(rating))
    return NextResponse.json(
      { error: "Thiếu cardId hoặc mức chấm." },
      { status: 400 },
    );

  const review = await rateCard(student.id, cardId, rating);
  return NextResponse.json(
    { review },
    { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
  );
}
