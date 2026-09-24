import "server-only";

import {
  WRITING_CRITERIA,
  bandFromLevel,
  countWords,
  overallBand,
  type CriterionScore,
  type WritingResult,
  type WritingState,
} from "@thuong-ielts/diagnostic";

/*
  Chấm một bài viết theo bốn tiêu chí IELTS bằng TypeSafe (model Jev).

  MỘT bản cài đặt cho cả hai chỗ đang cần: Section 4 của bài kiểm tra nền (bài
  15 phút, tối thiểu 150 từ) và màn luyện Writing (Task 2 đủ 40 phút, 250 từ).
  Hai chỗ khác nhau ở `context` và `minWords` chứ không khác cách chấm — để hai
  bản cài đặt song song là mở đường cho ngày điểm ở hai màn lệch nhau.

  `server-only` ở dòng đầu là cố ý: lỡ tay import từ component client thì build
  hỏng ngay, thay vì âm thầm nhét `TYPESAFE_API_KEY` vào bundle gửi xuống
  trình duyệt.

  ## Một request cho cả bốn tiêu chí

  Jev đọc `state` một lần rồi trả lời mọi câu hỏi song song, và chỉ tính tiền
  token đầu vào. Gửi bốn request riêng là trả tiền cho bài viết bốn lần.

  ## Không bao giờ ném lỗi

  Đây là dịch vụ ngoài. Mọi đường hỏng đều trả `{ kind: "ungraded", reason }`;
  bài viết nằm nguyên chỗ cũ và chấm lại lúc nào cũng được.
*/

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const TIMEOUT_MS = 25000;
/* Một bài Task 2 dài nhất cũng quanh 500 từ; chặn để cú dán khổng lồ không thành hoá đơn. */
const MAX_CHARS = 12000;

export type BandOptions = {
  /** Đề bài, để model phân biệt "đúng đề" với "viết hay nhưng lạc". */
  prompt: string;
  /** Mức chữ tối thiểu của dạng bài này. */
  minWords: number;
  /** Dưới mức này thì không gọi dịch vụ ngoài. */
  gradableWords: number;
  /**
   * Câu dặn thêm gửi kèm mỗi tiêu chí. Dùng để báo cho model biết bài này
   * không phải Task 2 chuẩn (ví dụ bài 15 phút của kiểm tra nền), nếu không
   * nó trừ điểm vì một giới hạn do đề đặt ra chứ không phải do học sinh.
   */
  context?: string;
  /** Ghi vào kết quả để sau này đọc lại biết chấm theo phiên bản đề nào. */
  taskVersion: string;
};

export function graderConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

export async function gradeEssayBand(
  essay: string,
  options: BandOptions,
): Promise<WritingState> {
  const words = countWords(essay);
  if (!words) return { kind: "empty" };
  if (words < options.gradableWords) return { kind: "too-short", words };

  const key = process.env.TYPESAFE_API_KEY;
  if (!key) {
    return { kind: "ungraded", words, reason: "Chưa cấu hình dịch vụ chấm." };
  }

  const questions: Record<string, unknown> = {};
  for (const criterion of WRITING_CRITERIA) {
    questions[criterion.id] = {
      type: "score",
      instructions: options.context
        ? `${criterion.instructions}\n\n${options.context}`
        : criterion.instructions,
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
      /* `state` là object: đề bài và bài viết là hai thứ khác nhau. */
      body: JSON.stringify({
        model: MODEL,
        state: {
          task_prompt: options.prompt,
          student_essay: essay.slice(0, MAX_CHARS),
        },
        questions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `TypeSafe trả ${response.status} khi chấm band:`,
        (await response.text()).slice(0, 300),
      );
      return { kind: "ungraded", words, reason: "Dịch vụ chấm đang bận." };
    }

    const payload = (await response.json()) as {
      answers?: Record<string, { score?: number; confidence?: number }>;
    };
    const answers = payload.answers ?? {};

    const criteria: CriterionScore[] = [];
    for (const criterion of WRITING_CRITERIA) {
      const level = answers[criterion.id]?.score;
      /*
        Thiếu một tiêu chí thì bỏ cả lượt chấm. Hiện ba thẻ có điểm và một thẻ
        trống thì điểm tổng sai, mà học sinh không có cách nào biết con số mình
        đang nhìn đã thiếu một phần tư.
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
    const result: WritingResult = {
      taskVersion: options.taskVersion,
      words,
      meetsWordCount: words >= options.minWords,
      criteria,
      overall: overallBand(bands),
      gradedAt: new Date().toISOString(),
    };
    return { kind: "graded", result };
  } catch (err) {
    console.error("Gọi TypeSafe để chấm band thất bại:", err);
    return { kind: "ungraded", words, reason: "Không gọi được dịch vụ chấm." };
  } finally {
    clearTimeout(timer);
  }
}
