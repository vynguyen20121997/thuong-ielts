/**
 * Đề nội bộ — kiểu dữ liệu và phép đổi qua lại giữa BẢN SOẠN và DÒNG DB.
 * KHÔNG import `pool` ở đây (component client dùng file này).
 *
 * Đề nội bộ là một dòng `reading_tests` có `owner_id` = cô. Không có bảng
 * riêng và không có cột "bản nháp": màn làm bài, chấm ở server, mở lượt và
 * giao bài đều đã đọc đúng dạng `passage`/`questions`/`answer_key`, nên lưu
 * đúng dạng đó là dùng lại được hết. Bản soạn dựng NGƯỢC từ chính các cột
 * ấy mỗi lần mở trang — giữ thêm một bản nháp song song là có ngày nó nói
 * khác thứ học sinh đang làm.
 */

export type DangCau =
  | "gap-fill"
  | "multiple-choice"
  | "true-false-not-given"
  | "yes-no-not-given"
  | "matching-headings"
  | "matching-information"
  | "matching-features"
  | "matching-endings";

export const DANG_CAU: { id: DangCau; nhan: string; goiY: string }[] = [
  { id: "gap-fill", nhan: "Điền vào chỗ trống", goiY: "Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer." },
  { id: "multiple-choice", nhan: "Trắc nghiệm A/B/C/D", goiY: "Choose the correct letter, A, B, C or D." },
  { id: "true-false-not-given", nhan: "True / False / Not Given", goiY: "Do the following statements agree with the information given in the passage?" },
  { id: "yes-no-not-given", nhan: "Yes / No / Not Given", goiY: "Do the following statements agree with the claims of the writer?" },
  { id: "matching-headings", nhan: "Nối tiêu đề (headings)", goiY: "Choose the correct heading for each paragraph from the list of headings below." },
  { id: "matching-information", nhan: "Đoạn nào chứa thông tin", goiY: "Which paragraph contains the following information?" },
  { id: "matching-features", nhan: "Nối đặc điểm (người / nhóm)", goiY: "Match each statement with the correct person." },
  { id: "matching-endings", nhan: "Nối vế câu", goiY: "Complete each sentence with the correct ending." },
];

/** Dạng dùng chung MỘT danh sách lựa chọn cho cả nhóm. */
export const DUNG_DS_CHUNG: DangCau[] = [
  "matching-headings",
  "matching-information",
  "matching-features",
  "matching-endings",
];
const CO_DINH: Partial<Record<DangCau, string[]>> = {
  "true-false-not-given": ["TRUE", "FALSE", "NOT GIVEN"],
  "yes-no-not-given": ["YES", "NO", "NOT GIVEN"],
};
export const luaChonCoDinh = (d: DangCau) => CO_DINH[d] ?? null;

export interface CauSoan {
  prompt: string;
  /** Chỉ trắc nghiệm A/B/C/D: mỗi câu một bộ lựa chọn riêng. */
  options: string[];
  /** Chuỗi lựa chọn đúng (dạng chọn) hoặc chữ cần điền (điền từ). */
  answer: string;
  /** Cách viết khác vẫn tính đúng, chỉ cho điền từ. */
  acceptable: string[];
  explanation: string;
}

export interface NhomSoan {
  type: DangCau;
  instruction: string;
  /** Danh sách chung cho các dạng nối. */
  options: string[];
  maxWords: number;
  questions: CauSoan[];
}

export interface DeSoan {
  code: string;
  title: string;
  minutes: number;
  description: string;
  passageTitle: string;
  passageText: string;
  /** Đánh chữ A, B, C… cho từng đoạn — cần cho dạng nối tiêu đề/đoạn. */
  labelParagraphs: boolean;
  groups: NhomSoan[];
}

export interface DeNoiBoTomTat {
  id: string;
  skill: "reading" | "writing";
  code: string;
  title: string;
  minutes: number;
  questionCount: number;
  /** AI soạn xong, chờ cô xem lại rồi bấm lưu mới giao được. */
  choDuyet: boolean;
  soLanGiao: number;
  updatedAt: string;
}

export const SLUG_TIEN_TO = "rieng-";

/** "IT209 Buổi 5/11" → "it209-buoi-5-11". Bỏ dấu tiếng Việt, chỉ giữ a-z0-9-. */
export function chuanHoaMa(code: string): string {
  return code
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ── Bản soạn → dòng DB ──────────────────────────────────────────────────── */

interface CauDb {
  id: string;
  number: number;
  type: DangCau;
  prompt: string;
  group: string;
  options?: string[];
  maxWords?: number;
}
interface DapAnDb {
  questionId: string;
  answer: string;
  acceptable?: string[];
  explanation?: string;
}

export interface DongDb {
  passage: { title: string; intro?: string; paragraphs: { label?: string; text: string }[] };
  questions: CauDb[];
  answerKey: DapAnDb[];
}

const sach = (s: string) => s.replace(/\r/g, "").trim();
const dong = (s: string) => sach(s).split("\n").map((l) => l.trim()).filter(Boolean);

export class LoiSoan extends Error {}

/**
 * Kiểm và đổi. Mọi lỗi là lỗi cô sửa được, nói rõ câu nào.
 *
 * Chỗ trống của dạng điền từ: cô gõ `___` (ba gạch dưới trở lên) ở đúng chỗ
 * trống; máy đổi thành `7……` — đúng ký hiệu `GAP` trong `GapText.tsx` bên
 * web. Hai bên lệch ký hiệu là ô nhập biến mất (đã sập hai lần, xem CLAUDE.md).
 */
export function soanThanhDong(de: DeSoan, slug: string): DongDb {
  if (!sach(de.passageText)) throw new LoiSoan("Chưa có nội dung bài đọc.");
  if (de.groups.length === 0) throw new LoiSoan("Chưa có nhóm câu nào.");

  const paragraphs = sach(de.passageText)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((text, i) => (de.labelParagraphs ? { label: String.fromCharCode(65 + i), text } : { text }));

  const questions: CauDb[] = [];
  const answerKey: DapAnDb[] = [];
  let n = 0;

  de.groups.forEach((g, gi) => {
    if (g.questions.length === 0) throw new LoiSoan(`Nhóm ${gi + 1} chưa có câu nào.`);
    const tu = n + 1;
    const den = n + g.questions.length;
    const group = `Questions ${tu}-${den}\n${sach(g.instruction)}`;
    const chung = luaChonCoDinh(g.type) ?? (DUNG_DS_CHUNG.includes(g.type) ? g.options.map(sach).filter(Boolean) : null);
    if (chung && chung.length < 2) throw new LoiSoan(`Nhóm ${gi + 1}: cần ít nhất hai lựa chọn trong danh sách.`);

    g.questions.forEach((c) => {
      n += 1;
      const id = `${slug}-q${n}`;
      let prompt = sach(c.prompt);
      const answer = sach(c.answer);
      if (!prompt) throw new LoiSoan(`Câu ${n}: chưa có nội dung.`);
      if (!answer) throw new LoiSoan(`Câu ${n}: chưa có đáp án.`);

      if (g.type === "gap-fill") {
        if (!/_{3,}/.test(prompt)) throw new LoiSoan(`Câu ${n}: đánh dấu chỗ trống bằng ___ (ba dấu gạch dưới).`);
        prompt = prompt.replace(/_{3,}/, `${n}……………`).replace(/_{3,}/g, "……");
        questions.push({ id, number: n, type: g.type, prompt, group, maxWords: Math.max(1, Math.min(5, g.maxWords || 2)) });
        answerKey.push({
          questionId: id,
          answer,
          ...(c.acceptable.filter(Boolean).length ? { acceptable: c.acceptable.map(sach).filter(Boolean) } : {}),
          ...(sach(c.explanation) ? { explanation: sach(c.explanation) } : {}),
        });
        return;
      }

      const options = chung ?? c.options.map(sach).filter(Boolean);
      if (options.length < 2) throw new LoiSoan(`Câu ${n}: cần ít nhất hai lựa chọn.`);
      if (!options.includes(answer)) throw new LoiSoan(`Câu ${n}: đáp án phải là một trong các lựa chọn.`);
      questions.push({ id, number: n, type: g.type, prompt, group, options });
      answerKey.push({ questionId: id, answer, ...(sach(c.explanation) ? { explanation: sach(c.explanation) } : {}) });
    });
  });

  return {
    passage: {
      title: sach(de.passageTitle) || sach(de.title),
      paragraphs,
    },
    questions,
    answerKey,
  };
}

/* ── Dòng DB → bản soạn ──────────────────────────────────────────────────── */

export function dongThanhSoan(meta: { code: string; title: string; minutes: number; description: string }, d: DongDb): DeSoan {
  const key = new Map(d.answerKey.map((k) => [k.questionId, k]));
  const groups: NhomSoan[] = [];
  let last: string | null = null;

  for (const q of d.questions) {
    if (q.group !== last) {
      last = q.group;
      groups.push({
        type: q.type,
        instruction: q.group.split("\n").slice(1).join("\n"),
        options: DUNG_DS_CHUNG.includes(q.type) ? q.options ?? [] : [],
        maxWords: q.maxWords ?? 2,
        questions: [],
      });
    }
    const k = key.get(q.id);
    const prompt =
      q.type === "gap-fill" ? q.prompt.replace(/\d{1,3}\s*[….]{2,}/, "___").replace(/[…]{2,}/g, "___") : q.prompt;
    groups[groups.length - 1].questions.push({
      prompt,
      options: q.type === "multiple-choice" ? q.options ?? [] : [],
      answer: k?.answer ?? "",
      acceptable: k?.acceptable ?? [],
      explanation: k?.explanation ?? "",
    });
  }

  return {
    ...meta,
    passageTitle: d.passage.title,
    passageText: d.passage.paragraphs.map((p) => p.text).join("\n\n"),
    labelParagraphs: d.passage.paragraphs.some((p) => p.label),
    groups,
  };
}

export const deTrong = (): DeSoan => ({
  code: "",
  title: "",
  minutes: 20,
  description: "",
  passageTitle: "",
  passageText: "",
  labelParagraphs: false,
  groups: [],
});

export const nhomMoi = (type: DangCau): NhomSoan => ({
  type,
  instruction: DANG_CAU.find((d) => d.id === type)?.goiY ?? "",
  options: [],
  maxWords: 2,
  questions: [cauMoi(type)],
});

export const cauMoi = (type: DangCau): CauSoan => ({
  prompt: "",
  options: type === "multiple-choice" ? ["A. ", "B. ", "C. ", "D. "] : [],
  answer: "",
  acceptable: [],
  explanation: "",
});

export { dong as tachDong };

/* ── Writing ─────────────────────────────────────────────────────────────── */

/** Id đề Writing nội bộ mang tiền tố riêng để trang soạn biết mở form nào. */
export const WRITING_TIEN_TO = "wn-";
export const laDeWriting = (id: string) => id.startsWith(WRITING_TIEN_TO);

export interface DeWritingSoan {
  title: string;
  task: 1 | 2;
  /** Đề bài đúng như học sinh đọc. */
  prompt: string;
  minWords: number;
  minutes: number;
}

/** Mức mặc định theo Task, đúng chuẩn đề thật. */
export const MAC_DINH_TASK = {
  1: { minWords: 150, minutes: 20 },
  2: { minWords: 250, minutes: 40 },
} as const;
