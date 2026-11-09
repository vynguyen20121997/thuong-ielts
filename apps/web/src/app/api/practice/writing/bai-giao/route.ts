import { NextResponse } from "next/server";
import { duocXem, timBaiGiaoTheoToken } from "@thuong-ielts/db";

import { currentStudent } from "../../../../../features/account/server/guard";
import { khachHienTai } from "../../../../../features/account/server/khach";
import {
  LoiNop,
  baiNopCua,
  chamBai,
  deCuaBaiGiao,
  nopBai,
} from "../../../../../features/practice/server/writingAssignment";

/**
 * Bài Writing cô giao. Hai việc, tách đúng như Section 4 của bài kiểm tra nền:
 *
 *   { action: "nop",  token, essay, elapsedSeconds } — lưu bài, trả về ngay
 *   { action: "cham", token }                          — chấm band bài của CHÍNH mình
 *
 * Người làm lấy từ phiên (tài khoản hoặc cookie khách), không lấy từ body.
 * Band chỉ trả về khi cô cho xem (`duocXem`); không thì vẫn chấm và lưu để
 * cô đọc, nhưng học sinh nhận `an: true`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { action?: unknown; token?: unknown; essay?: unknown; elapsedSeconds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const bai = token ? await timBaiGiaoTheoToken(token) : null;
  if (!bai || bai.skill !== "writing") {
    return NextResponse.json({ error: "Không tìm thấy bài này." }, { status: 404 });
  }
  const de = await deCuaBaiGiao(bai);
  if (!de) return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });

  const student = await currentStudent();
  const khach = student ? null : await khachHienTai();
  if (!student && !(khach && bai.allowGuest)) {
    return NextResponse.json({ error: "Em cần vào bằng link cô gửi trước." }, { status: 401 });
  }
  const ai = { studentId: student?.id ?? null, guestKey: khach?.key ?? null, guestName: khach?.ten ?? null };

  if (body.action === "nop") {
    const essay = typeof body.essay === "string" ? body.essay : "";
    if (essay.length > 12000) return NextResponse.json({ error: "Bài viết quá dài." }, { status: 413 });
    try {
      const kq = await nopBai({
        bai,
        de,
        ai,
        essay,
        elapsedSeconds: typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : 0,
      });
      return NextResponse.json(kq);
    } catch (err) {
      if (err instanceof LoiNop) return NextResponse.json({ error: err.message }, { status: 409 });
      throw err;
    }
  }

  if (body.action === "cham") {
    const baiNop = await baiNopCua(bai.id, ai);
    if (!baiNop) return NextResponse.json({ error: "Em chưa nộp bài." }, { status: 404 });
    const state = await chamBai(baiNop, de);
    return NextResponse.json(duocXem(bai).diem ? { writing: state } : { an: true });
  }

  return NextResponse.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
}
