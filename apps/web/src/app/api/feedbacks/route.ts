import { NextResponse } from "next/server";

import { listFeedbacks } from "../../../server/content";

/* Truy vấn nằm ở `server/content.ts` — trang `/cam-nhan-hoc-vien` gọi đúng hàm
   này lúc render, nên SQL chỉ được có một bản. */
export async function GET() {
  try {
    return NextResponse.json(await listFeedbacks());
  } catch (err) {
    console.error("GET /api/feedbacks failed:", err);
    return NextResponse.json({ error: "Failed to load feedbacks" }, { status: 500 });
  }
}
