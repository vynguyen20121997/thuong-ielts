import { teacherHienTai } from "../../../../lib/phien";
import { giaoBoThe, suaBoThe, taoBoThe, xoaBoThe } from "../../../../lib/noiDungGhi";
import { chay, docBody, layId } from "../_tra";

/** Bộ thẻ từ vựng của cô. Bộ học viên tự tạo thì tầng ghi chặn. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    return { id: await taoBoThe(teacherId, await docBody(request)) };
  });
}

export async function PATCH(request: Request) {
  return chay(async () => {
    const teacherId = await teacherHienTai();
    const body = await docBody(request);
    const deckId = layId(body, "deckId", "mã bộ thẻ");
    /*
      Giao/thu bộ thẻ đi chung PATCH với sửa tên: cả hai đều là "đổi một thuộc
      tính của bộ này". Tách thành route riêng thì giao diện phải gọi hai chỗ
      cho một màn hình.
    */
    if (typeof body.giaoCaLop === "boolean") {
      await giaoBoThe(deckId, teacherId, body.giaoCaLop);
    }
    if (
      typeof body.name === "string" ||
      typeof body.topic === "string" ||
      typeof body.description === "string"
    ) {
      await suaBoThe(deckId, body);
    }
    return null;
  });
}

export async function DELETE(request: Request) {
  return chay(async () => {
    await teacherHienTai();
    const body = await docBody(request);
    await xoaBoThe(layId(body, "deckId", "mã bộ thẻ"));
    return null;
  });
}
