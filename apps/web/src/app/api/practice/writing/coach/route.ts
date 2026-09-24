import { NextResponse } from "next/server";

import { analysePrompt } from "../../../../../features/practice/domain/taskAnalysis";
import { essayCoach } from "../../../../../features/practice/infrastructure/essayCoach";
import {
  getWritingPrompt,
  listKnowledgeNotes,
  listPromptIdeas,
} from "../../../../../features/practice/server/writingRepository";
import { suggestVocabulary } from "../../../../../features/practice/server/vocabSuggestions";

/**
 * Gom nội dung cho năm mục của màn kết quả Writing.
 *
 * Ba nguồn khác hẳn nhau, và chỗ này là nơi duy nhất biết cả ba:
 *
 *   - Luật thuần (`domain/taskAnalysis.ts`) cho phần phân tích đề.
 *   - DB: ý tưởng và kiến thức nền cô soạn sẵn, bộ thẻ từ vựng cùng chủ đề.
 *   - Model sinh văn bản cho lỗi chi tiết / câu nâng cấp / bài mẫu — hôm nay
 *     chưa nối, trả `null` và `coachAvailable: false`.
 *
 * Trả về trong MỘT request: năm mục nằm trên cùng một màn, gọi năm lần là năm
 * vòng chờ cho một thứ người dùng thấy cùng lúc.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 12000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const promptId = typeof body?.promptId === "string" ? body.promptId : "";
  const essay =
    typeof body?.essay === "string" ? body.essay.slice(0, MAX_CHARS) : "";

  if (!promptId)
    return NextResponse.json({ error: "Thiếu mã đề." }, { status: 400 });

  const prompt = await getWritingPrompt(promptId);
  if (!prompt)
    return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });

  const [ideas, knowledge, vocabulary, issues, upgrades, sample] =
    await Promise.all([
      listPromptIdeas(promptId),
      listKnowledgeNotes(promptId),
      suggestVocabulary(prompt.topic ?? "", prompt.prompt),
      essay ? essayCoach.issues(prompt.prompt, essay) : Promise.resolve(null),
      essay ? essayCoach.upgrades(essay) : Promise.resolve(null),
      essayCoach.sampleEssay(prompt.prompt),
    ]);

  return NextResponse.json(
    {
      analysis: analysePrompt(prompt.prompt),
      ideas,
      knowledge,
      vocabulary,
      issues,
      upgrades,
      sample,
      coachAvailable: essayCoach.available(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
