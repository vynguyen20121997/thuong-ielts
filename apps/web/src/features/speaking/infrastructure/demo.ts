import type { SpeakingResult } from "../domain/types";

/*
  Kết quả MẪU để xem giao diện bảng điểm khi chưa có bộ chấm. Chỉ dùng ở môi
  trường dev (`?demo=1`), route production không bao giờ đọc file này — cùng
  cách làm với nút "Tạo học sinh ảo" của bài kiểm tra nền.
*/
export const DEMO_RESULT: SpeakingResult = {
  questionId: "p2-skill-older-person",
  durationSeconds: 112,
  transcript:
    "I'd like to talk about cooking, which I learned from my grandmother when I was about twelve. Every weekend she teach me how to prepare traditional dishes, especially phở… um she was very patient and she always explain why each step matters. Nowadays this skill is useful because I live alone and cooking saves me a fortune compared to eating out.",
  marks: [
    { start: 98, end: 103, kind: "error", fix: "taught" },
    { start: 157, end: 159, kind: "error", fix: "bỏ từ đệm" },
    { start: 199, end: 206, kind: "error", fix: "explained" },
    { start: 290, end: 308, kind: "good" },
  ],
  criteria: [
    { id: "FC", band: 6, confidence: 0.72 },
    { id: "LR", band: 6, confidence: 0.68 },
    { id: "GRA", band: 5, confidence: 0.81 },
    { id: "P", band: 6.5, confidence: null },
  ],
  overall: 6,
  notes: {
    GRA: "Thì quá khứ bị rơi ở 2 chỗ: teach → taught, explain → explained. Kể chuyện cũ thì toàn bài phải ở quá khứ đơn.",
    FC: '3 lần "um" trong 1:52. Thay bằng cụm câu giờ: "Let me think…", "What I mean is…".',
    P: 'Rõ và dễ theo. Âm cuối /s/ ở "matters", "saves" còn nuốt.',
  },
  gradedAt: "2026-09-24T10:00:00Z",
};
