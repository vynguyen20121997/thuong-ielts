import { teacherHienTai } from "../../../../../lib/phien";
import { suaLop } from "../../../../../lib/hocVienGhi";
import { chay, docBody } from "../../_tra";

/** Sửa lớp: tên, ghi chú, mức học phí, chu kỳ, thời gian, đóng/mở lớp. */
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return chay(async () => {
    const { id } = await params;
    const teacherId = await teacherHienTai();
    await suaLop(teacherId, id, await docBody(request));
    return null;
  });
}
