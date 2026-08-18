import { NextResponse } from "next/server";
import { dongBaiGiao } from "@thuong-ielts/db";

import { teacherHienTai } from "../../../../lib/phien";

/**
 * Đóng một bài giao — không xoá.
 *
 * Xoá thì mất luôn liên kết tới những lượt học sinh đã làm, mà bảng điểm buổi
 * đó thì cô vẫn cần. Đóng chỉ ngăn người mới vào.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacherId = await teacherHienTai();
  await dongBaiGiao(id, teacherId);
  return NextResponse.json({ ok: true });
}
