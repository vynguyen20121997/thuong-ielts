import { NextResponse } from "next/server";

import { gradeTranscriptBand } from "../../../../server/speakingBand";
import type { Part } from "../../../../features/speaking/domain/types";

/**
 * Chấm một bài nói từ bản ghi chữ do trình duyệt nhận dạng.
 *
 * Câu hỏi nhận từ client, khác route Writing (ở đó đề tra lại từ DB). Lý do:
 * câu hỏi Speaking đến từ ngân hàng trong code và từ bộ bốc chủ đề, chưa có
 * bảng nào để tra; và ở đây câu hỏi chỉ là ngữ cảnh cho bộ chấm chứ không
 * quyết định điểm ai nhận được. Vẫn chặn độ dài để không ai dán cả quyển sách
 * vào làm hoá đơn.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT = 2000;
const MAX_TRANSCRIPT = 6000;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Body không phải JSON hợp lệ." },
      { status: 400 },
    );
  }

  const transcript = typeof body.transcript === "string" ? body.transcript : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const part =
    body.part === 1 || body.part === 2 || body.part === 3
      ? (body.part as Part)
      : 1;
  const durationSeconds =
    typeof body.durationSeconds === "number" &&
    Number.isFinite(body.durationSeconds)
      ? Math.max(0, body.durationSeconds)
      : 0;

  if (!transcript.trim())
    return NextResponse.json({ error: "Thiếu bản ghi." }, { status: 400 });
  if (transcript.length > MAX_TRANSCRIPT || prompt.length > MAX_PROMPT)
    return NextResponse.json({ error: "Nội dung quá dài." }, { status: 413 });

  const state = await gradeTranscriptBand({
    questionId,
    prompt,
    part,
    transcript,
    durationSeconds,
  });

  return NextResponse.json(
    { speaking: state },
    { headers: { "Cache-Control": "no-store" } },
  );
}
