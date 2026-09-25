import { teacherHienTai } from "../../../../lib/phien";
import { LoiNhap, suaNhanXet, themNhanXet, xoaNhanXet } from "../../../../lib/hocVienGhi";
import { chay, docBody } from "../_tra";

/**
 * Nhận xét riêng về học viên.
 *
 * Mặc định chỉ cô đọc được. Bật `sharedWithStudent` là thao tác có chủ đích
 * cho TỪNG dòng — xem ghi chú ở `class-schema.sql`.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    const id = await themNhanXet(teacherId, await docBody(request));
    return { id };
  });
}

export async function PATCH(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    const body = await docBody(request);
    const noteId = typeof body.noteId === "string" ? body.noteId : "";
    if (!noteId) throw new LoiNhap("Thiếu mã nhận xét.");
    await suaNhanXet(teacherId, noteId, body);
    return null;
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    const body = await docBody(request);
    const noteId = typeof body.noteId === "string" ? body.noteId : "";
    if (!noteId) throw new LoiNhap("Thiếu mã nhận xét.");
    await xoaNhanXet(teacherId, noteId);
    return null;
  });
}
