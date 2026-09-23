import { NextResponse } from "next/server";

import { countWords } from "../../../../../features/practice/domain/writing";
import {
  coach,
  lastParagraph,
  paragraphCount,
} from "../../../../../features/practice/domain/writingCoach";
import {
  getWritingPrompt,
  listPromptIdeas,
} from "../../../../../features/practice/server/writingRepository";
import { trackEssay } from "../../../../../features/practice/server/typesafe";

/**
 * Đọc bài đang viết dở rồi trả về gợi ý cho đoạn tiếp theo.
 *
 * Khác `/check` ở chỗ: `/check` chạy một lần khi học sinh bấm nút, còn route
 * này chạy sau mỗi đoạn. Nó KHÔNG trả về điểm, không trả về checklist, và
 * không trả về trạng thái để client vẽ thành bảng tiến độ — chỉ một câu dẫn,
 * mấy ý còn gợi được, và (nếu có) một lời nhắc.
 *
 * Việc theo dõi nằm hết ở đây: client gửi bài lên, nhận gợi ý về, không tự
 * suy ra gì. Nhờ vậy đổi luật gợi ý là sửa `writingCoach.ts`, không phải đi
 * tìm trong component.
 */

const MAX_CHARS = 12000;
/* Dưới mức này thì chưa có gì để đọc — hỏi cũng chỉ tốn tiền. */
const MIN_WORDS = 25;

export async function POST(request: Request) {
  let body: { promptId?: unknown; essay?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }

  const promptId = typeof body.promptId === "string" ? body.promptId : "";
  const essay = typeof body.essay === "string" ? body.essay : "";

  if (!promptId) return NextResponse.json({ error: "Thiếu mã đề." }, { status: 400 });
  if (essay.length > MAX_CHARS) {
    return NextResponse.json({ error: "Bài viết quá dài." }, { status: 413 });
  }

  const prompt = await getWritingPrompt(promptId);
  if (!prompt) return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });

  const ideas = await listPromptIdeas(promptId);

  /*
    Bài còn quá ngắn, hoặc đề chưa có ngân hàng ý: KHÔNG gọi dịch vụ ngoài.
    Vẫn trả về gợi ý mở đầu bằng cách đưa `coach()` một trạng thái rỗng —
    nhờ vậy màn hình luôn có thứ để hiện, kể cả khi chưa có gì để đọc.
  */
  if (countWords(essay) < MIN_WORDS || ideas.length === 0) {
    const guidance = coach(
      {
        stance: "unclear",
        usedIdeaIds: [],
        promisedOtherSide: false,
        hasConclusion: false,
        lastParagraphHasExample: null,
        paragraphs: paragraphCount(essay),
      },
      ideas,
    );
    return NextResponse.json({
      ...guidance,
      // Chưa đọc gì thì đừng nói "chưa rõ quan điểm" — em còn chưa viết.
      title: "Đề hỏi một câu: tích cực hay tiêu cực?",
      body:
        ideas.length === 0
          ? "Đề này chưa có ngân hàng ý. Cứ viết theo bố cục mở — thân — kết; phần kiểm tra nháp vẫn chạy bình thường."
          : "Cứ viết mở bài theo hướng em nghiêng về, không cần khai gì ở đây. Bấm một ý bên dưới để xem câu hỏi gợi.",
    });
  }

  const tracking = await trackEssay(prompt.prompt, essay, lastParagraph(essay), ideas);

  /*
    Không đọc được (mất mạng, quá tải, chưa có khoá) thì trả 204. Client giữ
    nguyên gợi ý đang hiện thay vì xoá trắng bảng — mất gợi ý giữa chừng khó
    chịu hơn nhiều so với gợi ý cũ một nhịp.
  */
  if (!tracking) return new NextResponse(null, { status: 204 });

  return NextResponse.json(coach({ ...tracking, paragraphs: paragraphCount(essay) }, ideas));
}

export const dynamic = "force-dynamic";
