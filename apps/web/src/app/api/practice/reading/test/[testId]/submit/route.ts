import { NextResponse } from "next/server";
import { banNhip, maLop } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../../../features/account/server/guard";
import { gradeReading } from "../../../../../../../features/practice/domain/scoring";
import type { ReadingAnswers } from "../../../../../../../features/practice/domain/types";
import {
  closeAttempt,
  saveAttempt,
} from "../../../../../../../features/practice/server/attemptRepository";
import {
  getAnswerKeyByTestId,
  recordTestAttempt,
} from "../../../../../../../features/practice/server/readingRepository";

interface SubmitBody {
  answers?: unknown;
  elapsedSeconds?: unknown;
  /** Lượt đã mở lúc bấm bắt đầu. Có thì chốt đúng lượt ấy, không đẻ dòng mới. */
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
 * Chấm cả test 3 passage trong một lần. Giống hệt route chấm một passage —
 * chỉ khác chỗ lấy đáp án: gộp ba dòng DB lại.
 *
 * Ghép được là nhờ id câu hỏi duy nhất toàn cục (`cam10-t1-p2-q14`) và số câu
 * đã đánh liền 1→40 sẵn trong dữ liệu, nên `gradeReading` không cần biết bài
 * này gồm mấy passage.
 */
export async function POST(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const record = await getAnswerKeyByTestId(testId);
  if (!record) {
    return NextResponse.json({ error: "Không tìm thấy test này." }, { status: 404 });
  }

  const answers = sanitizeAnswers(body.answers);
  const elapsed = typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : 0;

  const result = gradeReading(record.questions, record.answerKey, answers, elapsed);

  await recordTestAttempt(testId);

  // Ai đang làm thì lấy từ phiên đăng nhập, không lấy từ body: nếu tin vào id
  // do trình duyệt gửi lên thì ai cũng ghi được vào lịch sử của người khác.
  //
  // Không có phiên thì bỏ qua, không phải lỗi — trang thi có chốt đăng nhập,
  // nhưng route này vẫn gọi thẳng được và một lượt không rõ của ai thì lưu
  // cũng chẳng để làm gì. Điểm vẫn trả về bình thường.
  const student = await currentStudent();
  if (student) {
    const moTruoc = typeof body.attemptId === "string" ? body.attemptId : null;
    const tuDong = body.autoSubmitted === true;

    // Chốt lượt đã mở. Nếu không chốt được (nộp hai lần, hoặc server đã tự
    // chốt vì hết giờ) thì KHÔNG ghi đè và cũng không tạo dòng mới — điểm lần
    // chốt đầu mới là điểm thật.
    const daChot = moTruoc ? await closeAttempt(moTruoc, answers, result, tuDong) : false;

    // Không có lượt mở sẵn: học sinh vào từ phiên cũ trước khi có tính năng
    // này, hoặc lúc mở lượt bị lỗi mạng. Vẫn lưu lại để lịch sử không thủng.
    if (!moTruoc) {
      await saveAttempt({
        skill: "reading",
        scope: "test",
        target: testId,
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
        target: testId,
        lop: maLop(testId),
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
