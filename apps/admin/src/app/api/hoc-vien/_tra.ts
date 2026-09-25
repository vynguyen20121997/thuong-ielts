import { NextResponse } from "next/server";

import { LoiNhap } from "../../../lib/hocVienGhi";

/**
 * Vỏ bọc chung cho mọi route của phần Quản lý lớp.
 *
 * Hai việc, làm ở một chỗ để không route nào quên:
 *
 * 1. Đọc JSON an toàn. Body hỏng thì trả 400 kèm câu tiếng Việt, chứ không
 *    để Next ném ra một trang lỗi.
 * 2. `LoiNhap` — lỗi do người nhập, và cả lỗi "không phải lớp của bạn" — trả
 *    400 kèm đúng câu đó. Mọi lỗi KHÁC thì ghi log và trả một câu chung: chi
 *    tiết của lỗi hệ thống không phải thứ hiện lên màn hình cô giáo.
 */
export async function docBody(
  request: Request,
): Promise<Record<string, unknown>> {
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

export async function chay<T>(
  viec: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await viec();
    return NextResponse.json({ ok: true, ...(data ? { data } : {}) });
  } catch (err) {
    if (err instanceof LoiNhap) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Quản lý lớp:", err);
    return NextResponse.json(
      { error: "Có lỗi khi lưu. Thử lại giúp cô." },
      { status: 500 },
    );
  }
}
