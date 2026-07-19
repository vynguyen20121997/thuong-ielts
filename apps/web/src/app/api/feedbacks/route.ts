import { NextResponse } from "next/server";
import { pool, toDisplayDate } from "@thuong-ielts/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, subject, image_url, date, is_class_summary
       FROM feedbacks
       ORDER BY date DESC NULLS LAST`
    );

    const data = rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      imageUrl: r.image_url ?? "",
      date: toDisplayDate(r.date),
      isClassSummary: r.is_class_summary ?? false,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/feedbacks failed:", err);
    return NextResponse.json({ error: "Failed to load feedbacks" }, { status: 500 });
  }
}
