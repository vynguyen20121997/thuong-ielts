/**
 * Danh tính học viên — tầng domain.
 *
 * Thuần kiểu và luật, không React, không fetch, không `pg`. Giống
 * `features/practice/domain`: mọi tầng khác phụ thuộc vào file này, còn file
 * này không phụ thuộc vào đâu.
 */

export type AuthProvider = "google" | "facebook" | "phone";

export type Occupation = "student" | "worker" | "teacher";

export const OCCUPATION_LABELS: Record<Occupation, string> = {
  student: "Học sinh / sinh viên",
  worker: "Người đi làm",
  teacher: "Giáo viên",
};

export interface Student {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
}

/** Hồ sơ hỏi sau lần đăng nhập đầu. Chưa xong thì chưa cho vào phòng thi. */
export interface StudentProfile {
  age?: number;
  occupation?: Occupation;
  targetBand?: number;
  /** Có mốc này nghĩa là đã điền đủ. */
  completedAt?: string;
}

export interface StudentWithProfile extends Student {
  profile: StudentProfile | null;
}

/* ------------------------------------------------------------------ *
 * Luật hồ sơ
 * ------------------------------------------------------------------ */

export const MIN_AGE = 6;
export const MAX_AGE = 100;

/** Band IELTS chạy theo nửa điểm; dưới 4.0 thì đặt mục tiêu không có ý nghĩa. */
export const TARGET_BANDS = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export function isProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return Boolean(profile.age && profile.occupation && profile.targetBand);
}

export interface ProfileInput {
  age: number;
  occupation: Occupation;
  targetBand: number;
}

/**
 * Kiểm hồ sơ trước khi ghi. Trả về lỗi theo từng trường để màn hình chỉ đúng
 * ô sai, thay vì một câu "dữ liệu không hợp lệ" chẳng giúp được gì.
 */
export function validateProfile(input: Partial<ProfileInput>): Partial<Record<keyof ProfileInput, string>> {
  const errors: Partial<Record<keyof ProfileInput, string>> = {};

  if (!input.age || !Number.isInteger(input.age)) {
    errors.age = "Nhập tuổi của bạn.";
  } else if (input.age < MIN_AGE || input.age > MAX_AGE) {
    errors.age = `Tuổi phải trong khoảng ${MIN_AGE}–${MAX_AGE}.`;
  }

  if (!input.occupation || !(input.occupation in OCCUPATION_LABELS)) {
    errors.occupation = "Chọn một nghề nghiệp.";
  }

  if (!input.targetBand) {
    errors.targetBand = "Chọn band mục tiêu.";
  } else if (!TARGET_BANDS.includes(input.targetBand)) {
    errors.targetBand = "Band mục tiêu không hợp lệ.";
  }

  return errors;
}

/* ------------------------------------------------------------------ *
 * Số điện thoại
 *
 * Học sinh gõ "0912345678" hoặc "+84 912 345 678" hay "84912345678" đều là
 * một số. Chuẩn hoá về E.164 ngay từ tầng domain để DB chỉ có một dạng —
 * nếu không thì cùng một người sẽ đẻ ra ba tài khoản.
 * ------------------------------------------------------------------ */

/** "0912345678" -> "+84912345678"; số không hợp lệ -> null. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");

  let national: string;
  if (digits.startsWith("+84")) national = digits.slice(3);
  else if (digits.startsWith("84")) national = digits.slice(2);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else national = digits;

  // Di động Việt Nam sau mã vùng: 9 chữ số, bắt đầu bằng 3/5/7/8/9.
  if (!/^[35789]\d{8}$/.test(national)) return null;
  return `+84${national}`;
}

/** "+84912345678" -> "0912 345 678", để hiện lại cho người dùng đọc. */
export function formatPhone(e164: string): string {
  const national = e164.replace(/^\+84/, "0");
  return national.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}
