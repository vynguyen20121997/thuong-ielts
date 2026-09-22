import { NextResponse } from "next/server";

import { listTestimonials } from "../../../server/content";

/* Truy vấn nằm ở `server/content.ts` — trang `/ket-qua-hoc-vien` gọi đúng hàm
   này lúc render, nên SQL chỉ được có một bản. */
export async function GET() {
  try {
    return NextResponse.json(await listTestimonials());
  } catch (err) {
    console.error("GET /api/testimonials failed:", err);
    return NextResponse.json({ error: "Failed to load testimonials" }, { status: 500 });
  }
}
