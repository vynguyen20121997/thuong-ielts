import { NextResponse } from "next/server";
import { docKhoaLop, moKetQua } from "@thuong-ielts/db";

import { teacherHienTai } from "../../../../../lib/phien";

/**
 * Cô bấm mở điểm/đáp án cho cả lớp.
 *
 * Chỉ có nghĩa với bài cô giao — em tự luyện vốn luôn xem được, không có gì
 * để mở. Mở rồi thì không đóng lại: sau khi cả lớp đã nhìn thấy đáp án thì
 * đóng lại chẳng giấu được gì, chỉ làm học sinh bối rối.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  const teacherId = await teacherHienTai();

  const k = docKhoaLop(target);
  if (!k || k.loai !== "bai-giao") {
    return NextResponse.json({ error: "Lớp này không có bài giao để mở." }, { status: 400 });
  }

  await moKetQua(k.id, teacherId);
  return NextResponse.json({ ok: true });
}
