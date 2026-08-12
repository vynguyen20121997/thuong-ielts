import { NextResponse } from "next/server";
import { getSiteContent, DEFAULT_HERO_CONTENT } from "@thuong-ielts/db";

export async function GET() {
  try {
    const data = await getSiteContent("hero", DEFAULT_HERO_CONTENT);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/hero failed:", err);
    return NextResponse.json(DEFAULT_HERO_CONTENT);
  }
}
