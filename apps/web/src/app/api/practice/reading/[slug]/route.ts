import { NextResponse } from "next/server";

import { deRiengMoDuoc, getReadingTestBySlug } from "../../../../../features/practice/server/readingRepository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get("bai");
  const test = await getReadingTestBySlug(slug, await deRiengMoDuoc(slug, token));

  if (!test) {
    return NextResponse.json({ error: "Không tìm thấy đề đọc này." }, { status: 404 });
  }

  // `test` comes from the repository's public projection, which never touches
  // the answer_key column — so there is nothing to strip here.
  return NextResponse.json(test);
}
