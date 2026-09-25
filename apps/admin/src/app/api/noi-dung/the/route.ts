import { teacherHienTai } from "../../../../lib/phien";
import { suaThe, themThe, xoaThe } from "../../../../lib/noiDungGhi";
import { chay, docBody, layId } from "../_tra";

/** Thẻ từ vựng. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    return { id: await themThe(layId(body, "deckId", "mã bộ thẻ"), body) };
  });
}

export async function PATCH(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await suaThe(layId(body, "cardId", "mã thẻ"), body);
    return null;
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await xoaThe(layId(body, "cardId", "mã thẻ"));
    return null;
  });
}
