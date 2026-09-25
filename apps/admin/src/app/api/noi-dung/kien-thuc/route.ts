import { teacherHienTai } from "../../../../lib/phien";
import { suaKienThuc, themKienThuc, xoaKienThuc } from "../../../../lib/noiDungGhi";
import { chay, docBody, layId } from "../_tra";

/** Kiến thức nền cho một đề Writing. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    return { id: await themKienThuc(await docBody(request)) };
  });
}

export async function PATCH(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await suaKienThuc(layId(body, "knowledgeId", "mã mục"), body);
    return null;
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await xoaKienThuc(layId(body, "knowledgeId", "mã mục"));
    return null;
  });
}
