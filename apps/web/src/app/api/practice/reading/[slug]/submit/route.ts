import { NextResponse } from "next/server";
import { banNhip, maLop } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../../features/account/server/guard";
import { gradeReading } from "../../../../../../features/practice/domain/scoring";
import type { ReadingAnswers } from "../../../../../../features/practice/domain/types";
import {
  closeAttempt,
  saveAttempt,
} from "../../../../../../features/practice/server/attemptRepository";
import {
  getAnswerKeyBySlug,
  recordAttempt,
} from "../../../../../../features/practice/server/readingRepository";

interface SubmitBody {
  answers?: unknown;
  elapsedSeconds?: unknown;
  attemptId?: unknown;
  autoSubmitted?: unknown;
}

/** Accepts only a flat { [questionId]: string } map; anything else is dropped. */
function sanitizeAnswers(input: unknown): ReadingAnswers {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: ReadingAnswers = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value.slice(0, 200);
  }
  return out;
}

/**
 * Grading happens here, on the server, using the answer key that was never
 * shipped to the browser. The client sends what the student typed; it does not
 * get a vote on whether that is right.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const record = await getAnswerKeyBySlug(slug);
  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy đề đọc này." }, { status: 404 });
  }

  const answers = sanitizeAnswers(body.answers);
  const elapsed = typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : 0;

  const result = gradeReading(record.questions, record.answerKey, answers, elapsed);

  await recordAttempt(slug);

  // Xem ghi chú ở route chấm cả test: người làm lấy từ phiên, không lấy từ body.
  const student = await currentStudent();
  if (student) {
    const moTruoc = typeof body.attemptId === "string" ? body.attemptId : null;
    const tuDong = body.autoSubmitted === true;
    const daChot = moTruoc ? await closeAttempt(moTruoc, answers, result, tuDong) : false;

    if (!moTruoc) {
      await saveAttempt({
        skill: "reading",
        scope: "paper",
        target: slug,
        title: record.title,
        studentId: student.id,
        autoSubmitted: tuDong,
        answers,
        result,
      });
    } else if (!daChot) {
      console.warn(`Lượt ${moTruoc} đã đóng từ trước — bỏ qua lần nộp này.`);
    }

    // Báo bảng lớp chuyển em này sang "đã nộp". Không chờ: học sinh xứng đáng
    // thấy điểm ngay, không phải đợi một cái thông báo cho màn hình người khác.
    if (daChot) {
      void banNhip({
        loai: "nop",
        a: moTruoc as string,
        target: slug,
        lop: maLop(slug),
        ten: student.name ?? "Học viên",
        khach: false,
        d: result.total,
        c: result.correct,
        t: result.total,
        // `null` cho câu BỎ TRỐNG, không phải `false`.
        //
        // Về điểm số thì bỏ trống cũng là không được điểm, nhưng trên màn hình
        // của cô hai thứ đó khác hẳn nhau: sai là hiểu nhầm, bỏ trống là không
        // kịp giờ. Gộp lại thành "sai" là giấu mất thông tin cô cần nhất để
        // biết phải giúp em ấy chuyện gì.
        marks: result.items.map((i) => (i.given.trim() ? i.isCorrect : null)),
        conLai: 0,
        band: result.band,
      });
    }
  }

  return NextResponse.json(result);
}
