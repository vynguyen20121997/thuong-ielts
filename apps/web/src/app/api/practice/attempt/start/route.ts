import { NextResponse } from "next/server";
import { banNhip, maLop } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../features/account/server/guard";
import { openAttempt } from "../../../../../features/practice/server/attemptRepository";
import { lookupPaper, type Scope, type Skill } from "../../../../../features/practice/server/paperLookup";

/**
 * Mở một lượt làm bài.
 *
 * Gọi lúc học sinh bấm bắt đầu, trước khi câu hỏi hiện ra. Từ giây này trở đi
 * lượt đã tồn tại trong DB, nên cô mở bảng lớp là thấy em ấy — kể cả khi em ấy
 * chưa trả lời câu nào.
 *
 * `expires_at` do server đặt. Đồng hồ trong trình duyệt vẫn chạy cho học sinh
 * nhìn, nhưng nó chỉ là bản sao: mọi con số thời gian cô thấy đều tính từ cột
 * kia, nên học sinh tắt mạng thì đồng hồ máy em ấy đứng chứ giờ thi thì không.
 */
export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) {
    return NextResponse.json({ error: "Cần đăng nhập trước khi làm bài." }, { status: 401 });
  }

  let body: { skill?: unknown; scope?: unknown; target?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const skill = body.skill === "listening" ? "listening" : ("reading" as Skill);
  const scope = body.scope === "paper" ? "paper" : ("test" as Scope);
  const target = String(body.target ?? "");

  const de = await lookupPaper(skill, scope, target);
  if (!de) {
    return NextResponse.json({ error: "Không tìm thấy đề này." }, { status: 404 });
  }

  const luot = await openAttempt({
    skill,
    scope,
    target,
    title: de.title,
    studentId: student.id,
    questionCount: de.questionCount,
    durationSeconds: de.durationSeconds,
  });

  // Báo cô có em vừa vào phòng. Không chờ kết quả: nhịp hỏng thì bài thi vẫn
  // phải bắt đầu đúng giờ.
  void banNhip({
    loai: "vao",
    a: luot.id,
    target,
    lop: maLop(target),
    ten: student.name ?? "Học viên",
    khach: false,
    d: 0,
    c: 0,
    t: de.questionCount,
    marks: new Array(de.questionCount).fill(null),
    conLai: luot.conLai,
  });

  return NextResponse.json({ attemptId: luot.id, conLai: luot.conLai, total: luot.total });
}
