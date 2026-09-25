import { teacherHienTai } from "../../../../lib/phien";
import { taoLop } from "../../../../lib/hocVienGhi";
import { chay, docBody } from "../_tra";

/** Tạo một lớp mới. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    const id = await taoLop(teacherId, await docBody(request));
    return { id };
  });
}
