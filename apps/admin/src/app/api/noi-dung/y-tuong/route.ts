import { teacherHienTai } from "../../../../lib/phien";
import { suaYTuong, themYTuong, xoaYTuong } from "../../../../lib/noiDungGhi";
import { chay, docBody, layId } from "../_tra";

/** Ngân hàng ý cho một đề Writing — mục "Idea Development" học sinh thấy. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    return { id: await themYTuong(await docBody(request)) };
  });
}

export async function PATCH(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await suaYTuong(layId(body, "ideaId", "mã luận điểm"), body);
    return null;
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await xoaYTuong(layId(body, "ideaId", "mã luận điểm"));
    return null;
  });
}
