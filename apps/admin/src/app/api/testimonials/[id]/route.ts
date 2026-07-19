import { NextRequest, NextResponse } from "next/server";
import { pool } from "@thuong-ielts/db";

const FIELDS: Record<string, string> = {
  studentName: "student_name",
  score: "score",
  beforeScore: "before_score",
  afterScore: "after_score",
  schoolOrJob: "school_or_job",
  courseId: "course_id",
  courseName: "course_name",
  comment: "comment",
  avatarUrl: "avatar_url",
  proofUrl: "proof_urls",
  listening: "listening",
  reading: "reading",
  writing: "writing",
  speaking: "speaking",
  rating: "rating",
  helpfulCount: "helpful_count",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(FIELDS)) {
    if (key in body) {
      sets.push(`${column} = $${i}`);
      values.push(body[key]);
      i++;
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE testimonials SET ${sets.join(", ")} WHERE id = $${i} RETURNING id`,
      values
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/testimonials/[id] failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await pool.query(`DELETE FROM testimonials WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/testimonials/[id] failed:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
