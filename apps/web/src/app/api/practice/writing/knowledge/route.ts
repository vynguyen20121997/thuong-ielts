import { NextResponse } from "next/server";

import {
  getWritingPrompt,
  listKnowledgeNotes,
} from "../../../../../features/practice/server/writingRepository";
import { matchKnowledge } from "../../../../../features/practice/server/typesafe";

/**
 * Lấy một ghi chú kiến thức nền của đề.
 *
 * Hai cách hỏi, một đường ra:
 * - `noteId`: học sinh bấm thẳng một chủ đề — không gọi model, chỉ đọc DB.
 * - `question`: học sinh gõ câu hỏi của mình — model CHỌN ghi chú gần nhất
 *   trong danh sách, rồi vẫn trả về chữ của cô.
 *
 * Model không bao giờ viết nội dung ở đây. Nó chỉ trả lời đúng một câu: "trong
 * năm ghi chú này, cái nào trả lời câu hỏi kia?" Nhờ vậy học sinh không bao
 * giờ đọc phải một đoạn giải thích do máy bịa ra.
 */

const MAX_QUESTION = 300;

export async function POST(request: Request) {
  let body: { promptId?: unknown; noteId?: unknown; question?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const noteId = typeof body.noteId === "string" ? body.noteId : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!promptId) return NextResponse.json({ error: "Thiếu mã đề." }, { status: 400 });
  if (question.length > MAX_QUESTION) {
    return NextResponse.json({ error: "Câu hỏi dài quá." }, { status: 413 });
  }

  const prompt = await getWritingPrompt(promptId);
  if (!prompt) return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });

  const notes = await listKnowledgeNotes(promptId);
  if (notes.length === 0) {
    return NextResponse.json({ note: null, reason: "empty" });
  }

  if (noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return NextResponse.json({ error: "Không tìm thấy ghi chú." }, { status: 404 });
    return NextResponse.json({ note: { topic: note.topic, body: note.body } });
  }

  if (!question) {
    return NextResponse.json({ error: "Thiếu câu hỏi." }, { status: 400 });
  }

  const matched = await matchKnowledge(question, notes);
  /*
    Không khớp được thì nói thẳng, kèm danh sách chủ đề có sẵn. Đưa đại ghi chú
    ít sai nhất thì học sinh đọc xong vẫn không có câu trả lời, mà lại tưởng là
    mình đọc nhầm.
  */
  if (!matched) {
    return NextResponse.json({
      note: null,
      reason: "no-match",
      topics: notes.map((n) => ({ id: n.id, topic: n.topic })),
    });
  }

  const note = notes.find((n) => n.id === matched)!;
  return NextResponse.json({ note: { topic: note.topic, body: note.body }, matched: true });
}

export const dynamic = "force-dynamic";
