import { NextResponse } from "next/server";

import { getListeningTestBySlug } from "../../../../../features/practice/server/listeningRepository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const test = await getListeningTestBySlug(slug);
  if (!test) {
    return NextResponse.json({ error: "Không tìm thấy đề nghe này." }, { status: 404 });
  }
  // Public projection — the answer_key column is never selected.
  return NextResponse.json(test);
}
