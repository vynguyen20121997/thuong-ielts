import { NextResponse } from "next/server";
import { banNhip, maLop } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../../features/account/server/guard";
import { khachHienTai } from "../../../../../../features/account/server/khach";
import { isAnswerCorrect } from "../../../../../../features/practice/domain/scoring";
import type { ReadingAnswers } from "../../../../../../features/practice/domain/types";
import {
  getOpenAttempt,
  writeProgress,
} from "../../../../../../features/practice/server/attemptRepository";
import { lookupKey } from "../../../../../../features/practice/server/paperLookup";

/**
 * Nhịp tiến độ — học sinh gửi lên mỗi 5 giây, và chỉ khi có thay đổi.
 *
 * Đây là chỗ chấm bài NGAY TRONG LÚC học sinh còn đang làm, để cô nhìn thấy em
 * nào đang sai dồn ở đoạn nào mà vào giúp kịp.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ KẾT QUẢ CHẤM CHỈ ĐƯỢC ĐI MỘT CHIỀU: server → màn hình của cô.        │
 * │                                                                     │
 * │ Route này trả về cho học sinh đúng { ok: true } và không gì khác.    │
 * │ Đừng bao giờ thêm `marks`, `correct` hay `expected` vào phản hồi —   │
 * │ trang làm bài gọi thẳng được route này, nên mọi thứ trả về ở đây là  │
 * │ thứ học sinh đọc được giữa giờ thi. Đúng/sai đi bằng `pg_notify`     │
 * │ sang tiến trình admin, không đi qua trình duyệt học sinh.            │
 * └─────────────────────────────────────────────────────────────────────┘
 */

function sanitizeAnswers(input: unknown): ReadingAnswers {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: ReadingAnswers = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value.slice(0, 200);
  }
  return out;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Học sinh có tài khoản, hoặc khách vào bằng link cô gửi. Không ai trong hai
  // thì không có gì để ghi.
  const student = await currentStudent();
  const khach = student ? null : await khachHienTai();
  if (!student && !khach) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  // Lấy lượt và kiểm chủ sở hữu trong một truy vấn — không lấy được lượt của
  // người khác, kể cả khi cố tình đổi id trên URL.
  const luot = await getOpenAttempt(id, {
    studentId: student?.id ?? null,
    guestKey: khach?.key ?? null,
  });
  if (!luot) {
    // Đã nộp rồi, hết giờ rồi, hoặc không phải của em này. Cả ba đều không
    // phải lỗi đáng kêu lên: trả 204 để trình duyệt lặng lẽ ngừng gửi nhịp.
    return new NextResponse(null, { status: 204 });
  }

  let body: { answers?: unknown; part?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const de = await lookupKey(luot.skill, luot.scope, luot.target);
  if (!de) return new NextResponse(null, { status: 204 });

  const answers = sanitizeAnswers(body.answers);
  const keyById = new Map(de.answerKey.map((entry) => [entry.questionId, entry]));

  // `marks[i]` ứng với `questions[i]`, không ứng với số câu — passage lẻ bắt
  // đầu từ câu 14 thì mảng vẫn đánh từ 0.
  const marks: (boolean | null)[] = de.questions.map((q) => {
    const given = (answers[q.id] ?? "").trim();
    if (!given) return null;
    const entry = keyById.get(q.id);
    // Câu không có đáp án trong DB là lỗi dữ liệu, không phải học sinh sai.
    // Coi như chưa chấm được thay vì bôi đỏ oan.
    if (!entry) return null;
    return isAnswerCorrect(entry, given);
  });

  const answered = marks.filter((m) => m !== null).length;
  const correct = marks.filter((m) => m === true).length;
  const part = typeof body.part === "string" ? body.part.slice(0, 40) : null;

  await writeProgress(id, { answered, correct, marks, answers, currentPart: part });

  void banNhip({
    loai: "nhip",
    a: id,
    target: luot.target,
    lop: maLop(luot.target),
    pham: luot.scope,
    phan: part,
    ten: luot.ten,
    khach: luot.khach,
    d: answered,
    c: correct,
    t: de.questions.length,
    marks,
    conLai: luot.conLai,
  });

  return NextResponse.json({ ok: true });
}
