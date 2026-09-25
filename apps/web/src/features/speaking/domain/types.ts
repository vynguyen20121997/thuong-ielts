/*
  Kiểu dữ liệu của phần Speaking. Thuần: không React, không fetch, không `pg`.

  Toàn bộ "logic" (chấm, gợi ý ý tưởng, sinh chủ đề) đi qua các cổng trong
  `application/ports.ts`; giao diện chỉ biết các kiểu ở đây. Nối bộ chấm thật
  sau này là viết một bản cài đặt của cổng, không đụng tới UI.
*/

export type Part = 1 | 2 | 3;

export type SpeakingQuestion = {
  id: string;
  part: Part;
  topic: string;
  /** Câu hỏi hoặc cue card, tiếng Anh nguyên văn. */
  prompt: string;
  /** Chỉ Part 2: các gạch đầu dòng "you should say". */
  bullets?: string[];
  /** Bộ đề dự đoán theo quý, ví dụ "Q3–Q4 2026". */
  set: string;
};

/*
  Bốn tiêu chí Speaking, thứ tự bảng điểm chính thức. Tách khỏi Writing
  (TR/CC/LR/GRA) vì hai thang khác nhau: Speaking có Phát âm, không có Task
  Response.
*/
export type SpeakingCriterionId = "FC" | "LR" | "GRA" | "P";

export type SpeakingCriterion = {
  id: SpeakingCriterionId;
  label: string;
  english: string;
  /** Câu hỏi gửi cho bộ chấm. Tiếng Anh, cùng lý do với Writing. */
  instructions: string;
  /** Sáu mức, band 4 → 9. Xem `criteria.ts`. */
  levels: string[];
  /**
   * Tiêu chí này chỉ chấm được khi NGHE. Chấm từ bản ghi chữ thì bỏ qua —
   * bản ghi không giữ lại trọng âm, ngữ điệu hay âm cuối bị nuốt, nên cho
   * điểm Phát âm dựa trên chữ là bịa.
   */
  needsAudio?: boolean;
};

export type CriterionScore = {
  id: SpeakingCriterionId;
  band: number;
  confidence: number | null;
};

/** Một đoạn trong bản ghi được đánh dấu. */
export type TranscriptMark = {
  start: number;
  end: number;
  kind: "error" | "good";
  /** Gợi ý sửa, chỉ cho `error`. */
  fix?: string;
};

export type SpeakingResult = {
  questionId: string;
  durationSeconds: number;
  /** Máy nhận dạng lời nói — có thể sai vài từ, giao diện phải nói ra điều đó. */
  transcript: string;
  marks: TranscriptMark[];
  criteria: CriterionScore[];
  overall: number | null;
  /** Nhận xét ngắn theo tiêu chí, do bộ chấm trả về. */
  notes: Partial<Record<SpeakingCriterionId, string>>;
  gradedAt: string;
};

/*
  Bốn trạng thái, giao diện phân biệt cả bốn. "Chưa nối bộ chấm" là một trạng
  thái hợp lệ (`ungraded`), không phải lỗi — bài nói vẫn được giữ.
*/
/** Bài nói gửi đi chấm dưới dạng chữ (máy nhận dạng lời nói đã chuyển). */
export type TranscriptSubmission = {
  questionId: string;
  /** Câu hỏi nguyên văn — bộ chấm phải biết học sinh đang trả lời cái gì. */
  prompt: string;
  part: Part;
  transcript: string;
  durationSeconds: number;
};

export type SpeakingState =
  | { kind: "recorded"; durationSeconds: number }
  | { kind: "grading" }
  | { kind: "ungraded"; reason: string }
  | { kind: "graded"; result: SpeakingResult };

/* ── Phát triển ý (S3) ────────────────────────────────────────────────────── */

export type IdeaFeedback = {
  /** Ý của học sinh, viết lại cho tròn câu. */
  reshaped: string;
  /** Câu hỏi gợi mở khi ý còn mỏng; `null` nếu ý đã đủ. */
  probe: string | null;
  vocab: string[];
};

/** Ba hướng ý chính cho nút "Không biết nói gì". */
export type IdeaSeed = { title: string; hint: string };

/* ── Bốc chủ đề (S4) ──────────────────────────────────────────────────────── */

export type TopicPack = {
  topic: string;
  part: Part;
  headline: string;
  background: string;
  points: string[];
  vocab: { word: string; ipa?: string; meaning: string }[];
  questions: string[];
};
