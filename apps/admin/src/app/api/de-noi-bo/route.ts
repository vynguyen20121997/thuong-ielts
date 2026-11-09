import { NextResponse } from "next/server";

import {
  luuDeNoiBo,
  luuDeWritingNoiBo,
  taoDeNoiBo,
  taoDeWritingNoiBo,
  xoaDeNoiBo,
  xoaDeWritingNoiBo,
} from "../../../lib/deNoiBo";
import { LoiSoan, laDeWriting, type DeSoan, type DeWritingSoan } from "../../../lib/deNoiBoKieu";
import { teacherHienTai } from "../../../lib/phien";

/** Đề nội bộ (Reading và Writing): POST tạo, PATCH lưu trọn bản soạn, DELETE xoá. */
export const dynamic = "force-dynamic";

async function chay(viec: (teacherId: string, body: Record<string, unknown>) => Promise<unknown>, request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") throw new LoiSoan("Dữ liệu gửi lên không hợp lệ.");
    const data = await viec(await teacherHienTai(), body);
    return NextResponse.json({ ok: true, ...(data ? { data } : {}) });
  } catch (err) {
    if (err instanceof LoiSoan) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("Đề nội bộ:", err);
    return NextResponse.json({ error: "Có lỗi khi lưu. Thử lại giúp cô." }, { status: 500 });
  }
}

const id = (b: Record<string, unknown>) => {
  if (typeof b.id !== "string" || !b.id) throw new LoiSoan("Thiếu mã đề.");
  return b.id;
};

const writingTuBody = (b: Record<string, unknown>): DeWritingSoan => ({
  title: String(b.title ?? ""),
  task: Number(b.task) === 1 ? 1 : 2,
  prompt: String(b.prompt ?? ""),
  minWords: Number(b.minWords),
  minutes: Number(b.minutes),
});

/** `skill: "writing"` tạo đề Writing; còn lại là đề Reading. */
export const POST = (r: Request) =>
  chay(async (t, b) => ({
    id:
      b.skill === "writing"
        ? await taoDeWritingNoiBo(t, writingTuBody(b))
        : await taoDeNoiBo(t, {
            code: String(b.code ?? ""),
            title: String(b.title ?? ""),
            minutes: Number(b.minutes),
            description: String(b.description ?? ""),
          }),
  }), r);

export const PATCH = (r: Request) =>
  chay(async (t, b) => {
    if (laDeWriting(id(b))) {
      const de = b.de as Record<string, unknown> | undefined;
      if (!de || typeof de !== "object") throw new LoiSoan("Dữ liệu đề không hợp lệ.");
      return luuDeWritingNoiBo(t, id(b), writingTuBody(de));
    }
    const de = b.de as DeSoan | undefined;
    const hopLe =
      de && typeof de === "object" && Array.isArray(de.groups) &&
      de.groups.every((g) => g && Array.isArray(g.questions) && Array.isArray(g.options) &&
        g.questions.every((c) => c && Array.isArray(c.options) && Array.isArray(c.acceptable)));
    if (!hopLe) throw new LoiSoan("Dữ liệu đề không hợp lệ.");
    return luuDeNoiBo(t, id(b), de);
  }, r);

export const DELETE = (r: Request) =>
  chay(async (t, b) => (laDeWriting(id(b)) ? xoaDeWritingNoiBo(t, id(b)) : xoaDeNoiBo(t, id(b))), r);
