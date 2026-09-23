import { NextResponse } from "next/server";

import {
  WRITING_CHECKABLE_WORDS,
  WRITING_MIN_WORDS,
  countWords,
  type WritingFeedback,
} from "../../../../../features/practice/domain/writing";
import { getWritingPrompt } from "../../../../../features/practice/server/writingRepository";
import { checkEssay } from "../../../../../features/practice/server/typesafe";

/**
 * Chấm nháp một bài Writing.
 *
 * Client chỉ gửi `promptId` + bài viết. Đề bài do SERVER tra lại từ DB, không
 * nhận từ client: nếu để client gửi kèm đề thì ai cũng có thể gửi một cái "đề"
 * tự chế khớp hoàn hảo với bài của mình và luôn được báo "đúng đề".
 *
 * Đây cũng là chỗ duy nhất `TYPESAFE_API_KEY` được dùng — xem `typesafe.ts`.
 */

/* Trần độ dài: Jev nhận 32k token cho state, và một bài Task 2 dài nhất cũng
   chỉ quanh 500 từ. Chặn ở đây để một cú dán 200KB không thành một hoá đơn. */
const MAX_CHARS = 12000;

export async function POST(request: Request) {
  let body: { promptId?: unknown; essay?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const essay = typeof body.essay === "string" ? body.essay : "";

  if (!promptId) {
    return NextResponse.json({ error: "Thiếu mã đề." }, { status: 400 });
  }
  if (essay.length > MAX_CHARS) {
    return NextResponse.json({ error: "Bài viết quá dài." }, { status: 413 });
  }

  const prompt = await getWritingPrompt(promptId);
  if (!prompt) {
    return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });
  }

  const words = countWords(essay);

  /*
    Bài quá ngắn thì không gọi dịch vụ ngoài. Hỏi "có đủ mở–thân–kết không" trên
    hai câu văn thì câu trả lời đúng là "không", nhưng nó chẳng dạy được gì mà
    vẫn mất tiền và vẫn làm học sinh nản.
  */
  if (words < WRITING_CHECKABLE_WORDS) {
    const payload: WritingFeedback = {
      words,
      meetsWordCount: words >= WRITING_MIN_WORDS,
      checks: [],
    };
    return NextResponse.json({ ...payload, reason: "too-short" });
  }

  const checks = await checkEssay(prompt.prompt, essay);

  /*
    `checks === null` là "chấm nháp không dùng được lúc này", không phải lỗi của
    học sinh. Vẫn trả 200 kèm số từ, để màn hình hiện được phần đếm chữ và câu
    "vẫn nộp cho cô được" thay vì một thông báo lỗi đỏ.
  */
  const payload: WritingFeedback = {
    words,
    meetsWordCount: words >= WRITING_MIN_WORDS,
    checks: checks ?? [],
  };
  return NextResponse.json(checks ? payload : { ...payload, reason: "unavailable" });
}
