import type { Profile } from "./types";

/*
  Danh sách lựa chọn và luật kiểm tra của form thông tin học viên, để CLIENT và
  SERVER dùng CHUNG một nguồn.

  Trước đây form liệt kê lựa chọn ở `Diagnostic.tsx` còn `route.ts` tự viết lại
  mảng `purposes` của riêng nó — thêm một mục ở form là server lặng lẽ từ chối.
  Mọi lựa chọn mới chỉ được thêm ở file này.
*/

export const LEVELS = [
  "Chưa học IELTS, nền tảng tiếng Anh còn yếu",
  "Chưa học IELTS, đã có nền tảng tiếng Anh",
  "Đang học IELTS, chưa có điểm thi",
  "Đã có điểm IELTS",
  "Chưa rõ trình độ",
] as const;

export const TARGETS = [
  "Chưa xác định",
  "5.0",
  "5.5",
  "6.0",
  "6.5",
  "7.0",
  "7.5",
  "8.0",
  "8.5+",
] as const;

export const PURPOSES = [
  "Nộp thi đại học",
  "Đi du học",
  "Đi xin việc",
  "Khác",
] as const;

export const EXAM_TIMINGS = [
  "Trong 1 tháng",
  "Trong 1–3 tháng",
  "Trong 3–6 tháng",
  "Sau hơn 6 tháng",
  "Chưa có kế hoạch",
  "Chọn tháng/năm cụ thể",
] as const;

/* Nhãn hiển thị → số phút thật. "Chưa rõ" trả 0 để nơi dùng tự lấy mặc định. */
export const DAILY_MINUTES: { label: string; minutes: number }[] = [
  { label: "15 phút", minutes: 15 },
  { label: "30 phút", minutes: 30 },
  { label: "45 phút", minutes: 45 },
  { label: "60 phút", minutes: 60 },
  { label: "Chưa rõ", minutes: 0 },
];

/* Mặc định của đặc tả khi học sinh chưa rõ: 30 phút/ngày, 6 ngày/tuần. */
export const DEFAULT_DAILY_MINUTES = 30;
export const STUDY_DAYS_PER_WEEK = 6;

export const NEEDS_SCORE = "Đã có điểm IELTS";
export const NEEDS_MONTH = "Chọn tháng/năm cụ thể";

export const emptyProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  level: "",
  ieltsScore: "",
  ieltsDate: "",
  target: "",
  purpose: "",
  examTiming: "",
  examMonth: "",
  dailyMinutes: 0,
  consent: false,
  contactOptIn: false,
};

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export type ProfileCheck =
  { ok: true; profile: Profile } | { ok: false; error: string };

/*
  Trả về lỗi ĐẦU TIÊN gặp phải, viết cho học sinh đọc chứ không phải cho lập
  trình viên: form đã đánh dấu trường bắt buộc, thông báo ở đây chỉ để phòng
  khi request tới thẳng API.
*/
export function checkProfile(raw: unknown): ProfileCheck {
  const p = (raw ?? {}) as Record<string, unknown>;
  const name = text(p.name, 150);
  const email = text(p.email, 254);
  const level = text(p.level, 120);
  const target = text(p.target, 100);
  const purpose = text(p.purpose, 100);
  const examTiming = text(p.examTiming, 100);

  if (!name) return { ok: false, error: "Vui lòng nhập họ và tên." };
  if (!/^\S+@\S+\.\S+$/.test(email))
    return { ok: false, error: "Email chưa đúng định dạng." };
  if (!(LEVELS as readonly string[]).includes(level))
    return { ok: false, error: "Vui lòng chọn trình độ hiện tại." };
  if (!(TARGETS as readonly string[]).includes(target))
    return { ok: false, error: "Vui lòng chọn mục tiêu." };
  if (!(PURPOSES as readonly string[]).includes(purpose))
    return { ok: false, error: "Vui lòng chọn mục đích học IELTS." };
  if (!(EXAM_TIMINGS as readonly string[]).includes(examTiming))
    return { ok: false, error: "Vui lòng chọn thời gian dự kiến thi." };
  if (p.consent !== true)
    return {
      ok: false,
      error: "Cần đồng ý cho phép lưu kết quả để tạo báo cáo.",
    };

  const examMonth = text(p.examMonth, 20);
  if (examTiming === NEEDS_MONTH && !/^\d{4}-\d{2}$/.test(examMonth))
    return { ok: false, error: "Vui lòng chọn tháng/năm dự kiến thi." };

  const minutes = Number(p.dailyMinutes);
  return {
    ok: true,
    profile: {
      name,
      email,
      phone: text(p.phone, 30),
      level,
      /*
        Điểm IELTS tự khai chỉ để giáo viên đọc, không tham gia chấm bài — nên
        nhận nguyên văn, không ép định dạng.
      */
      ieltsScore: level === NEEDS_SCORE ? text(p.ieltsScore, 20) : "",
      ieltsDate: level === NEEDS_SCORE ? text(p.ieltsDate, 20) : "",
      target,
      purpose,
      examTiming,
      examMonth: examTiming === NEEDS_MONTH ? examMonth : "",
      dailyMinutes:
        Number.isFinite(minutes) && minutes >= 0 && minutes <= 600
          ? Math.round(minutes)
          : 0,
      consent: true,
      contactOptIn: p.contactOptIn === true,
    },
  };
}

/*
  Số THÁNG còn lại tới kỳ thi. null = học sinh chưa ràng buộc ngày nào, lộ
  trình cứ chạy theo độ dài tự nhiên của nó.
*/
export function monthsUntilExam(profile: Profile, from: Date): number | null {
  switch (profile.examTiming) {
    case "Trong 1 tháng":
      return 1;
    case "Trong 1–3 tháng":
      return 3;
    case "Trong 3–6 tháng":
      return 6;
    case NEEDS_MONTH: {
      if (!profile.examMonth) return null;
      const [y, m] = profile.examMonth.split("-").map(Number);
      if (!y || !m) return null;
      const months = (y - from.getFullYear()) * 12 + (m - 1 - from.getMonth());
      return months > 0 ? months : 1;
    }
    default:
      return null;
  }
}
