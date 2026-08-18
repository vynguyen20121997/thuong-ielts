import { NextResponse } from "next/server";
import { banNhip, conMo, maLop, timBaiGiaoTheoToken } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../features/account/server/guard";
import { khachHienTai } from "../../../../../features/account/server/khach";
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
 *
 * Hai loại người làm bài: học sinh có tài khoản, và khách vào bằng link cô gửi.
 * Khách chỉ được nhận khi token có thật, còn mở, và cô đã bật cho khách —
 * thiếu một trong ba thì đây thành cửa hậu bỏ qua đăng nhập của cả trang.
 */
export async function POST(request: Request) {
  let body: { skill?: unknown; scope?: unknown; target?: unknown; token?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : null;
  const bai = token ? await timBaiGiaoTheoToken(token) : null;
  const baiConMo = bai ? conMo(bai) : false;

  const student = await currentStudent();
  const khach = student || !bai || !baiConMo || !bai.allowGuest ? null : await khachHienTai();

  if (!student && !khach) {
    return NextResponse.json({ error: "Cần đăng nhập trước khi làm bài." }, { status: 401 });
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
    studentId: student?.id ?? null,
    guestName: khach?.ten ?? null,
    guestKey: khach?.key ?? null,
    // Chỉ gắn vào bài giao khi nó còn mở VÀ đúng đề — link của buổi khác thì
    // không được kéo lượt này vào bảng điểm buổi đó.
    assignmentId: bai && baiConMo && bai.target === target ? bai.id : null,
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
    pham: scope,
    ten: student?.name ?? khach?.ten ?? "Học viên",
    khach: !student,
    d: 0,
    c: 0,
    t: de.questionCount,
    marks: new Array(de.questionCount).fill(null),
    conLai: luot.conLai,
  });

  return NextResponse.json({ attemptId: luot.id, conLai: luot.conLai, total: luot.total });
}
