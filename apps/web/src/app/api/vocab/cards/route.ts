import { NextResponse } from "next/server";

import { currentStudent } from "../../../../features/account/server/guard";
import {
  addCard,
  deleteCard,
  getDeck,
  listCards,
} from "../../../../features/vocab/server/vocabRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: Request) {
  const deckId = new URL(request.url).searchParams.get("deck");
  if (!deckId)
    return NextResponse.json({ error: "Thiếu mã bộ thẻ." }, { status: 400 });
  return NextResponse.json(
    { cards: await listCards(deckId) },
    { headers: noStore },
  );
}

/**
 * Thêm thẻ. Chỉ người tạo bộ mới thêm được — thiếu chốt này thì ai biết mã bộ
 * cũng nhét thẻ vào bộ của người khác, kể cả bộ chính thức của cô.
 */
export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const deckId = typeof body?.deckId === "string" ? body.deckId : "";
  const deck = deckId ? await getDeck(deckId) : null;
  if (!deck)
    return NextResponse.json(
      { error: "Không tìm thấy bộ thẻ." },
      { status: 404 },
    );
  if (deck.creatorId !== student.id)
    return NextResponse.json(
      { error: "Bộ thẻ này không phải của bạn." },
      { status: 403 },
    );

  const word =
    typeof body?.word === "string" ? body.word.trim().slice(0, 80) : "";
  if (!word) return NextResponse.json({ error: "Thiếu từ." }, { status: 400 });

  const examples = Array.isArray(body?.examples)
    ? body.examples.filter((e: unknown) => typeof e === "string").slice(0, 5)
    : [];

  const card = await addCard(deckId, {
    word,
    ipa: typeof body?.ipa === "string" ? body.ipa.slice(0, 120) : "",
    vietnamese:
      typeof body?.vietnamese === "string" ? body.vietnamese.slice(0, 300) : "",
    examples,
    audioUrl:
      typeof body?.audioUrl === "string"
        ? body.audioUrl.slice(0, 500)
        : undefined,
  });
  return NextResponse.json({ card }, { headers: noStore });
}

export async function DELETE(request: Request) {
  const student = await currentStudent();
  if (!student)
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const cardId = new URL(request.url).searchParams.get("card");
  const deckId = new URL(request.url).searchParams.get("deck");
  if (!cardId || !deckId)
    return NextResponse.json({ error: "Thiếu mã thẻ." }, { status: 400 });

  const deck = await getDeck(deckId);
  if (!deck || deck.creatorId !== student.id)
    return NextResponse.json(
      { error: "Bộ thẻ này không phải của bạn." },
      { status: 403 },
    );

  await deleteCard(cardId);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
