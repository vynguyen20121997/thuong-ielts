import { NextResponse } from "next/server";
import { pool, taoBaiGiao } from "@thuong-ielts/db";

import { teacherHienTai } from "../../../lib/phien";

/**
 * Tạo một bài giao.
 *
 * `title` lấy từ DB chứ không lấy từ body: tên đề là sự thật của bảng đề, còn
 * thứ trình duyệt gửi lên thì sửa được. Bước tra này cũng chính là bước kiểm
 * đề có thật hay không.
 */
/** Chỉ nhận đúng ba giá trị; thứ lạ thì về mặc định an toàn nhất là "ngay". */
function mucHien(v: unknown): "ngay" | "khi_co_mo" | "khong" {
  return v === "khi_co_mo" || v === "khong" ? v : "ngay";
}

export async function POST(request: Request) {
  const teacherId = await teacherHienTai();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const skill = body.skill === "listening" ? "listening" : "reading";
  const target = String(body.target ?? "");
  if (!/^[a-z0-9-]+$/.test(target)) {
    return NextResponse.json({ error: "Mã đề không hợp lệ." }, { status: 400 });
  }

  const title =
    skill === "listening"
      ? (
          await pool.query(
            `SELECT title FROM listening_tests WHERE slug = $1 AND status = 'published' LIMIT 1`,
            [target]
          )
        ).rows[0]?.title
      : (
          await pool.query(
            `SELECT min(title) AS title FROM reading_tests
              WHERE (slug = $1 OR slug LIKE $1 || '-%') AND status = 'published'`,
            [target]
          )
        ).rows[0]?.title;

  if (!title) {
    return NextResponse.json({ error: "Không tìm thấy đề này." }, { status: 404 });
  }

  const bai = await taoBaiGiao({
    teacherId,
    skill,
    scope: "test",
    target,
    // Tên passage đầu bị cắt đuôi để thành tên cả đề.
    title: String(title).replace(/ · Passage \d+.*$/, ""),
    label: typeof body.label === "string" ? body.label.slice(0, 120) : null,
    allowGuest: body.allowGuest !== false,
    audience: body.audience === "one" ? "one" : "class",
    showScore: mucHien(body.showScore),
    showAnswers: mucHien(body.showAnswers),
    dongSauGio: typeof body.dongSauGio === "number" ? body.dongSauGio : 12,
  });

  return NextResponse.json({ id: bai.id, token: bai.shareToken });
}
