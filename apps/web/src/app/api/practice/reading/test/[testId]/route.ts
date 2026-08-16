import { NextResponse } from "next/server";

import { getReadingPaper } from "../../../../../../features/practice/server/readingRepository";

/**
 * Nội dung cả test, tải khi học sinh bấm bắt đầu chứ không nằm sẵn trong HTML
 * của màn chờ. Vẫn là public projection — `answer_key` không có trong đây.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const paper = await getReadingPaper(testId);

  if (!paper) {
    return NextResponse.json({ error: "Không tìm thấy test này." }, { status: 404 });
  }

  return NextResponse.json(paper);
}
