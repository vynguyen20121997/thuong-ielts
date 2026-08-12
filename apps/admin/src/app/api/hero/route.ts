import { NextRequest, NextResponse } from "next/server";
import { getSiteContent, setSiteContent, DEFAULT_HERO_CONTENT, HeroContent } from "@thuong-ielts/db";

export async function GET() {
  try {
    const data = await getSiteContent("hero", DEFAULT_HERO_CONTENT);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/hero failed:", err);
    return NextResponse.json({ error: "Failed to load hero content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const data: HeroContent = {
    portraitUrl: body.portraitUrl ?? DEFAULT_HERO_CONTENT.portraitUrl,
    titleLine1: body.titleLine1 ?? DEFAULT_HERO_CONTENT.titleLine1,
    titleLine2: body.titleLine2 ?? DEFAULT_HERO_CONTENT.titleLine2,
    quote: body.quote ?? DEFAULT_HERO_CONTENT.quote,
    bio: body.bio ?? DEFAULT_HERO_CONTENT.bio,
    closingLine: body.closingLine ?? DEFAULT_HERO_CONTENT.closingLine,
  };

  try {
    await setSiteContent("hero", data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/hero failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
