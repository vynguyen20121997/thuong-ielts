import { laMaDeTest, pool, taoBaiGiao } from "@thuong-ielts/db";

/**
 * Tạo một bài giao — MỘT bản cài đặt cho cả trang Giao bài lẫn AI agent (MCP).
 * Hai lối vào mà hai luật là có ngày agent giao được thứ trang admin chặn.
 *
 * `title` lấy từ DB chứ không lấy từ body: tên đề là sự thật của bảng đề, còn
 * thứ gửi lên thì sửa được. Bước tra này cũng chính là bước kiểm đề có thật.
 */

export class LoiGiao extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Chỉ nhận đúng ba giá trị; thứ lạ thì về mặc định an toàn nhất là "ngay". */
function mucHien(v: unknown): "ngay" | "khi_co_mo" | "khong" {
  return v === "khi_co_mo" || v === "khong" ? v : "ngay";
}

export async function giaoBai(
  teacherId: string,
  body: Record<string, unknown>
): Promise<{ id: string; token: string; title: string }> {
  const skill =
    body.skill === "listening" ? "listening" : body.skill === "writing" ? "writing" : "reading";
  const target = String(body.target ?? "");
  if (!/^[a-z0-9-]+$/.test(target)) throw new LoiGiao(400, "Mã đề không hợp lệ.");

  /*
    PHẠM VI suy ra từ chính mã đề, không nhận từ body.

    Reading có hai dạng: mã đề cả bài (`cam10-test1`, ghép ba passage) và slug
    của một passage lẻ (`vol-5-test-2-passage-3`, hay đề nội bộ `rieng-…`).
    Trước đây luôn đặt `scope: "test"`, nên bài giao cho một passage lẻ tạo ra
    xong là hỏng — phía học sinh đòi `isTestId` cho phạm vi "test" và từ chối mở.
  */
  const scope: "test" | "paper" =
    skill === "listening" || (skill === "reading" && laMaDeTest(target)) ? "test" : "paper";

  const title =
    skill === "writing"
      ? // Writing giao qua link chỉ có đề nội bộ, và chỉ của chính cô.
        (
          await pool.query(
            `SELECT title FROM writing_prompts WHERE id = $1 AND owner_id = $2 AND published LIMIT 1`,
            [target, teacherId]
          )
        ).rows[0]?.title
      : skill === "listening"
      ? (
          await pool.query(
            `SELECT title FROM listening_tests WHERE slug = $1 AND status = 'published' LIMIT 1`,
            [target]
          )
        ).rows[0]?.title
      : (
          await pool.query(
            scope === "test"
              ? `SELECT min(title) AS title FROM reading_tests
                  WHERE slug LIKE $1 || '-%' AND status = 'published'`
              : // Đề nội bộ chỉ giao được bởi chính cô soạn ra nó, và chỉ khi
                // đã `published` — đề AI soạn nằm `draft` tới khi cô duyệt.
                `SELECT title FROM reading_tests
                  WHERE slug = $1 AND status = 'published'
                    AND (owner_id IS NULL OR owner_id = $2) LIMIT 1`,
            scope === "test" ? [target] : [target, teacherId]
          )
        ).rows[0]?.title;

  if (!title) throw new LoiGiao(404, "Không tìm thấy đề này (hoặc đề chưa được duyệt).");

  const tenDe = String(title).replace(/ · Passage \d+.*$/, "");
  const bai = await taoBaiGiao({
    teacherId,
    skill,
    scope,
    target,
    // Tên passage đầu bị cắt đuôi để thành tên cả đề.
    title: tenDe,
    label: typeof body.label === "string" ? body.label.slice(0, 120) : null,
    allowGuest: body.allowGuest !== false,
    audience: body.audience === "one" ? "one" : "class",
    showScore: mucHien(body.showScore),
    showAnswers: mucHien(body.showAnswers),
    dongSauGio: typeof body.dongSauGio === "number" ? body.dongSauGio : 12,
  });

  return { id: bai.id, token: bai.shareToken, title: tenDe };
}
