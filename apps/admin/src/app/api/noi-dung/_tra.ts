import { NextResponse } from "next/server";

import { LoiNhap } from "../../../lib/noiDungGhi";

/**
 * Vỏ bọc chung cho mọi route soạn nội dung.
 *
 * Giống `_tra.ts` của phần quản lý lớp: lỗi do người nhập trả 400 kèm đúng câu
 * đó; mọi lỗi khác ghi log và trả một câu chung, vì chi tiết lỗi hệ thống
 * không phải thứ hiện lên màn hình cô giáo.
 */
export async function docBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new LoiNhap("Dữ liệu gửi lên không hợp lệ.");
    }
    return body as Record<string, unknown>;
  } catch (err) {
    if (err instanceof LoiNhap) throw err;
    throw new LoiNhap("Dữ liệu gửi lên không hợp lệ.");
  }
}

export async function chay<T>(viec: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await viec();
    return NextResponse.json({ ok: true, ...(data ? { data } : {}) });
  } catch (err) {
    if (err instanceof LoiNhap) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Soạn nội dung:", err);
    return NextResponse.json({ error: "Có lỗi khi lưu. Thử lại giúp cô." }, { status: 500 });
  }
}

/** Lấy một chuỗi bắt buộc khỏi body, báo lỗi tiếng Việt nếu thiếu. */
export function layId(body: Record<string, unknown>, ten: string, nhan: string): string {
  const v = typeof body[ten] === "string" ? (body[ten] as string) : "";
  if (!v) throw new LoiNhap(`Thiếu ${nhan}.`);
  return v;
}
