import "server-only";

import {
  CONFIDENCE_FLOOR,
  WRITING_CHECKS,
  scorePassed,
  type CheckResult,
  type CheckSpec,
} from "../domain/writing";
import type { Idea, Stance, Tracking } from "../domain/writingCoach";

/**
 * Gọi TypeSafe (model Jev) để chấm nháp một bài Writing.
 *
 * `server-only` ở dòng đầu là có chủ đích: lỡ tay import file này từ một
 * component client thì build HỎNG ngay, thay vì âm thầm nhét `TYPESAFE_API_KEY`
 * vào bundle gửi xuống trình duyệt. Khoá này tính tiền theo token, nên lộ ra là
 * mất tiền thật của cô.
 *
 * ## Vì sao một request cho cả sáu câu hỏi
 *
 * Jev đọc `state` một lần rồi chấm mọi câu hỏi song song trên đó, và chỉ tính
 * tiền token ĐẦU VÀO. Gửi sáu request riêng là trả tiền cho bài viết sáu lần,
 * mà còn chậm hơn.
 *
 * ## Vì sao bọc kỹ lỗi
 *
 * Đây là dịch vụ ngoài, và nó đang tự ghi trong tài liệu rằng rate limit "có
 * thể đổi không báo trước". Màn Writing phải sống được khi nó chết: học sinh
 * vẫn viết, vẫn đếm chữ, vẫn nộp cho cô — chỉ mất phần chấm nháp. Nên mọi lỗi
 * ở đây trả về `null` chứ không ném lên trên.
 */

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
/* Dịch vụ ngoài thì phải có trần: học sinh không nên chờ quá lâu vì một thứ phụ trợ. */
const TIMEOUT_MS = 20000;

type NoulAnswer = { noul: number };
type ScoreAnswer = { score: number; confidence?: number };
type Answer = Partial<NoulAnswer & ScoreAnswer>;

export function typesafeConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

function buildQuestions() {
  const questions: Record<string, unknown> = {};
  for (const check of WRITING_CHECKS) {
    questions[check.id] =
      check.kind === "noul"
        ? { type: "noul", instructions: check.instructions }
        : { type: "score", instructions: check.instructions, criteria: check.criteria };
  }
  return questions;
}

function toResult(spec: CheckSpec, answer: Answer | undefined): CheckResult {
  const base = { id: spec.id, label: spec.label, advice: spec.advice };

  if (!answer) return { ...base, passed: null };

  if (spec.kind === "noul") {
    const value = answer.noul;
    if (typeof value !== "number") return { ...base, passed: null };
    /*
      `noul` là một số 0–1, không phải nhãn đúng/sai. Khoảng giữa nghĩa là model
      thật sự lưỡng lự, và ép nó về đúng/sai ở đó là bịa ra một sự chắc chắn
      không có. Nên khoảng giữa trả `null` và giao diện nói "chưa chắc".
    */
    if (value >= CONFIDENCE_FLOOR) return { ...base, passed: true, confidence: value };
    if (value <= 1 - CONFIDENCE_FLOOR) return { ...base, passed: false, confidence: 1 - value };
    return { ...base, passed: null, confidence: 0.5 };
  }

  const level = answer.score;
  if (typeof level !== "number") return { ...base, passed: null };
  const confidence = answer.confidence;
  if (typeof confidence === "number" && confidence < CONFIDENCE_FLOOR) {
    return { ...base, passed: null, level, confidence };
  }
  return {
    ...base,
    passed: scorePassed(level, spec.criteria?.length ?? 3),
    level,
    confidence,
  };
}

/**
 * Trả về `null` khi không chấm nháp được (chưa có khoá, mạng hỏng, quá tải,
 * dịch vụ trả lỗi). Nơi gọi phải coi `null` là chuyện bình thường.
 */
export async function checkEssay(
  prompt: string,
  essay: string,
): Promise<CheckResult[] | null> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      /*
        `state` là object chứ không phải một chuỗi nối tay: đề bài và bài viết
        là hai thứ khác nhau, và câu hỏi "có đúng đề không" chỉ trả lời được khi
        model phân biệt được đâu là đề, đâu là bài.
      */
      body: JSON.stringify({
        model: MODEL,
        state: { task_prompt: prompt, student_essay: essay },
        questions: buildQuestions(),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`TypeSafe trả ${res.status}:`, (await res.text()).slice(0, 300));
      return null;
    }

    const payload = (await res.json()) as { answers?: Record<string, Answer> };
    const answers = payload.answers ?? {};
    return WRITING_CHECKS.map((spec) => toResult(spec, answers[spec.id]));
  } catch (err) {
    console.error("Gọi TypeSafe thất bại:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Theo dõi bài trong lúc viết (khác với chấm nháp ở trên).

   Chấm nháp chạy MỘT lần khi học sinh bấm nút; cái này chạy sau mỗi đoạn. Vì
   vậy nó phải rẻ và nhanh — và nó rẻ thật, vì Jev đọc `state` một lần rồi trả
   lời mọi câu hỏi song song: thêm một ý vào ngân hàng là thêm một câu hỏi,
   gần như không thêm thời gian chờ.
   ──────────────────────────────────────────────────────────────────────────── */

const STANCE_KEY = "__stance";
const PROMISE_KEY = "__promise";
const CONCLUSION_KEY = "__conclusion";
const EXAMPLE_KEY = "__example";

type ChoiceAnswer = { choice?: string; confidence?: number };

/**
 * Đọc bài rồi trả về những gì thấy được. `null` khi không gọi được dịch vụ —
 * nơi gọi phải coi đó là chuyện bình thường và giữ nguyên gợi ý cũ.
 */
export async function trackEssay(
  prompt: string,
  essay: string,
  lastPara: string,
  ideas: Idea[],
): Promise<Omit<Tracking, "paragraphs"> | null> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) return null;

  const questions: Record<string, unknown> = {
    [STANCE_KEY]: {
      type: "choice",
      instructions: "Which position does the essay take on the task question?",
      criteria: {
        pos: "The essay argues the development is positive, or that benefits outweigh drawbacks",
        neg: "The essay argues the development is negative, or that drawbacks outweigh benefits",
        unclear: "The essay does not commit to either side yet",
      },
    },
    [PROMISE_KEY]: {
      type: "noul",
      instructions:
        "The introduction signals that the essay will also discuss the opposing side, for example with 'although', 'despite' or 'while'.",
    },
    [CONCLUSION_KEY]: {
      type: "noul",
      /*
        Phải hỏi về ĐOẠN CUỐI, và đòi dấu hiệu kết bài thật.

        Bản đầu hỏi "bài đã có kết luận nêu lại quan điểm chưa" trên cả bài, và
        một mở bài nêu quan điểm rõ ràng đọc ra đúng như vậy: mới gõ xong mở bài
        thì bảng đã báo "bài đã đủ bốn phần". Đo được trên trình duyệt.
      */
      instructions:
        "The last_paragraph is the essay's closing paragraph: it sums up and restates the position after the arguments have been made (for example 'In conclusion', 'On balance', 'Overall'). It is NOT an introduction that merely announces a position, and not a body paragraph still developing an argument.",
    },
    [EXAMPLE_KEY]: {
      type: "noul",
      instructions:
        "The final paragraph of the essay supports its point with a specific example, case or concrete detail, not only general statements.",
    },
  };
  for (const idea of ideas) {
    questions[idea.id] = { type: "noul", instructions: idea.probe };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      /*
        `last_paragraph` gửi RIÊNG dù nó đã nằm trong `student_essay`. Câu hỏi
        "đoạn này có ví dụ chưa" hỏi về một đoạn cụ thể; để model tự đoán đâu là
        đoạn cuối thì lời nhắc sẽ trỏ nhầm chỗ, mà lời nhắc trỏ nhầm chỗ còn tệ
        hơn không nhắc.
      */
      body: JSON.stringify({
        model: MODEL,
        state: { task_prompt: prompt, student_essay: essay, last_paragraph: lastPara },
        questions,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`TypeSafe (track) trả ${res.status}:`, (await res.text()).slice(0, 300));
      return null;
    }

    const payload = (await res.json()) as {
      answers?: Record<string, (Answer & ChoiceAnswer) | undefined>;
    };
    const a = payload.answers ?? {};

    const stanceAnswer = a[STANCE_KEY] as ChoiceAnswer | undefined;
    const stance: Stance =
      stanceAnswer?.choice === "pos" || stanceAnswer?.choice === "neg"
        ? // Quan điểm mà model không chắc thì coi như chưa rõ: cả chuỗi gợi ý
          // phía sau dựa vào nó, đoán sai một lần là lệch suốt bài.
          (stanceAnswer.confidence ?? 1) >= CONFIDENCE_FLOOR
          ? stanceAnswer.choice
          : "unclear"
        : "unclear";

    const yes = (k: string) => {
      const v = a[k]?.noul;
      return typeof v === "number" && v >= CONFIDENCE_FLOOR;
    };

    const exampleRaw = a[EXAMPLE_KEY]?.noul;
    const lastParagraphHasExample =
      typeof exampleRaw !== "number"
        ? null
        : exampleRaw >= CONFIDENCE_FLOOR
          ? true
          : exampleRaw <= 1 - CONFIDENCE_FLOOR
            ? false
            : null;

    return {
      stance,
      usedIdeaIds: ideas.filter((i) => yes(i.id)).map((i) => i.id),
      promisedOtherSide: yes(PROMISE_KEY),
      hasConclusion: yes(CONCLUSION_KEY),
      lastParagraphHasExample,
    };
  } catch (err) {
    console.error("Gọi TypeSafe (track) thất bại:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Khớp câu hỏi tự do của học sinh với ghi chú kiến thức nền.

   Đây là chỗ Jev làm đúng việc của nó: không sinh chữ, chỉ CHỌN một mục trong
   danh sách có sẵn. Học sinh hỏi "viết mặt trái kiểu gì" thì nó trả về id của
   ghi chú "Cách nêu mặt trái mà vẫn giữ quan điểm" — nội dung vẫn là chữ cô
   viết, không phải chữ máy đoán ra.
   ──────────────────────────────────────────────────────────────────────────── */

const MATCH_KEY = "__match";

/**
 * Trả về id ghi chú khớp nhất, hoặc `null` khi không gọi được / không đủ chắc.
 * `null` KHÔNG phải lỗi: nó nghĩa là "chưa có ghi chú cho câu này", và màn
 * hình phải nói đúng như vậy thay vì đưa đại một bài không liên quan.
 */
export async function matchKnowledge(
  question: string,
  notes: { id: string; summary: string; topic: string }[],
): Promise<string | null> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key || notes.length === 0) return null;

  const criteria: Record<string, string> = {};
  for (const n of notes) criteria[n.id] = n.summary || n.topic;
  // Luôn có đường thoát: không có mục nào hợp thì model phải nói được điều đó,
  // chứ không bị ép chọn mục ít sai nhất.
  criteria.__none = "The question is not covered by any of the notes above.";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        state: { student_question: question },
        questions: {
          [MATCH_KEY]: {
            type: "choice",
            instructions: "Which note best answers the student's question?",
            criteria,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`TypeSafe (match) trả ${res.status}:`, (await res.text()).slice(0, 200));
      return null;
    }

    const payload = (await res.json()) as {
      answers?: Record<string, { choice?: string; confidence?: number } | undefined>;
    };
    const a = payload.answers?.[MATCH_KEY];
    if (!a?.choice || a.choice === "__none") return null;
    if ((a.confidence ?? 1) < CONFIDENCE_FLOOR) return null;
    return notes.some((n) => n.id === a.choice) ? a.choice : null;
  } catch (err) {
    console.error("Gọi TypeSafe (match) thất bại:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
