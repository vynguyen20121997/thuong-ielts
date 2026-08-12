import { NextRequest, NextResponse } from "next/server";
import { getSiteContent, setSiteContent, FeaturedContent } from "@thuong-ielts/db";

export async function GET() {
  try {
    const data = await getSiteContent("featured", []);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/hero failed:", err);
    return NextResponse.json({ error: "Failed to load hero content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const data: FeaturedContent = {
    testimonialIds: body.testimonialIds || [],
    feedbackIds: body.feedbackIds || []
  };

  try {
    await setSiteContent("hero", data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/hero failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
