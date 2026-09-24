import type { PracticeSkill } from "./types";

/**
 * The four IELTS skills shown in "Kiểm tra kiến thức IELTS".
 * Cả bốn kỹ năng đang mở. Riêng Speaking chưa có bộ chấm tự động — xem chú
 * thích trong `features/speaking/application/ports.ts`.
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
      "Đề Task 2 có bấm giờ và đếm từ. Viết xong bấm một nút để soi trước lỗi bố cục, lạc đề, thiếu ví dụ — trước khi gửi cô chấm theo barem.",
    href: "/kiem-tra-kien-thuc/writing",
    status: "available",
    hint: "Checklist trước khi nộp",
  },
  {
    id: "speaking",
    name: "Speaking",
    label: "Nói",
    description:
      "Bộ đề Part 1-2-3 theo quý, thu âm ngay trên trang. Luyện phát triển ý cho Part 3, hoặc bốc chủ đề ngẫu nhiên có kiến thức nền và từ vựng.",
    href: "/kiem-tra-kien-thuc/speaking",
    status: "available",
    hint: "Thu âm trên trang",
  },
];

export const READING_SKILL = PRACTICE_SKILLS[0];
