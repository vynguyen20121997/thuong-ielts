/*
  Bộ chấm dùng chung với trang quản trị — xem `packages/diagnostic`. Giữ file
  này làm cầu nối để `route.ts` và các script check không phải đổi import.
*/
export {
  exam,
  grade,
  mismatchedAnswerIds,
  normalize,
  publicPaper,
  type Exam,
} from "@thuong-ielts/diagnostic";
