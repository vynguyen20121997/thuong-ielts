import { NextResponse } from "next/server";
import { pool } from "@thuong-ielts/db";

import { teacherHienTai } from "../../../../lib/phien";

/**
 * Bài làm chi tiết của một em: từng câu, em gõ gì, đáp án đúng là gì.
 *
 * ĐÂY LÀ ĐƯỜNG DUY NHẤT trong cả dự án mà `answer_key` đi ra khỏi server, và
 * nó nằm sau `proxy.ts` của trang quản trị. Ba điều phải giữ:
 *
 * 1. Route này thuộc app `admin`. Đừng bao giờ chép sang `web` — trang học
 *    sinh gọi được là lộ sạch đáp án của cả bộ đề.
 * 2. Chỉ nạp khi cô bấm mở một em, không đi kèm dữ liệu bảng lớp. Bảng lớp
 *    cập nhật mỗi 5 giây, mà đáp án thì không đổi.
 * 3. `teacherHienTai()` gọi ở đầu — có phiên quản trị mới đi tiếp.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await teacherHienTai();

  const { rows } = await pool.query(
    `SELECT a.skill, a.scope, a.target, a.title, a.status, a.total, a.correct, a.band,
            COALESCE(s.name, a.guest_name, 'Học viên') AS ten,
            (a.student_id IS NULL) AS khach,
            -- Đang làm thì bài nằm ở attempt_progress; nộp rồi thì ở attempts.
            CASE WHEN a.status = 'submitted' THEN a.answers ELSE COALESCE(p.answers, '{}'::jsonb) END AS answers
       FROM attempts a
       LEFT JOIN students s         ON s.id = a.student_id
       LEFT JOIN attempt_progress p ON p.attempt_id = a.id
      WHERE a.id = $1
      LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const luot = rows[0];

  // Câu hỏi + đáp án của đúng đề em ấy làm.
  const bang = luot.skill === "listening" ? "listening_tests" : "reading_tests";
  const dieuKien =
    luot.skill === "reading" && luot.scope === "test" ? "slug LIKE $1" : "slug = $1";
  const thamSo =
    luot.skill === "reading" && luot.scope === "test" ? `${luot.target}-%` : luot.target;

  const { rows: de } = await pool.query(
    `SELECT questions, answer_key FROM ${bang} WHERE ${dieuKien}
      ORDER BY COALESCE((questions -> 0 ->> 'number')::int, 999), slug`,
    [thamSo]
  );

  const questions = de.flatMap((r) => r.questions ?? []);
  const key = new Map<string, { answer: string; acceptable?: string[] }>(
    de.flatMap((r) => r.answer_key ?? []).map((e: { questionId: string }) => [e.questionId, e as never])
  );

  const answers = (luot.answers ?? {}) as Record<string, string>;

  const cau = questions.map((q: { id: string; number: number }) => {
    const daGo = (answers[q.id] ?? "").trim();
    const dung = key.get(q.id);
    return {
      so: q.number,
      daGo: daGo || null,
      dapAn: dung?.answer ?? null,
      chapNhan: dung?.acceptable ?? null,
    };
  });

  return NextResponse.json({
    ten: luot.ten,
    khach: luot.khach,
    title: luot.title,
    status: luot.status,
    total: luot.total,
    correct: luot.correct,
    band: luot.band === null ? null : Number(luot.band),
    cau,
  });
}
