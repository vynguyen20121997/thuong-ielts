import { NextResponse } from "next/server";

import { auth } from "../../../../auth";
import { validateProfile, type Occupation } from "../../../../features/account/domain/types";
import { saveProfile } from "../../../../features/account/server/studentRepository";

/**
 * Lưu hồ sơ học viên. Kiểm lại bằng đúng hàm mà form dùng — client kiểm để
 * người dùng thấy lỗi ngay, server kiểm vì client nói gì cũng không tin được.
 */
export async function POST(request: Request) {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  let body: { age?: unknown; occupation?: unknown; targetBand?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const input = {
    age: Number(body.age),
    occupation: body.occupation as Occupation | undefined,
    targetBand: Number(body.targetBand),
  };

  const errors = validateProfile(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
  }

  await saveProfile(studentId, {
    age: input.age,
    occupation: input.occupation as Occupation,
    targetBand: input.targetBand,
  });

  return NextResponse.json({ ok: true });
}
