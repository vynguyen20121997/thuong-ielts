import type { PracticeSkill } from "./types";

/**
 * The four IELTS skills shown in "Kiểm tra kiến thức IELTS".
 * Only Reading is `available` today; the rest render as disabled cards.
 * Flipping one on is a one-word change here — no UI edit required, because the
 * cards read their enabled/disabled state from this list.
 */
export const PRACTICE_SKILLS: PracticeSkill[] = [
  {
    id: "reading",
    name: "Reading",
    label: "Đọc hiểu",
    description:
      "Luyện đọc theo từng dạng câu hỏi: True/False/Not Given, Matching Headings, điền từ. Chấm điểm và giải thích ngay khi nộp bài.",
    href: "/kiem-tra-kien-thuc/reading",
    status: "available",
    hint: "Bài tập theo dạng",
  },
  {
    id: "listening",
    name: "Listening",
    label: "Nghe hiểu",
    description:
      "Bài nghe theo section, có transcript và tua lại từng câu. Đang được biên soạn cùng cô Thương.",
    href: "/kiem-tra-kien-thuc/listening",
    status: "coming-soon",
    hint: "Sắp ra mắt",
  },
  {
    id: "writing",
    name: "Writing",
    label: "Viết",
    description:
      "Task 1 & Task 2 kèm dàn ý mẫu, band descriptors và nhận xét chi tiết cho từng bài viết.",
    href: "/kiem-tra-kien-thuc/writing",
    status: "coming-soon",
    hint: "Sắp ra mắt",
  },
  {
    id: "speaking",
    name: "Speaking",
    label: "Nói",
    description:
      "Bộ đề Part 1-2-3 mới nhất theo quý, có gợi ý ý tưởng và từ vựng theo chủ đề.",
    href: "/kiem-tra-kien-thuc/speaking",
    status: "coming-soon",
    hint: "Sắp ra mắt",
  },
];

export const READING_SKILL = PRACTICE_SKILLS[0];
