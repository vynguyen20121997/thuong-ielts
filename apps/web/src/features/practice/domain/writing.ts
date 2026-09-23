/**
 * Chấm NHÁP bài Writing Task 2 — phần thuần, không React, không fetch, không `pg`.
 *
 * ## Nó KHÔNG phải cái gì
 *
 * Không phải band điểm, và không được để nó trở thành band điểm. Bài thi thật
 * chấm Writing theo bốn tiêu chí do người chấm cân nhắc cùng lúc; ở đây chỉ là
 * một loạt câu hỏi nguyên tử kiểu có/không, mỗi câu trả lời độc lập. Gộp chúng
 * lại thành một con số rồi gọi là "band 6.0" là đúng thứ `roadmap.ts` đã cấm:
 * không có cơ sở quy đổi, và học sinh sẽ tin con số đó hơn cô giáo.
 *
 * Vai của nó là **cái checklist trước khi nộp cho cô**: những lỗi máy nhìn ra
 * được trong vài giây (lạc đề, thiếu kết luận, không có ví dụ) thì để máy nói,
 * để thời gian của cô dành cho phần máy không nói được.
 *
 * ## Vì sao chia nhỏ thành nhiều câu hỏi thay vì hỏi một câu
 *
 * "Chấm bài này" là câu hỏi cần suy luận dài và cân nhiều yếu tố cùng lúc —
 * đúng loại câu mà một model quyết định nhanh trả lời tệ. Hỏi tách ra thì mỗi
 * câu là một phán đoán gọn mà người có nghề liếc qua là biết, và khi muốn đổi
 * mức độ nghiêm khắc thì sửa hệ số trong code, không phải viết lại prompt.
 *
 * Mọi câu hỏi đánh giá cùng một `state` trong MỘT request và chạy song song,
 * nên thêm câu hỏi gần như không tăng thời gian chờ.
 */

export const WRITING_MIN_WORDS = 250;
/** Dưới mức này thì chưa đủ bài để nhận xét — hỏi cũng chỉ ra rác. */
export const WRITING_CHECKABLE_WORDS = 80;
export const WRITING_MINUTES = 40;

/**
 * Ngưỡng tin cậy để dám nói. Dưới mức này thì hiện "chưa chắc" thay vì đạt/chưa
 * đạt — thà im còn hơn nói sai, vì một dòng "bài của em lạc đề" sai chỗ là học
 * sinh đi viết lại cả bài không vì lý do gì.
 */
export const CONFIDENCE_FLOOR = 0.6;

export type CheckId =
  | "trung_de"
  | "co_quan_diem"
  | "du_bo_cuc"
  | "co_vi_du"
  | "mach_lac"
  | "tu_vung";

export type CheckKind = "noul" | "score";

export type CheckSpec = {
  id: CheckId;
  /** Tên hiện cho học sinh, viết thành việc cần làm chứ không thành lời phán. */
  label: string;
  kind: CheckKind;
  /** Câu hỏi gửi cho model — tiếng Anh, vì bài viết và model đều làm việc bằng tiếng Anh. */
  instructions: string;
  /** Chỉ cho `score`: các mức, từ thấp tới cao. */
  criteria?: string[];
  /** Câu gợi ý khi chưa đạt. Cố định trong code để mọi học sinh nhận cùng một lời khuyên. */
  advice: string;
};

/*
  Sáu câu, cố ý dừng ở đây. Thêm câu thứ bảy thì tốn gần như không đáng kể về
  tiền, nhưng một checklist dài quá thì học sinh đọc lướt — và cái giá thật của
  màn này là học sinh có sửa bài hay không, chứ không phải đo được bao nhiêu thứ.

  Không có câu nào về ngữ pháp hay chính tả: chỗ đó cần chỉ đúng vị trí lỗi mới
  giúp được gì, mà một câu trả lời có/không thì không chỉ được vị trí nào cả.
*/
export const WRITING_CHECKS: CheckSpec[] = [
  {
    id: "trung_de",
    label: "Viết đúng đề bài",
    kind: "noul",
    instructions:
      "The essay answers the exact question asked in the task prompt, addressing every part of it.",
    advice:
      "Đọc lại đề và gạch chân từng yêu cầu. Đề hỏi hai vế mà bài chỉ trả lời một vế cũng bị tính là chưa đủ.",
  },
  {
    id: "co_quan_diem",
    label: "Nêu rõ quan điểm",
    kind: "noul",
    instructions:
      "The writer states a clear position on the question and keeps that same position throughout the essay.",
    advice:
      "Nói rõ mình nghiêng về bên nào ngay ở mở bài, và giữ nguyên tới kết bài. Đổi lập trường giữa chừng là mất điểm mạch lạc.",
  },
  {
    id: "du_bo_cuc",
    label: "Đủ mở – thân – kết",
    kind: "noul",
    instructions:
      "The essay has an introduction, at least two developed body paragraphs, and a conclusion.",
    advice:
      "Thiếu kết bài là lỗi hay gặp nhất khi hết giờ. Viết trước hai câu kết ngay sau mở bài nếu sợ không kịp.",
  },
  {
    id: "co_vi_du",
    label: "Có ví dụ cụ thể",
    kind: "noul",
    instructions:
      "Each main argument is supported with a specific example, reason, or piece of evidence rather than only general statements.",
    advice:
      "Mỗi luận điểm thêm một câu 'for example…' với chi tiết cụ thể. Ý chung chung lặp lại không tính là phát triển ý.",
  },
  {
    id: "mach_lac",
    label: "Mạch lạc giữa các ý",
    kind: "score",
    instructions: "How clearly the ideas connect and progress from one to the next.",
    criteria: [
      "Ideas are disconnected; the reader has to guess how they relate",
      "Ideas connect but the essay jumps between them abruptly",
      "Ideas progress smoothly with clear linking throughout",
    ],
    advice:
      "Mỗi đoạn mở bằng một câu chủ đề, và nối đoạn bằng quan hệ ý chứ không chỉ bằng 'Moreover', 'Furthermore'.",
  },
  {
    id: "tu_vung",
    label: "Từ vựng đa dạng",
    kind: "score",
    instructions:
      "How varied and precise the vocabulary is, beyond basic and repeated words.",
    criteria: [
      "Basic vocabulary, key words repeated throughout",
      "Some variety, but common words dominate",
      "Varied and precise word choice used naturally",
    ],
    advice:
      "Tìm ba từ bị lặp nhiều nhất trong bài và thay bằng từ đồng nghĩa hợp ngữ cảnh — thay bừa còn hại hơn lặp.",
  },
];

/**
 * Đếm từ theo cách IELTS đếm: tách theo khoảng trắng.
 *
 * Cố ý KHÔNG thông minh hơn thế. Giám khảo thật cũng đếm thô, và một bộ đếm
 * "chuẩn hơn" sẽ cho ra con số khác con số học sinh tự đếm trong phòng thi —
 * đó là lúc họ mất niềm tin vào cả màn hình này.
 */
export function countWords(essay: string): number {
  const trimmed = essay.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export type CheckResult = {
  id: CheckId;
  label: string;
  advice: string;
  /** `true` đạt, `false` chưa đạt, `null` = model không đủ chắc để nói. */
  passed: boolean | null;
  /** Chỉ `score`: mức đạt được, 0-based theo `criteria`. */
  level?: number;
  confidence?: number;
};

export type WritingFeedback = {
  words: number;
  /** Đủ số từ tối thiểu của bài thi chưa. Chỉ đếm, không phải nhận xét. */
  meetsWordCount: boolean;
  checks: CheckResult[];
};

/**
 * Điểm `score` đạt mức cao nhất mới tính là đạt; mức giữa vẫn còn chỗ sửa.
 *
 * Làm tròn trước khi so, vì model trả về SỐ THỰC chứ không phải chỉ số mức: đo
 * thật thấy nó trả `1.99` cho một bài rõ ràng đạt mức 2. So thẳng `1.99 >= 2`
 * là trượt, và cả thang điểm biến thành "không ai đạt bao giờ".
 */
export function scorePassed(level: number, criteriaLength: number): boolean {
  return Math.round(level) >= criteriaLength - 1;
}
