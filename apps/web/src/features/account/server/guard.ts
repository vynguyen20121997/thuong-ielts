import { redirect } from "next/navigation";
import { conMo, timBaiGiaoTheoToken } from "@thuong-ielts/db";

import { auth } from "../../../auth";
import { isProfileComplete, type StudentWithProfile } from "../domain/types";
import { khachHienTai } from "./khach";
import { getStudentWithProfile } from "./studentRepository";

/**
 * Chốt chặn trước phòng thi.
 *
 * Ba trạng thái, ba đích đến — và thứ tự quan trọng: chưa đăng nhập thì hỏi
 * đăng nhập, đăng nhập rồi mà chưa khai hồ sơ thì hỏi hồ sơ, xong cả hai mới
 * được vào bài.
 *
 * Đặt ở tầng trang chứ không phải middleware: bước kiểm hồ sơ cần đọc DB, mà
 * middleware của Next chạy ở edge runtime — không có `pg` ở đó.
 *
 * `next` là đường dẫn để quay lại đúng chỗ đang định vào, nên học sinh bấm một
 * đề rồi đăng nhập xong là vào thẳng đề đó, không bị ném về trang chủ.
 */
export async function requireStudent(nextPath: string): Promise<StudentWithProfile> {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    redirect(`/dang-nhap?next=${encodeURIComponent(nextPath)}`);
  }

  const student = await getStudentWithProfile(id);

  // Có token hợp lệ nhưng học viên không còn trong DB (bị xoá, hoặc DB vừa
  // được dựng lại). Coi như chưa đăng nhập, đừng ném lỗi vào mặt học sinh.
  if (!student) {
    redirect(`/dang-nhap?next=${encodeURIComponent(nextPath)}`);
  }

  if (!isProfileComplete(student.profile)) {
    redirect(`/ho-so?next=${encodeURIComponent(nextPath)}`);
  }

  return student;
}

/** Dùng cho những chỗ chỉ cần biết "có ai đang đăng nhập không". */
export async function currentStudent(): Promise<StudentWithProfile | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return getStudentWithProfile(id);
}

/**
 * Chốt chặn cho luồng "cô gửi link".
 *
 * Khác `requireStudent` ở hai chỗ, và cả hai đều cố ý:
 *
 * 1. **Không đòi khai hồ sơ.** Cô gửi link giữa buổi dạy; bắt cả lớp khai
 *    tuổi/nghề/target trước khi vào là chặn đứng buổi học. Hồ sơ vẫn hỏi ở
 *    luồng học sinh tự vào luyện.
 * 2. **Chấp nhận khách gõ tên** — nhưng chỉ khi token có thật, còn mở, và cô
 *    đã bật cho khách. Thiếu một trong ba thì đây thành cửa hậu bỏ qua đăng
 *    nhập của cả trang.
 *
 * Không có token hợp lệ thì rơi về `requireStudent` như bình thường.
 */
export async function requireStudentOrGuest(
  nextPath: string,
  token: string | undefined
): Promise<void> {
  if (!token) {
    await requireStudent(nextPath);
    return;
  }

  const bai = await timBaiGiaoTheoToken(token);
  if (!bai || !conMo(bai)) {
    // Link hỏng hoặc đã đóng: đưa về trang link để đọc lời giải thích tử tế,
    // thay vì im lặng đá sang màn đăng nhập.
    redirect(`/vao/${encodeURIComponent(token)}`);
  }

  const session = await auth();
  if (session?.user?.id) return;

  if (bai.allowGuest && (await khachHienTai())) return;

  redirect(`/vao/${encodeURIComponent(token)}`);
}
