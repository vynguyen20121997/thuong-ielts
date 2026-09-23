import "server-only";

import {
  GRADER_CONTEXT,
  WRITING_CRITERIA,
  WRITING_TASK,
  bandFromLevel,
  countWords,
  overallBand,
  tooShortToGrade,
  type CriterionScore,
  type WritingState,
} from "@thuong-ielts/diagnostic";

/**
 * Chấm phần Writing của bài kiểm tra nền bằng TypeSafe (model Jev).
 *
 * `server-only` ở dòng đầu là cố ý, giống `practice/server/typesafe.ts`: lỡ tay
 * import từ một component client thì build hỏng ngay, thay vì âm thầm nhét
 * `TYPESAFE_API_KEY` vào bundle gửi xuống trình duyệt.
 *
 * ## Một request cho cả bốn tiêu chí
 *
 * Jev đọc `state` một lần rồi trả lời mọi câu hỏi song song, và chỉ tính tiền
 * token đầu vào. Gửi bốn request riêng là trả tiền cho bài viết bốn lần, mà
 * còn chậm hơn.
 *
 * ## Vì sao không bao giờ ném lỗi lên trên
 *
 * Nộp bài là thao tác một lần. Nếu dịch vụ ngoài hỏng mà ta để lỗi thoát ra
 * thì cả lượt làm — gồm 53 câu trắc nghiệm đã chấm xong — cũng hỏng theo. Nên
 * mọi đường hỏng đều trả về trạng thái `ungraded` kèm lý do, và học sinh vẫn
 * nhận được kết quả ba phần kia. Bài viết nằm nguyên trong DB, chấm lại lúc nào
 * cũng được.
 */

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
/* Học sinh đang đứng chờ màn kết quả, nên trần chờ ngắn hơn màn luyện tập. */
const TIMEOUT_MS = 25000;
/* Một bài 15 phút dài nhất cũng quanh 300 từ; chặn ở đây để cú dán 200KB không thành hoá đơn. */
const MAX_CHARS = 8000;

type Answer = { score?: number; confidence?: number };

export function graderConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

export async function gradeWriting(essay: string): Promise<WritingState> {
  const words = countWords(essay);
  if (!words) return { kind: "empty" };
  if (tooShortToGrade(essay)) return { kind: "too-short", words };

  const key = process.env.TYPESAFE_API_KEY;
  if (!key) {
    return { kind: "ungraded", words, reason: "Chưa cấu hình dịch vụ chấm." };
  }

  const questions: Record<string, unknown> = {};
  for (const criterion of WRITING_CRITERIA) {
    questions[criterion.id] = {
      type: "score",
      instructions: `${criterion.instructions}\n\n${GRADER_CONTEXT}`,
      criteria: criterion.levels,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      /*
        `state` là object chứ không phải một chuỗi nối tay: đề bài và bài viết
        là hai thứ khác nhau, và câu hỏi "có trả lời đúng đề không" chỉ trả lời
        được khi model phân biệt được đâu là đề, đâu là bài.
      */
      body: JSON.stringify({
        model: MODEL,
        state: {
          task_prompt: WRITING_TASK.prompt,
          student_essay: essay.slice(0, MAX_CHARS),
        },
        questions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `TypeSafe trả ${response.status} khi chấm Writing:`,
        (await response.text()).slice(0, 300),
      );
      return { kind: "ungraded", words, reason: "Dịch vụ chấm đang bận." };
    }

    const payload = (await response.json()) as {
      answers?: Record<string, Answer>;
    };
    const answers = payload.answers ?? {};

    const criteria: CriterionScore[] = [];
    for (const criterion of WRITING_CRITERIA) {
      const level = answers[criterion.id]?.score;
      /*
        Thiếu một tiêu chí thì bỏ cả lượt chấm, không hiện ba thẻ có điểm và
        một thẻ trống: điểm tổng sẽ sai, mà học sinh thì không có cách nào biết
        con số mình đang nhìn đã thiếu một phần tư.
      */
      if (typeof level !== "number") {
        return {
          kind: "ungraded",
          words,
          reason: "Dịch vụ chấm trả về thiếu tiêu chí.",
        };
      }
      const confidence = answers[criterion.id]?.confidence;
      criteria.push({
        id: criterion.id,
        band: bandFromLevel(level),
        confidence: typeof confidence === "number" ? confidence : null,
      });
    }

    const bands = Object.fromEntries(criteria.map((c) => [c.id, c.band]));

    return {
      kind: "graded",
      result: {
        taskVersion: WRITING_TASK.version,
        words,
        meetsWordCount: words >= WRITING_TASK.minWords,
        criteria,
        overall: overallBand(bands),
        gradedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("Gọi TypeSafe để chấm Writing thất bại:", err);
    return { kind: "ungraded", words, reason: "Không gọi được dịch vụ chấm." };
  } finally {
    clearTimeout(timer);
  }
}
