import { NextResponse } from "next/server";

import {
  WRITING_MIN_WORDS,
  WRITING_CHECKABLE_WORDS,
} from "../../../../../features/practice/domain/writing";
import { getWritingPrompt } from "../../../../../features/practice/server/writingRepository";
import { gradeEssayBand } from "../../../../../server/writingBand";

/**
 * Chấm bài Writing theo bốn tiêu chí IELTS và trả về band.
 *
 * Khác route `check` cạnh bên: `check` là checklist có/không trước khi nộp,
 * còn đây là điểm. Hai thứ trả lời hai câu hỏi khác nhau nên giữ tách, và học
 * sinh bấm riêng từng cái.
 *
 * Đề do SERVER tra lại từ DB, không nhận từ client — để client gửi kèm "đề"
 * tự chế là ai cũng được báo "đúng đề hoàn hảo". Cùng lý do với `check`.
 *
 * KHÔNG truyền `context`: đây là Task 2 đủ 40 phút và 250 từ, tức đúng chuẩn
 * mà thang band mô tả. Câu dặn "bài ngắn đừng trừ điểm" chỉ dành cho bài 15
 * phút của kiểm tra nền.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 12000;

export async function POST(request: Request) {
  let body: { promptId?: unknown; essay?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body không phải JSON hợp lệ." },
      { status: 400 },
    );
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const essay = typeof body.essay === "string" ? body.essay : "";

  if (!promptId)
    return NextResponse.json({ error: "Thiếu mã đề." }, { status: 400 });
  if (essay.length > MAX_CHARS)
    return NextResponse.json({ error: "Bài viết quá dài." }, { status: 413 });

  const prompt = await getWritingPrompt(promptId);
  if (!prompt)
    return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });

  const state = await gradeEssayBand(essay, {
    prompt: prompt.prompt,
    minWords: WRITING_MIN_WORDS,
    gradableWords: WRITING_CHECKABLE_WORDS,
    taskVersion: `prompt:${prompt.id}`,
  });

  return NextResponse.json(
    { writing: state },
    { headers: { "Cache-Control": "no-store" } },
  );
}
