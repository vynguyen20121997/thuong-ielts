import { teacherHienTai } from "../../../../lib/phien";
import { suaDeWriting, taoDeWriting, xoaDeWriting } from "../../../../lib/noiDungGhi";
import { chay, docBody, layId } from "../_tra";

/** Đề Writing. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    return { id: await taoDeWriting(await docBody(request)) };
  });
}

export async function PATCH(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await suaDeWriting(layId(body, "promptId", "mã đề"), body);
    return null;
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await xoaDeWriting(layId(body, "promptId", "mã đề"));
    return null;
  });
}
