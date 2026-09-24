import type { SpeakingCriterion, SpeakingCriterionId } from "./types";

/*
  Thang bốn tiêu chí Speaking. Sáu mức ứng band 4 → 9, cùng lý do với Writing
  (`packages/diagnostic/src/writing.ts`): dưới 4 gần như không nghe được, còn
  tách 8.0/8.5 trên một câu 2 phút là đòi độ tinh mà giám khảo thật cũng dè dặt.

  `levels` viết tiếng Anh vì sẽ gửi thẳng cho bộ chấm; nhãn tiếng Việt cho
  học sinh đọc.
*/
export const SPEAKING_CRITERIA: SpeakingCriterion[] = [
  {
    id: "FC",
    label: "Trôi chảy và mạch lạc",
    english: "Fluency and Coherence",
    levels: [
      "Speaks with long pauses and frequent breakdowns; ideas are hard to follow",
      "Keeps going but with noticeable hesitation, repetition and self-correction; linking is basic",
      "Speaks at length with some hesitation; uses linking devices, sometimes mechanically",
      "Speaks at length without noticeable effort; occasional hesitation; flexible use of discourse markers",
      "Fluent with only rare repetition or self-correction; develops topics coherently",
      "Fluent with only very occasional, content-related hesitation; fully coherent",
    ],
  },
  {
    id: "LR",
    label: "Vốn từ",
    english: "Lexical Resource",
    levels: [
      "Basic vocabulary only; frequent errors in word choice make meaning unclear",
      "Limited range; manages familiar topics but struggles with less familiar ones",
      "Enough vocabulary to discuss topics at length; attempts less common words with some inaccuracy",
      "Uses vocabulary flexibly; some less common and idiomatic items; occasional inaccuracy",
      "Wide range used fluently and precisely; rare slips",
      "Full flexibility and precision in all topics; natural idiomatic use",
    ],
  },
  {
    id: "GRA",
    label: "Ngữ pháp",
    english: "Grammatical Range and Accuracy",
    levels: [
      "Very limited structures; errors are frequent and often obscure meaning",
      "Basic sentence forms with reasonable accuracy; complex structures rarely attempted or usually faulty",
      "Mix of simple and complex forms; frequent errors in complex structures but meaning is clear",
      "Range of complex structures with some flexibility; frequent error-free sentences",
      "Wide range used flexibly; majority of sentences error-free",
      "Full range used naturally and accurately; rare slips",
    ],
  },
  {
    id: "P",
    label: "Phát âm",
    english: "Pronunciation",
    levels: [
      "Often unintelligible; little control of stress and intonation",
      "Understandable with effort; mispronunciations cause some strain; limited use of features",
      "Generally understandable; mixed control of features; some words mispronounced",
      "Easy to understand throughout; L1 accent has minimal effect; uses a range of features",
      "Sustains flexible use of features; easy to understand; only occasional lapses",
      "Effortless to understand; full range of features used precisely and subtly",
    ],
  },
];

const LOWEST_BAND = 4;

export function bandFromLevel(level: number): number {
  if (!Number.isFinite(level)) return LOWEST_BAND;
  return Math.min(9, Math.max(LOWEST_BAND, LOWEST_BAND + Math.round(level)));
}

/** Làm tròn nửa điểm theo luật IELTS. */
export function roundBand(value: number): number {
  return Math.round(value * 2) / 2;
}

export function overallBand(
  bands: Partial<Record<SpeakingCriterionId, number>>,
): number | null {
  const values = SPEAKING_CRITERIA.map((c) => bands[c.id]);
  if (values.some((v) => typeof v !== "number")) return null;
  return roundBand(
    (values as number[]).reduce((a, b) => a + b, 0) / values.length,
  );
}

/** Mô tả mức của một band, để hiện dưới thẻ điểm. */
export function levelText(id: SpeakingCriterionId, band: number): string {
  const criterion = SPEAKING_CRITERIA.find((c) => c.id === id);
  if (!criterion) return "";
  const index = Math.min(
    criterion.levels.length - 1,
    Math.max(0, Math.round(band) - LOWEST_BAND),
  );
  return criterion.levels[index] ?? "";
}

/*
  Lời khuyên cố định theo band, giống Writing: bộ chấm trả con số, còn lời
  khuyên là của cô — mọi học sinh cùng mức nhận cùng một câu.
*/
const ADVICE: Record<SpeakingCriterionId, { upTo: number; text: string }[]> = {
  FC: [
    {
      upTo: 5,
      text: "Đừng cố nói đúng ngay. Nói tiếp bằng câu ngắn, sai thì để đó — dừng lại sửa mới là thứ bị trừ ở tiêu chí này.",
    },
    {
      upTo: 6,
      text: "Thay tiếng 'um' bằng cụm câu giờ: 'Let me think…', 'What I mean is…'. Giữ được nhịp là lên mức.",
    },
    {
      upTo: 9,
      text: "Đã trôi chảy. Tập nối ý bằng lý do và ví dụ thay vì bằng 'and then' — mạch lạc là ý dẫn ý.",
    },
  ],
  LR: [
    {
      upTo: 5,
      text: "Học từ theo cụm đi cùng chủ đề Part 1 hay gặp: gia đình, việc học, sở thích. Dùng đúng cụm quen ăn điểm hơn từ hiếm dùng sai.",
    },
    {
      upTo: 6,
      text: "Thay từ chung (good, thing, a lot) bằng từ chính xác theo ngữ cảnh. Mỗi chủ đề chuẩn bị 5 cụm, không nhiều hơn.",
    },
    {
      upTo: 9,
      text: "Từ vựng rộng. Chú ý mấy chỗ dùng thành ngữ hơi gượng — tự nhiên quan trọng hơn hiếm.",
    },
  ],
  GRA: [
    {
      upTo: 5,
      text: "Kể chuyện cũ thì giữ nguyên quá khứ đơn từ đầu tới cuối. Đó là lỗi lặp lại nhiều nhất và dễ sửa nhất.",
    },
    {
      upTo: 6,
      text: "Đã có câu phức. Soát ba nhóm lỗi hay gặp khi nói: thì, mạo từ, số ít/số nhiều — nghe lại bản ghi và đếm.",
    },
    {
      upTo: 9,
      text: "Ngữ pháp vững. Thử thêm câu điều kiện và mệnh đề quan hệ khi giải thích lý do.",
    },
  ],
  P: [
    {
      upTo: 5,
      text: "Đọc chậm lại và phát âm rõ âm cuối /s/, /t/, /d/. Nuốt âm cuối là lý do nghe không rõ số ít/số nhiều và thì.",
    },
    {
      upTo: 6,
      text: "Trọng âm từ dài (in-for-MA-tion, e-CO-no-my) và ngữ điệu lên xuống ở câu hỏi — thu âm lại và so với giọng mẫu.",
    },
    {
      upTo: 9,
      text: "Dễ nghe. Tập nhấn từ khoá trong câu để ý chính nổi lên.",
    },
  ],
};

export function adviceFor(id: SpeakingCriterionId, band: number): string {
  const table = ADVICE[id];
  return (table.find((row) => band <= row.upTo) ?? table[table.length - 1])
    .text;
}
