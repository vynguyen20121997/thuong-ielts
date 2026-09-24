import type { Part } from "./types";

/*
  Mọi mốc giờ của Speaking ở một chỗ. UI chỉ đọc, không tự rải số.

  Theo thi thật: Part 2 có 1 phút chuẩn bị, nói 1–2 phút. Part 1 và 3 không
  có thời gian chuẩn bị, mỗi câu trả lời ngắn — trần 45 giây để học sinh
  không lan man, đúng nhịp giám khảo ngắt.
*/
export const PREP_SECONDS: Record<Part, number> = { 1: 0, 2: 60, 3: 0 };

export const TALK_SECONDS: Record<Part, number> = { 1: 45, 2: 120, 3: 60 };

/** Chỉ cho thu lại đúng một lần — hơn thế là luyện đọc thuộc, không phải nói. */
export const MAX_RETAKES = 1;

/*
  Bốc chủ đề: thời gian đọc kiến thức nền trước Q&A, theo sheet của cô:
  Part 1 năm phút, Part 2 tám phút, Part 3 mười phút.
*/
export const STUDY_SECONDS: Record<Part, number> = {
  1: 5 * 60,
  2: 8 * 60,
  3: 10 * 60,
};

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
