import { teacherHienTai } from "../../../../../../lib/phien";
import { LoiNhap, suaHocVien, themHocVien } from "../../../../../../lib/hocVienGhi";
import { chay, docBody } from "../../../_tra";

/**
 * Học viên trong lớp.
 *
 * POST = thêm vào lớp. PATCH = sửa mức học phí riêng, ghi chú, hoặc đặt ngày
 * nghỉ. Không có DELETE: cho nghỉ là đặt `leftOn`, không xoá dòng — học phí
 * đã đóng và nhận xét cũ của em ấy phải còn nguyên.
 */
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return chay(async () => {
    const { id } = await params;
    const teacherId = await teacherHienTai();
    const body = await docBody(request);
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    if (!studentId) throw new LoiNhap("Thiếu mã học viên.");
    await themHocVien(teacherId, id, studentId);
    return null;
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return chay(async () => {
    const { id } = await params;
    const teacherId = await teacherHienTai();
    const body = await docBody(request);
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    if (!studentId) throw new LoiNhap("Thiếu mã học viên.");
    await suaHocVien(teacherId, id, studentId, body);
    return null;
  });
}
