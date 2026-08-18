import { NextResponse } from "next/server";
import { banNhip, maLop } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../../features/account/server/guard";
import { khachHienTai } from "../../../../../../features/account/server/khach";
import { gradeReading } from "../../../../../../features/practice/domain/scoring";
import type { ReadingAnswers } from "../../../../../../features/practice/domain/types";
import {
  closeAttempt,
  saveAttempt,
} from "../../../../../../features/practice/server/attemptRepository";
import {
  getListeningAnswerKeyBySlug,
  recordListeningAttempt,
} from "../../../../../../features/practice/server/listeningRepository";

interface SubmitBody {
  answers?: unknown;
  elapsedSeconds?: unknown;
  /** Lượt đã mở lúc bài bắt đầu. Có thì chốt đúng lượt ấy, không đẻ dòng mới. */
  attemptId?: unknown;
  autoSubmitted?: unknown;
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
  // Học sinh có tài khoản, hoặc khách vào bằng link cô gửi.
  const student = await currentStudent();
  const khach = student ? null : await khachHienTai();
  if (student || khach) {
    const moTruoc = typeof body.attemptId === "string" ? body.attemptId : null;
    const tuDong = body.autoSubmitted === true;

    // Chốt lượt đã mở. Không chốt được (nộp hai lần, hoặc server đã tự chốt vì
    // hết giờ) thì KHÔNG ghi đè — điểm lần chốt đầu mới là điểm thật.
    const daChot = moTruoc ? await closeAttempt(moTruoc, answers, result, tuDong) : false;

    if (!moTruoc) {
      await saveAttempt({
        skill: "listening",
        scope: "test",
        target: slug,
        title: record.title,
        studentId: student?.id ?? null,
        guestName: khach?.ten ?? null,
        autoSubmitted: tuDong,
        answers,
        result,
      });
    } else if (!daChot) {
      console.warn(`Lượt ${moTruoc} đã đóng từ trước — bỏ qua lần nộp này.`);
    }

    if (daChot) {
      void banNhip({
        loai: "nop",
        a: moTruoc as string,
        target: slug,
        pham: "test" as const,
        lop: maLop(slug),
        ten: student?.name ?? khach?.ten ?? "Học viên",
        khach: !student,
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
