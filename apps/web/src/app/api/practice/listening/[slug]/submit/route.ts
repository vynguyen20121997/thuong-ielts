import { NextResponse } from "next/server";

import { currentStudent } from "../../../../../../features/account/server/guard";
import { gradeReading } from "../../../../../../features/practice/domain/scoring";
import type { ReadingAnswers } from "../../../../../../features/practice/domain/types";
import { saveAttempt } from "../../../../../../features/practice/server/attemptRepository";
import {
  getListeningAnswerKeyBySlug,
  recordListeningAttempt,
} from "../../../../../../features/practice/server/listeningRepository";

interface SubmitBody {
  answers?: unknown;
  elapsedSeconds?: unknown;
}

function sanitizeAnswers(input: unknown): ReadingAnswers {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: ReadingAnswers = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value.slice(0, 200);
  }
  return out;
}

/** Graded on the server against a key the browser never received. */
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

  const record = await getListeningAnswerKeyBySlug(slug);
  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy đề nghe này." }, { status: 404 });
  }

  const answers = sanitizeAnswers(body.answers);
  const elapsed = typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : 0;
  const result = gradeReading(record.questions, record.answerKey, answers, elapsed);

  await recordListeningAttempt(slug);

  // Xem ghi chú ở route chấm Reading cả test: người làm lấy từ phiên đăng nhập.
  // Listening lưu cả bài một dòng nên luôn là 'test', không có 'paper'.
  const student = await currentStudent();
  if (student) {
    await saveAttempt({
      skill: "listening",
      scope: "test",
      target: slug,
      title: record.title,
      studentId: student.id,
      answers,
      result,
    });
  }

  return NextResponse.json(result);
}
