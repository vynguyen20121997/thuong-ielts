import { NextResponse } from "next/server";
import { pool, toDisplayDate } from "@thuong-ielts/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, subject,
              COALESCE(
                (SELECT array_agg('/api/media/' || fma.media_id::text ORDER BY fma.position)
                 FROM feedback_media_assets fma
                 WHERE fma.feedback_id = feedbacks.id),
                CASE WHEN image_url IS NOT NULL AND image_url <> '' THEN ARRAY[image_url] ELSE ARRAY[]::text[] END
              ) AS image_urls,
              date, is_class_summary
       FROM feedbacks
       ORDER BY date DESC NULLS LAST`
    );

    const data = rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      imageUrl: r.image_urls?.[0] ?? "",
      imageUrls: r.image_urls ?? [],
      date: toDisplayDate(r.date),
      isClassSummary: r.is_class_summary ?? false,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/feedbacks failed:", err);
    return NextResponse.json({ error: "Failed to load feedbacks" }, { status: 500 });
  }
}
