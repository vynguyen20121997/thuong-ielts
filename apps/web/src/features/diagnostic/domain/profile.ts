/*
  Hồ sơ đầu vào của bài kiểm tra nền nằm ở `@thuong-ielts/diagnostic`. File này
  chỉ còn là cầu nối, giữ nguyên mọi import cũ trong `features/diagnostic/**`
  và ở `app/api/diagnostic/route.ts`.

  Cố ý liệt kê từng tên thay vì `export *`: ba cầu nối cùng trỏ vào một package,
  dùng `export *` thì file nào cũng xuất ra mọi thứ và `import { checkProfile }
  from "../domain/roadmap"` sẽ chạy ngon lành. Lúc đó thư mục `domain/` hết là
  bản đồ của chính nó.
*/
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
} from "@thuong-ielts/diagnostic";
