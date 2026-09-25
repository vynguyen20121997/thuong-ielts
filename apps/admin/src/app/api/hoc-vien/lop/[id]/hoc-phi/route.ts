import { teacherHienTai } from "../../../../../../lib/phien";
import { LoiNhap, ghiNhanDong, xoaLanDong } from "../../../../../../lib/hocVienGhi";
import { chay, docBody } from "../../../_tra";

/** Ghi nhận một lần đóng học phí, hoặc xoá một lần ghi nhầm. */
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return chay(async () => {
    const { id } = await params;
    const teacherId = await teacherHienTai();
    const paymentId = await ghiNhanDong(teacherId, id, await docBody(request));
    return { id: paymentId };
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    const body = await docBody(request);
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
    if (!paymentId) throw new LoiNhap("Thiếu mã lần đóng.");
    await xoaLanDong(teacherId, paymentId);
    return null;
  });
}
