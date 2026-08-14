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
      "Đề nghe 4 section như thi thật, có file nghe ngay trên trang, được tua và nghe lại. Nộp bài là có điểm và band ước lượng.",
    href: "/kiem-tra-kien-thuc/listening",
    status: "available",
    hint: "Có file nghe",
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
