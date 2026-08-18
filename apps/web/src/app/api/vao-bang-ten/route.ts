import { NextResponse } from "next/server";
import { conMo, timBaiGiaoTheoToken } from "@thuong-ielts/db";

import { datKhach } from "../../../features/account/server/khach";

/**
 * Khách gõ tên để vào.
 *
 * CHỈ mở cho luồng link cô gửi, và chỉ khi cô bật. Token phải hợp lệ, phải còn
 * mở, và phải cho khách — nếu không thì đây là một cửa hậu cho phép bất kỳ ai
 * bỏ qua bước đăng nhập của cả trang.
 */
export async function POST(request: Request) {
  let body: { token?: unknown; ten?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const bai = await timBaiGiaoTheoToken(String(body.token ?? ""));
  if (!bai || !conMo(bai)) {
    return NextResponse.json({ error: "Buổi học này đã kết thúc." }, { status: 404 });
  }
  if (!bai.allowGuest) {
    return NextResponse.json(
      { error: "Buổi này cần đăng nhập bằng tài khoản." },
      { status: 403 }
    );
  }

  const ten = String(body.ten ?? "").trim();
  if (ten.length < 2) {
    return NextResponse.json({ error: "Tên ngắn quá." }, { status: 400 });
  }

  await datKhach(ten);
  return NextResponse.json({ ok: true });
}
