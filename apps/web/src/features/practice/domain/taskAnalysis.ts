/*
  Phân tích đề Writing Task 2 — thuần, không gọi model nào.

  ## Vì sao làm bằng luật chứ không hỏi máy

  Đề Task 2 chỉ có một nhúm dạng, và mỗi dạng nhận ra được bằng đúng cụm từ nó
  luôn dùng ("Discuss both views", "To what extent do you agree"). Một bộ luật
  đọc ra là biết đúng hay sai, chạy tức thì, không tốn tiền và không bao giờ
  bịa. Hỏi model để lấy lại đúng phép so khớp chuỗi này là đổi thứ chắc chắn
  lấy thứ may rủi.

  Phần máy KHÔNG làm được bằng luật — gợi ý luận điểm, câu mẫu nâng cấp ngữ
  pháp, bài mẫu band 8 — nằm ở `application/essayPorts.ts`, không ở đây.
*/

export type TaskKind =
  | "positive-negative"
  | "evaluate-solution"
  | "discuss-both"
  | "opinion"
  | "advantages-disadvantages"
  | "problem-solution"
  | "two-part"
  | "unknown";

export type TaskType = {
  kind: TaskKind;
  /** Tên dạng, viết như cách cô gọi trên lớp. */
  label: string;
  /** Bài phải có những gì mới được tính là trả lời đủ. */
  mustCover: string[];
  /** Bẫy hay gặp nhất của dạng này. */
  trap: string;
};

/*
  Thứ tự = thứ tự ưu tiên. Những dạng nhận ra bằng một cụm CỐ ĐỊNH đứng trước;
  `two-part` (chỉ dựa vào việc có hai dấu hỏi) phải đứng cuối, nếu không nó ăn
  mất mọi đề có hai câu hỏi mà thật ra đã có dạng rõ ràng.
*/
const TASK_TYPES: (TaskType & { test: RegExp })[] = [
  {
    kind: "positive-negative",
    label: "Positive or negative — đây là chuyển biến tốt hay xấu",
    test: /(positive or (a )?negative)|((a )?negative or (a )?positive)/i,
    mustCover: [
      "Chọn HẲN một phía: tốt, xấu, hoặc tốt nhiều hơn xấu",
      "Ít nhất hai lý do cho phía mình chọn, mỗi lý do có ví dụ",
      "Nhắc tới phía kia một lần rồi bác lại, đừng bỏ qua hẳn",
    ],
    trap: "Viết kiểu 'có cả tốt lẫn xấu' rồi thôi. Đề hỏi NGHIÊNG về đâu, không hỏi có hai mặt hay không.",
  },
  {
    kind: "evaluate-solution",
    label:
      "Evaluate — cách làm này có hiệu quả không, hay có cách khác tốt hơn",
    test: /(effective solution)|(are there better ways)|(is this the best way)/i,
    mustCover: [
      "Nói rõ cách làm trong đề có hiệu quả hay không, và ở mức nào",
      "Chỉ ra giới hạn của nó",
      "Nếu đề hỏi 'better ways' thì phải đề xuất ít nhất một cách khác",
    ],
    trap: "Chỉ khen hoặc chỉ chê cách làm trong đề mà quên vế 'có cách nào tốt hơn không'.",
  },
  {
    kind: "discuss-both",
    label: "Discuss both views — bàn cả hai phía rồi nêu quan điểm",
    test: /discuss both (these )?(views|sides|opinions)/i,
    mustCover: [
      "Trình bày phía thứ nhất, có lý do và ví dụ",
      "Trình bày phía thứ hai, có lý do và ví dụ",
      "Nêu rõ mình nghiêng về bên nào, và vì sao",
    ],
    trap: "Bàn hai phía rồi quên nói mình nghiêng về đâu — đề có hai vế mà bài chỉ trả lời một.",
  },
  {
    kind: "opinion",
    label: "Opinion — nêu mức độ đồng ý",
    test: /(to what extent do you (agree|disagree))|(do you agree or disagree)/i,
    mustCover: [
      "Nói rõ MỨC ĐỘ đồng ý ngay ở mở bài",
      "Ít nhất hai lý do, mỗi lý do có ví dụ",
      "Giữ nguyên lập trường tới kết bài",
    ],
    trap: "Đổi lập trường giữa chừng, hoặc viết kiểu 'cả hai đều đúng' — đề hỏi mức độ, không hỏi có hai mặt hay không.",
  },
  {
    kind: "advantages-disadvantages",
    label: "Advantages & disadvantages — lợi và hại",
    test: /(advantages?( and | & )disadvantages?)|(benefits?( and | & )drawbacks?)|(outweigh)/i,
    mustCover: [
      "Nêu mặt lợi, có ví dụ",
      "Nêu mặt hại, có ví dụ",
      "Nếu đề hỏi 'outweigh' thì phải CÂN hai bên, không chỉ liệt kê",
    ],
    trap: "Đề hỏi bên nào nặng hơn mà bài chỉ liệt kê mỗi bên vài ý rồi thôi.",
  },
  {
    kind: "problem-solution",
    label: "Problem & solution — nguyên nhân và cách giải quyết",
    test: /(problems?[\s\S]{0,40}solutions?)|(causes?[\s\S]{0,40}solutions?)|(what (measures|steps) )/i,
    mustCover: [
      "Nêu vấn đề hoặc nguyên nhân cụ thể",
      "Đề xuất giải pháp gắn đúng với nguyên nhân đó",
      "Nói giải pháp đó hoạt động thế nào",
    ],
    trap: "Giải pháp không ăn nhập với nguyên nhân vừa nêu, thành hai đoạn rời nhau.",
  },
  {
    kind: "two-part",
    label: "Two-part question — hai câu hỏi riêng",
    test: /\?[\s\S]*\?/,
    mustCover: [
      "Trả lời trọn vẹn câu hỏi thứ nhất",
      "Trả lời trọn vẹn câu hỏi thứ hai",
    ],
    trap: "Trả lời câu đầu rất kỹ rồi hụt hơi ở câu sau. Hai câu phải cân nhau.",
  },
];

const UNKNOWN: TaskType = {
  kind: "unknown",
  label: "Chưa nhận ra dạng",
  mustCover: ["Đọc kỹ đề và gạch chân từng yêu cầu trước khi viết"],
  trap: "Không nhận ra dạng thì dễ viết lạc — hỏi cô nếu không chắc.",
};

/**
 * Nhận dạng đề. Thứ tự trong `TASK_TYPES` là thứ tự ưu tiên: một đề vừa có
 * "discuss both views" vừa có hai dấu hỏi thì nó là discuss-both, vì cụm ấy
 * nói thẳng ra dạng, còn dấu hỏi thì chỉ là dấu hiệu gián tiếp.
 */
export function detectTaskType(prompt: string): TaskType {
  const found = TASK_TYPES.find((t) => t.test.test(prompt));
  if (!found) return UNKNOWN;
  const { test: _test, ...type } = found;
  return type;
}

/*
  Từ bị bỏ khi tìm từ khoá. Không dùng danh sách stopword tiếng Anh đầy đủ:
  ở đây chỉ cần loại những từ chắc chắn không phải nội dung của đề, còn giữ
  lại hơi nhiều thì học sinh tự bỏ qua được — loại nhầm một từ khoá thật mới
  là hỏng.
*/
const SKIP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "as",
  "at",
  "by",
  "from",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "some",
  "people",
  "think",
  "believe",
  "others",
  "you",
  "your",
  "should",
  "would",
  "could",
  "can",
  "may",
  "might",
  "will",
  "shall",
  "more",
  "most",
  "many",
  "much",
  "other",
  "their",
  "they",
  "them",
  "there",
  "which",
  "what",
  "while",
  "whereas",
  "however",
  "also",
  "than",
  "then",
  "about",
  "give",
  "own",
  "opinion",
  "discuss",
  "both",
  "views",
  "agree",
  "disagree",
  "extent",
  "write",
  "least",
  "words",
  "spend",
  "minutes",
  "following",
  "topic",
  "essay",
  "answer",
  "use",
  "reasons",
  "examples",
  "relevant",
  "knowledge",
  "experience",
  "support",
  "question",
]);

/**
 * Cụm từ khoá của đề — thứ học sinh phải nhắc lại (bằng từ khác) trong bài.
 *
 * Giữ nguyên thứ tự xuất hiện chứ không xếp theo tần suất: đọc theo thứ tự đề
 * mới thấy được đề đang hỏi cái gì trước, cái gì sau.
 */
export function keyPhrases(prompt: string, limit = 10): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of prompt.split(/[^A-Za-z'-]+/)) {
    const word = raw.toLowerCase();
    if (word.length < 4 || SKIP.has(word) || seen.has(word)) continue;
    seen.add(word);
    out.push(raw);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Tách đề thành từng yêu cầu.
 *
 * Bỏ dòng hướng dẫn chung ("You should spend about 40 minutes…", "Write at
 * least 250 words") — đó là luật thi, không phải nội dung phải trả lời, và để
 * lẫn vào thì danh sách yêu cầu dài ra mà chẳng thêm gì.
 */
export function requirements(prompt: string): string[] {
  return prompt
    .split(/(?<=[.?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 12 &&
        !/^you should spend/i.test(s) &&
        !/write at least \d+ words/i.test(s),
    );
}

export type PromptAnalysis = {
  type: TaskType;
  requirements: string[];
  keyPhrases: string[];
};

export function analysePrompt(prompt: string): PromptAnalysis {
  return {
    type: detectTaskType(prompt),
    requirements: requirements(prompt),
    keyPhrases: keyPhrases(prompt),
  };
}
