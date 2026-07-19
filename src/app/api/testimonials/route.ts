import { NextResponse } from "next/server";
import { pool, toDisplayDate } from "../../../lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, student_name, score, before_score, after_score, school_or_job,
              course_id, course_name, comment, avatar_url, proof_urls,
              listening, reading, writing, speaking, rating, helpful_count, date
       FROM testimonials
       ORDER BY date DESC NULLS LAST`
    );

    const data = rows.map((r) => ({
      id: r.id,
      studentName: r.student_name,
      score: r.score,
      beforeScore: r.before_score ?? undefined,
      afterScore: r.after_score ?? undefined,
      schoolOrJob: r.school_or_job ?? "",
      courseId: r.course_id ?? "",
      courseName: r.course_name ?? "",
      comment: r.comment ?? undefined,
      avatarUrl: r.avatar_url ?? "",
      proofUrl: r.proof_urls?.length ? r.proof_urls : undefined,
      date: toDisplayDate(r.date),
      rating: r.rating ?? 0,
      helpfulCount: r.helpful_count ?? 0,
      subScores:
        r.listening && r.reading && r.writing && r.speaking
          ? { listening: r.listening, reading: r.reading, writing: r.writing, speaking: r.speaking }
          : undefined,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/testimonials failed:", err);
    return NextResponse.json({ error: "Failed to load testimonials" }, { status: 500 });
  }
}
