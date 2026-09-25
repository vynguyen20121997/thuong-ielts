import { NextResponse } from "next/server";

import { auth } from "../../../../auth";
import {
  khaiDaChuyen,
  lopCuaHocVien,
} from "../../../../features/tuition/server/tuitionRepository";

/**
 * Học sinh báo đã chuyển khoản.
 *
 * KHÔNG nhận số tiền từ client. Số tiền lấy từ mức học phí của chính lớp đó
 * trong DB — để client gửi kèm là mở đường cho "tôi đã chuyển 10.000 đ" ghi
 * thẳng vào sổ. Em ấy chỉ nói được MỘT điều: tôi đã chuyển cho lớp này, kỳ này.
 *
 * Danh tính lấy từ phiên, không bao giờ từ body.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  }

  let body: { classId?: unknown; period?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const classId = typeof body.classId === "string" ? body.classId : "";
  const period =
    typeof body.period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(body.period)
      ? body.period
      : null;
  if (!classId) {
    return NextResponse.json({ error: "Thiếu mã lớp." }, { status: 400 });
  }

  const lop = (await lopCuaHocVien(studentId)).find(
    (l) => l.classId === classId && !l.daNghi,
  );
  if (!lop) {
    return NextResponse.json({ error: "Bạn không học lớp này." }, { status: 403 });
  }
  if (!lop.hocPhi) {
    return NextResponse.json(
      { error: "Cô chưa đặt mức học phí cho lớp này." },
      { status: 400 },
    );
  }

  const ket = await khaiDaChuyen(studentId, classId, period, lop.hocPhi);
  if (!ket.ok) {
    return NextResponse.json({ error: ket.lyDo }, { status: 400 });
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
