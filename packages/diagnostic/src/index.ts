/*
  Bộ chấm VÀ bộ nhận xét của bài kiểm tra nền, dùng chung cho `apps/web` (học
  sinh làm bài) và `apps/admin` (cô xem lại, chấm lại).

  Phải là MỘT bản cài đặt: nếu admin tự viết lại cách chấm thì sẽ có ngày điểm
  trên trang học sinh và điểm cô nhìn thấy khác nhau, mà không ai biết bên nào
  đúng. Đề (`exam.json`) và phiên bản quy tắc cũng ở đây vì cùng lý do.

  Chấm điểm và nhận xét nằm chung một package, không tách hai, vì `RULES_VERSION`
  đánh số cho cả hai: một lượt được lưu kèm phiên bản quy tắc lúc chấm, mà quy
  tắc đó gồm cả ngưỡng của `roadmap.ts`/`verdict.ts`. Tách ra thì con số ấy
  không còn nói được nó đang đánh số cho cái gì.

  KHÔNG đưa gì dính tới React hay `pg` vào package này.
*/

/* Chấm bài: từ đáp án thô ra điểm và nhận xét từng nhóm nội dung. */
export {
  exam,
  grade,
  mismatchedAnswerIds,
  normalize,
  publicPaper,
  type Exam,
} from "./scoring";

/* Hồ sơ đầu vào: nguồn duy nhất của cả lựa chọn trên form lẫn luật kiểm tra. */
export {
  DAILY_MINUTES,
  DEFAULT_DAILY_MINUTES,
  EXAM_TIMINGS,
  LEVELS,
  NEEDS_MONTH,
  NEEDS_SCORE,
  PURPOSES,
  STUDY_DAYS_PER_WEEK,
  TARGETS,
  checkProfile,
  emptyProfile,
  monthsUntilExam,
  type ProfileCheck,
} from "./profile";

/* Lộ trình ôn tập: kết quả + hồ sơ ra các chặng và độ dài từng chặng. */
export {
  buildRoadmap,
  roadmapToText,
  type Phase,
  type Roadmap,
  type Skill,
  type Standing,
} from "./roadmap";

/* Nhận xét tổng hợp: 3 điểm mạnh + 3 điểm yếu, mỗi chỗ yếu gắn vào một chặng. */
export {
  buildVerdict,
  verdictToText,
  type Highlight,
  type Verdict,
} from "./verdict";

/* Phần Writing: đề, thang bốn tiêu chí và cách quy band. */
export {
  GRADER_CONTEXT,
  WRITING_CRITERIA,
  WRITING_TASK,
  adviceFor,
  bandFromLevel,
  countWords,
  overallBand,
  roundBand,
  tooShortToGrade,
  type Criterion,
  type CriterionId,
  type CriterionScore,
  type WritingResult,
  type WritingState,
} from "./writing";

export { RULES_VERSION } from "./rules";
export type * from "./types";
