/**
 * Phần Writing của bài kiểm tra nền: đề bài, thang chấm, và cách quy band.
 *
 * Thuần: không fetch, không React, không `pg`. Server gọi để dựng câu hỏi gửi
 * cho bộ chấm; UI gọi để vẽ. Một nguồn duy nhất, vì thang điểm mà hai bên hiểu
 * khác nhau thì học sinh thấy một con số còn cô thấy một con số khác.
 *
 * ## Vì sao 15 phút, và vì sao phải nói thẳng điều đó ra
 *
 * Task 2 thật là 40 phút cho 250 từ. Bài này chỉ có 15 phút, nên nó KHÔNG phải
 * một bài Task 2 đầy đủ và band chấm ra không phải band Writing thi thật —
 * viết vội thì Task Response và Coherence bao giờ cũng hụt so với thực lực.
 * Cả đề bài lẫn giao diện đều phải nói ra điều đó, và bộ chấm cũng được báo
 * trước (xem `GRADER_CONTEXT`), để nó không trừ điểm vì bài ngắn.
 */

/** Đề bài, thời lượng và mức chữ tối thiểu. Đổi đề thì tăng `version`. */
export const WRITING_TASK = {
  version: "2026-09-23-w1",
  /* Giây, khớp đơn vị với `duration` của phần trắc nghiệm. */
  seconds: 15 * 60,
  type: "Task 2 rút gọn",
  prompt:
    "Some people think that students should be required to learn a foreign language at primary school. Others believe it is better to start in secondary school.\n\nDiscuss both views and give your own opinion.",
  /*
    150 chứ không phải 250. Đòi 250 từ trong 15 phút là đặt ra một mức không ai
    đạt được, và một yêu cầu không ai đạt được thì không đo được gì cả.
  */
  minWords: 150,
  /* Dưới mức này thì không gọi dịch vụ ngoài: xem `tooShortToGrade`. */
  gradableWords: 60,
} as const;

/**
 * Bốn tiêu chí IELTS. Thứ tự này là thứ tự bảng điểm chính thức, giữ nguyên ở
 * mọi chỗ hiển thị để học sinh quen mắt.
 */
export type CriterionId = "TR" | "CC" | "LR" | "GRA";

export type Criterion = {
  id: CriterionId;
  /** Tên tắt in trên thẻ điểm. */
  short: string;
  /** Tên tiếng Việt, đọc ra là hiểu tiêu chí đo cái gì. */
  label: string;
  /** Tên tiếng Anh đầy đủ, để học sinh tra tiếp ở tài liệu chính thống. */
  english: string;
  /**
   * Câu hỏi gửi cho bộ chấm. Tiếng Anh, vì bài viết và model đều làm việc bằng
   * tiếng Anh — dịch sang tiếng Việt là thêm một lớp sai lệch không cần thiết.
   */
  instructions: string;
  /**
   * Sáu mức, thấp → cao, tương ứng band 4 → 9 (xem `bandFromLevel`).
   *
   * Sáu chứ không phải chín: dưới band 4 thì bài gần như không đọc được, còn
   * bắt model phân biệt 8.0 với 8.5 trên một bài 15 phút là đòi một độ tinh
   * mà chính giám khảo thật cũng phải đọc cả 250 từ mới dám chấm.
   */
  levels: string[];
};

export const WRITING_CRITERIA: Criterion[] = [
  {
    id: "TR",
    short: "TR",
    label: "Trả lời đúng yêu cầu đề",
    english: "Task Response",
    instructions:
      "How fully does the essay answer the task question, cover every part of it, and support its position with developed ideas?",
    levels: [
      "Barely addresses the task; the position is unclear or the response is off-topic",
      "Addresses the task only partly; some parts of the question are ignored and ideas stay undeveloped",
      "Addresses all parts of the task, though some parts are covered more fully than others; a clear position is present",
      "Addresses all parts of the task with a clear, well-developed position and relevant, extended ideas",
      "Sufficiently addresses all parts with a well-developed response and relevant, fully extended ideas",
      "Fully addresses all parts of the task with a fully developed position and relevant, fully extended ideas",
    ],
  },
  {
    id: "CC",
    short: "CC",
    label: "Mạch lạc và liên kết",
    english: "Coherence and Cohesion",
    instructions:
      "How logically is the essay organised into paragraphs, and how well do sentences and ideas connect to each other?",
    levels: [
      "Ideas are not arranged coherently; there is no clear paragraphing",
      "Information is presented with some organisation, but linking is faulty or repetitive",
      "Arranges information coherently with clear progression; uses cohesive devices effectively though sometimes mechanically",
      "Logically organises information with clear progression; uses a range of cohesive devices well; paragraphing is appropriate",
      "Sequences information and ideas logically; manages all aspects of cohesion well; paragraphing is skilfully handled",
      "Uses cohesion in such a way that it attracts no attention; paragraphing is entirely appropriate",
    ],
  },
  {
    id: "LR",
    short: "LR",
    label: "Vốn từ",
    english: "Lexical Resource",
    instructions:
      "How wide and how accurate is the vocabulary, including collocation, word form and spelling?",
    levels: [
      "Uses only basic vocabulary; errors in word choice and spelling make meaning hard to follow",
      "Uses a limited range of vocabulary; noticeable errors in word choice, form or spelling",
      "Uses an adequate range of vocabulary; attempts less common words with some inaccuracy; some errors in spelling or word formation",
      "Uses a sufficient range of vocabulary with some flexibility and precision; occasional errors in word choice or collocation",
      "Uses a wide range of vocabulary fluently and precisely; only occasional slips",
      "Uses a wide range of vocabulary with very natural and sophisticated control; rare minor slips",
    ],
  },
  {
    id: "GRA",
    short: "GRA",
    label: "Ngữ pháp",
    english: "Grammatical Range and Accuracy",
    instructions:
      "How varied are the sentence structures, and how accurate are grammar and punctuation?",
    levels: [
      "Uses only a very limited range of structures; errors dominate and often prevent meaning",
      "Uses a limited range of structures; grammatical errors are frequent and can cause difficulty",
      "Uses a mix of simple and complex structures, but with frequent errors in grammar or punctuation",
      "Uses a variety of complex structures; the majority of sentences are error-free; good control of grammar and punctuation",
      "Uses a wide range of structures; the vast majority of sentences are error-free; occasional slips only",
      "Uses a wide range of structures with full flexibility and accuracy; rare minor slips",
    ],
  },
];

/**
 * Báo trước cho bộ chấm rằng đây là bài 15 phút.
 *
 * Không có câu này thì model chấm theo chuẩn Task 2 40 phút / 250 từ và trừ
 * điểm mọi bài vì "chưa phát triển đủ ý" — tức là trừ vì một giới hạn do đề
 * đặt ra chứ không phải do học sinh. Cái cần đo ở đây là các em viết được gì
 * trong 15 phút, chứ không phải các em thiếu bao nhiêu so với 250 từ.
 */
export const GRADER_CONTEXT = `This is a 15-minute diagnostic writing task, not a full IELTS Writing Task 2. The student was asked for at least ${WRITING_TASK.minWords} words, not 250. Judge the quality of what is written; do not penalise the essay merely for being shorter than a standard Task 2 answer.`;

/** Band thấp nhất mà thang `levels` mô tả; mức 0 ứng với band này. */
const LOWEST_BAND = 4;

/** Mức 0–5 của bộ chấm → band 4–9. Ngoài khoảng thì kẹp lại, không ném lỗi. */
export function bandFromLevel(level: number): number {
  if (!Number.isFinite(level)) return LOWEST_BAND;
  const band = LOWEST_BAND + Math.round(level);
  return Math.min(9, Math.max(LOWEST_BAND, band));
}

/**
 * Làm tròn về nửa điểm theo luật IELTS: .25 lên .5, .75 lên nguyên tiếp theo.
 * Dùng cho điểm tổng của bốn tiêu chí.
 */
export function roundBand(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Trung bình bốn tiêu chí, làm tròn nửa điểm. Thiếu tiêu chí nào thì `null`. */
export function overallBand(
  bands: Partial<Record<CriterionId, number>>,
): number | null {
  const values = WRITING_CRITERIA.map((c) => bands[c.id]);
  if (values.some((v) => typeof v !== "number")) return null;
  return roundBand(
    (values as number[]).reduce((a, b) => a + b, 0) / values.length,
  );
}

/**
 * Đếm từ. Tách theo khoảng trắng chứ không theo dấu câu: "state-of-the-art" là
 * một từ trong cách đếm của IELTS, và tách ở dấu gạch nối sẽ thổi số từ lên.
 */
export function countWords(essay: string): number {
  const trimmed = essay.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Quá ngắn thì đừng gọi dịch vụ ngoài — vừa mất tiền vừa không dạy được gì. */
export function tooShortToGrade(essay: string): boolean {
  return countWords(essay) < WRITING_TASK.gradableWords;
}

export type CriterionScore = {
  id: CriterionId;
  band: number;
  /**
   * Bộ chấm tự khai mức chắc chắn 0–1. Giữ lại để cô đọc được lúc đối chiếu:
   * một band 7 với confidence 0,4 không đáng tin như band 7 với 0,9.
   */
  confidence: number | null;
};

export type WritingResult = {
  /** Phiên bản đề lúc chấm; đổi đề thì kết quả cũ vẫn đọc được đúng ngữ cảnh. */
  taskVersion: string;
  words: number;
  meetsWordCount: boolean;
  /** Rỗng khi chưa chấm được — xem `WritingState`. */
  criteria: CriterionScore[];
  overall: number | null;
  gradedAt: string;
};

/**
 * Ba trạng thái, và giao diện phải phân biệt được cả ba.
 *
 * Gộp "chưa chấm được" vào "chưa nộp" là nói dối học sinh đã viết xong; gộp nó
 * vào "đã chấm" thì bảng điểm hiện band rỗng mà không ai biết vì sao.
 */
export type WritingState =
  | { kind: "empty" }
  | { kind: "too-short"; words: number }
  | { kind: "ungraded"; words: number; reason: string }
  | { kind: "graded"; result: WritingResult };

/**
 * Lời khuyên theo band, cố định trong code.
 *
 * Cố ý không hỏi model xin lời khuyên tự do: `score` chỉ trả về một con số, và
 * một lời khuyên bịa thêm ở tầng giao diện thì không dựa trên gì cả. Bảng này
 * ít nhất là lời khuyên của cô, giống nhau cho mọi học sinh cùng mức.
 */
const ADVICE: Record<CriterionId, { upTo: number; text: string }[]> = {
  TR: [
    {
      upTo: 5,
      text: "Gạch chân từng vế của đề trước khi viết. Đề có hai vế mà bài chỉ bàn một vế thì dù viết hay vẫn bị tính là chưa trả lời đủ.",
    },
    {
      upTo: 6,
      text: "Đã trả lời đủ vế, nhưng ý còn dừng ở mức nêu ra. Mỗi ý chính thêm một câu giải thích và một ví dụ cụ thể là lên được mức tiếp theo.",
    },
    {
      upTo: 9,
      text: "Trả lời đủ và có phát triển ý. Giữ nhịp này và tập viết mở bài nêu rõ lập trường ngay từ câu thứ hai.",
    },
  ],
  CC: [
    {
      upTo: 5,
      text: "Tách đoạn theo ý: mỗi đoạn một ý chính, câu đầu đoạn nói thẳng ý đó. Viết liền một khối là mất điểm ở tiêu chí này trước tiên.",
    },
    {
      upTo: 6,
      text: "Bố cục đã rõ. Việc cần làm tiếp là nối câu trong đoạn bằng đại từ và cụm thay thế, thay vì lặp lại danh từ hoặc rải 'Moreover', 'Furthermore' ở đầu mỗi câu.",
    },
    {
      upTo: 9,
      text: "Mạch bài chặt. Thử bỏ bớt từ nối rõ ràng và để mạch ý tự dẫn — đó là khác biệt giữa mức khá và mức cao ở tiêu chí này.",
    },
  ],
  LR: [
    {
      upTo: 5,
      text: "Học từ theo cụm chứ không theo từ lẻ: 'make a decision', 'play a role in'. Dùng đúng cụm thông dụng ăn điểm hơn là dùng sai một từ hiếm.",
    },
    {
      upTo: 6,
      text: "Vốn từ đủ dùng. Bước tiếp theo là thay các từ chung chung (good, bad, thing, a lot of) bằng từ chính xác theo ngữ cảnh.",
    },
    {
      upTo: 9,
      text: "Từ vựng rộng và dùng đúng chỗ. Chú ý mấy chỗ dùng từ hiếm hơi gượng — tự nhiên quan trọng hơn hiếm.",
    },
  ],
  GRA: [
    {
      upTo: 5,
      text: "Ưu tiên viết câu đơn cho đúng đã. Câu phức sai ngữ pháp bị trừ nhiều hơn là câu đơn viết chuẩn.",
    },
    {
      upTo: 6,
      text: "Đã có câu phức. Việc cần làm là giảm lỗi lặp lại: thì, mạo từ và số ít/số nhiều là ba nhóm lỗi hay gặp nhất — đọc lại bài và soát riêng từng nhóm.",
    },
    {
      upTo: 9,
      text: "Ngữ pháp vững và câu đa dạng. Soát lại dấu câu, nhất là dấu phẩy trước mệnh đề quan hệ.",
    },
  ],
};

/** Lời khuyên cho một tiêu chí ở một band. Luôn trả về một câu, không bao giờ rỗng. */
export function adviceFor(id: CriterionId, band: number): string {
  const table = ADVICE[id];
  return (table.find((row) => band <= row.upTo) ?? table[table.length - 1])
    .text;
}
