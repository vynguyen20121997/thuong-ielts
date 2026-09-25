import { randomUUID } from "crypto";

import { pool } from "@thuong-ielts/db";

/**
 * Phần GHI của soạn nội dung.
 *
 * Tách khỏi phần đọc vì luật khác nhau: đọc thì cho cô nhìn cả kho, còn ghi
 * thì mỗi thao tác phải tự kiểm lại quyền trước khi đụng vào một dòng.
 */

export class LoiNhap extends Error {}

function chu(v: unknown, ten: string, toiDa = 200): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new LoiNhap(`Thiếu ${ten}.`);
  if (s.length > toiDa) throw new LoiNhap(`${ten} quá dài (tối đa ${toiDa} ký tự).`);
  return s;
}

function chuTuyChon(v: unknown, toiDa = 4000): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s.slice(0, toiDa);
}

/** Danh sách chuỗi: bỏ dòng trống, cắt số lượng. */
function danhSach(v: unknown, toiDa = 10, doDai = 500): string[] {
  const raw = Array.isArray(v)
    ? v
    : typeof v === "string"
      ? v.split("\n")
      : [];
  return raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, toiDa)
    .map((x) => x.slice(0, doDai));
}

/* ── Từ vựng ─────────────────────────────────────────────────────────────── */

/**
 * Bộ của HỌC SINH thì cô không sửa.
 *
 * `type = 'personal'` là bộ các em tự tạo cho riêng mình. Cô sửa vào đó là sửa
 * đồ của người khác — và trang học sinh cũng không có chỗ nào báo cho em ấy
 * biết. Mọi thao tác ghi đều đi qua đây trước.
 */
async function boCuaCo(deckId: string): Promise<void> {
  const { rows } = await pool.query<{ type: string }>(
    "SELECT type FROM vocab_decks WHERE id = $1",
    [deckId],
  );
  if (!rows.length) throw new LoiNhap("Không tìm thấy bộ thẻ này.");
  if (rows[0].type !== "official") {
    throw new LoiNhap("Đây là bộ học viên tự tạo — không sửa được.");
  }
}

export async function taoBoThe(
  teacherId: string,
  body: Record<string, unknown>,
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO vocab_decks (id, name, description, topic, type, creator_id)
     VALUES ($1,$2,$3,$4,'official',$5)`,
    [
      id,
      chu(body.name, "tên bộ thẻ", 120),
      chuTuyChon(body.description, 500),
      chuTuyChon(body.topic, 80),
      teacherId,
    ],
  );
  return id;
}

export async function suaBoThe(
  deckId: string,
  body: Record<string, unknown>,
): Promise<void> {
  await boCuaCo(deckId);
  await pool.query(
    `UPDATE vocab_decks
        SET name = coalesce($2, name),
            description = coalesce($3, description),
            topic = coalesce($4, topic)
      WHERE id = $1`,
    [
      deckId,
      typeof body.name === "string" ? chu(body.name, "tên bộ thẻ", 120) : null,
      typeof body.description === "string" ? chuTuyChon(body.description, 500) : null,
      typeof body.topic === "string" ? chuTuyChon(body.topic, 80) : null,
    ],
  );
}

/**
 * Xoá bộ thẻ.
 *
 * CHẶN khi đã có học viên ôn. Xoá thì `ON DELETE CASCADE` cuốn theo cả lịch ôn
 * — tức là xoá luôn nhiều tháng tích luỹ của các em, và không có đường lùi.
 * Bộ không ai học thì xoá thoải mái.
 */
export async function xoaBoThe(deckId: string): Promise<void> {
  await boCuaCo(deckId);
  const { rows } = await pool.query<{ n: string }>(
    `SELECT count(DISTINCT r.student_id) n FROM vocab_reviews r
       JOIN vocab_cards c ON c.id = r.card_id
      WHERE c.deck_id = $1`,
    [deckId],
  );
  if (Number(rows[0].n) > 0) {
    throw new LoiNhap(
      `Đã có ${rows[0].n} học viên ôn bộ này — xoá là mất sạch lịch ôn của họ. Sửa hoặc đổi tên thay vì xoá.`,
    );
  }
  await pool.query("DELETE FROM vocab_decks WHERE id = $1", [deckId]);
}

/**
 * Giao bộ thẻ cho cả lớp, hoặc thu lại.
 *
 * Không giao thì học viên KHÔNG thấy một thẻ nào: `ensureReviews` bên web chỉ
 * lấy thẻ từ bộ đã giao (`vocab_assignments`) hoặc bộ chính em ấy tự tạo. Bảng
 * ấy có từ đầu và web vẫn đọc nó, nhưng trước trang này không chỗ nào TẠO ra
 * dòng giao — nên mọi bộ cô soạn đều vô hình.
 *
 * Thu lại chỉ xoá dòng giao, KHÔNG đụng vào `vocab_reviews`: lịch ôn các em đã
 * tích luỹ được giữ nguyên, giao lại là học tiếp từ đúng chỗ đang dở.
 */
export async function giaoBoThe(
  deckId: string,
  teacherId: string,
  choCaLop: boolean,
): Promise<void> {
  await boCuaCo(deckId);
  if (choCaLop) {
    await pool.query(
      `INSERT INTO vocab_assignments (deck_id, student_id, audience, assigned_by)
       VALUES ($1, NULL, 'all', $2)
       ON CONFLICT (deck_id, student_id) DO NOTHING`,
      [deckId, teacherId],
    );
  } else {
    await pool.query(
      "DELETE FROM vocab_assignments WHERE deck_id = $1 AND student_id IS NULL",
      [deckId],
    );
  }
}

export async function themThe(
  deckId: string,
  body: Record<string, unknown>,
): Promise<string> {
  await boCuaCo(deckId);
  const id = randomUUID();
  const { rows } = await pool.query<{ p: number | null }>(
    "SELECT max(position) p FROM vocab_cards WHERE deck_id = $1",
    [deckId],
  );
  await pool.query(
    `INSERT INTO vocab_cards (id, deck_id, word, ipa, vietnamese, examples, position)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
    [
      id,
      deckId,
      chu(body.word, "từ", 120),
      chuTuyChon(body.ipa, 120),
      /*
        Nghĩa để trống ĐƯỢC, nhưng thẻ đó đứng ngoài lịch ôn (xem
        `ensureReviews` / `listDueCards`). Giao diện phải nói ra điều này chứ
        không chặn: cô hay nhập một loạt từ trước rồi điền nghĩa sau.
      */
      chuTuyChon(body.vietnamese, 300),
      JSON.stringify(danhSach(body.examples, 3, 400)),
      (rows[0].p ?? 0) + 1,
    ],
  );
  return id;
}

export async function suaThe(
  cardId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const { rows } = await pool.query<{ deck_id: string }>(
    "SELECT deck_id FROM vocab_cards WHERE id = $1",
    [cardId],
  );
  if (!rows.length) throw new LoiNhap("Không tìm thấy thẻ này.");
  await boCuaCo(rows[0].deck_id);

  await pool.query(
    `UPDATE vocab_cards
        SET word = coalesce($2, word),
            ipa = coalesce($3, ipa),
            vietnamese = coalesce($4, vietnamese),
            examples = coalesce($5::jsonb, examples)
      WHERE id = $1`,
    [
      cardId,
      typeof body.word === "string" ? chu(body.word, "từ", 120) : null,
      typeof body.ipa === "string" ? chuTuyChon(body.ipa, 120) : null,
      typeof body.vietnamese === "string" ? chuTuyChon(body.vietnamese, 300) : null,
      body.examples === undefined
        ? null
        : JSON.stringify(danhSach(body.examples, 3, 400)),
    ],
  );
}

/**
 * Xoá một thẻ.
 *
 * Thẻ đã có người ôn thì cảnh báo ở giao diện, nhưng vẫn cho xoá: một thẻ gõ
 * sai chính tả mà không xoá được thì cô phải sống chung với nó mãi. Khác bộ
 * thẻ ở chỗ mất mát chỉ là một dòng lịch ôn, không phải cả bộ.
 */
export async function xoaThe(cardId: string): Promise<void> {
  const { rows } = await pool.query<{ deck_id: string }>(
    "SELECT deck_id FROM vocab_cards WHERE id = $1",
    [cardId],
  );
  if (!rows.length) throw new LoiNhap("Không tìm thấy thẻ này.");
  await boCuaCo(rows[0].deck_id);
  await pool.query("DELETE FROM vocab_cards WHERE id = $1", [cardId]);
}

/* ── Đề Writing ──────────────────────────────────────────────────────────── */

export async function taoDeWriting(body: Record<string, unknown>): Promise<string> {
  const id = randomUUID();
  const task = body.task === 1 ? 1 : 2;
  await pool.query(
    `INSERT INTO writing_prompts (id, task, topic, title, prompt, published, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      task,
      chu(body.topic, "chủ đề", 80),
      chu(body.title, "tên đề", 200),
      chu(body.prompt, "đề bài", 4000),
      body.published !== false,
      typeof body.position === "number" ? body.position : 100,
    ],
  );
  return id;
}

export async function suaDeWriting(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE writing_prompts
        SET topic = coalesce($2, topic),
            title = coalesce($3, title),
            prompt = coalesce($4, prompt),
            published = coalesce($5, published)
      WHERE id = $1`,
    [
      id,
      typeof body.topic === "string" ? chu(body.topic, "chủ đề", 80) : null,
      typeof body.title === "string" ? chu(body.title, "tên đề", 200) : null,
      typeof body.prompt === "string" ? chu(body.prompt, "đề bài", 4000) : null,
      typeof body.published === "boolean" ? body.published : null,
    ],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy đề này.");
}

/**
 * Xoá đề Writing.
 *
 * CHẶN khi đã có học viên nộp bài cho đề này — bài viết của các em treo vào
 * `prompt_id`, xoá đề là kết quả cũ hết đọc được.
 */
export async function xoaDeWriting(id: string): Promise<void> {
  const { rows } = await pool.query<{ n: string }>(
    "SELECT count(*) n FROM attempts WHERE target = $1",
    [id],
  );
  if (Number(rows[0].n) > 0) {
    throw new LoiNhap(
      `Đã có ${rows[0].n} lượt làm đề này. Tắt xuất bản thay vì xoá, để kết quả cũ còn đọc được.`,
    );
  }
  const { rowCount } = await pool.query("DELETE FROM writing_prompts WHERE id = $1", [id]);
  if (!rowCount) throw new LoiNhap("Không tìm thấy đề này.");
}

async function deCoThat(promptId: string): Promise<void> {
  const { rowCount } = await pool.query("SELECT 1 FROM writing_prompts WHERE id = $1", [
    promptId,
  ]);
  if (!rowCount) throw new LoiNhap("Không tìm thấy đề này.");
}

export async function themYTuong(body: Record<string, unknown>): Promise<string> {
  const promptId = chu(body.promptId, "mã đề", 100);
  await deCoThat(promptId);
  const id = randomUUID();
  await pool.query(
    `INSERT INTO writing_prompt_ideas
       (id, prompt_id, side, label, starter, frame_explain, frame_example, probe, questions, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,
             coalesce((SELECT max(position)+1 FROM writing_prompt_ideas WHERE prompt_id=$2), 1))`,
    [
      id,
      promptId,
      body.side === "neg" ? "neg" : "pos",
      chu(body.label, "tên luận điểm", 200),
      chuTuyChon(body.starter, 500),
      chuTuyChon(body.frameExplain, 500),
      chuTuyChon(body.frameExample, 500),
      chuTuyChon(body.probe, 500),
      JSON.stringify(danhSach(body.questions, 5, 300)),
    ],
  );
  return id;
}

export async function suaYTuong(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE writing_prompt_ideas
        SET side = coalesce($2, side),
            label = coalesce($3, label),
            starter = coalesce($4, starter),
            frame_explain = coalesce($5, frame_explain),
            frame_example = coalesce($6, frame_example),
            probe = coalesce($7, probe),
            questions = coalesce($8::jsonb, questions)
      WHERE id = $1`,
    [
      id,
      body.side === "neg" || body.side === "pos" ? body.side : null,
      typeof body.label === "string" ? chu(body.label, "tên luận điểm", 200) : null,
      typeof body.starter === "string" ? chuTuyChon(body.starter, 500) : null,
      typeof body.frameExplain === "string" ? chuTuyChon(body.frameExplain, 500) : null,
      typeof body.frameExample === "string" ? chuTuyChon(body.frameExample, 500) : null,
      typeof body.probe === "string" ? chuTuyChon(body.probe, 500) : null,
      body.questions === undefined
        ? null
        : JSON.stringify(danhSach(body.questions, 5, 300)),
    ],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy luận điểm này.");
}

export async function xoaYTuong(id: string): Promise<void> {
  const { rowCount } = await pool.query(
    "DELETE FROM writing_prompt_ideas WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy luận điểm này.");
}

export async function themKienThuc(body: Record<string, unknown>): Promise<string> {
  const promptId = chu(body.promptId, "mã đề", 100);
  await deCoThat(promptId);
  const id = randomUUID();
  await pool.query(
    `INSERT INTO writing_prompt_knowledge (id, prompt_id, topic, summary, body, position)
     VALUES ($1,$2,$3,$4,$5,
             coalesce((SELECT max(position)+1 FROM writing_prompt_knowledge WHERE prompt_id=$2), 1))`,
    [
      id,
      promptId,
      chu(body.topic, "tiêu đề", 200),
      chuTuyChon(body.summary, 500),
      chu(body.body, "nội dung", 4000),
    ],
  );
  return id;
}

export async function suaKienThuc(
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE writing_prompt_knowledge
        SET topic = coalesce($2, topic),
            summary = coalesce($3, summary),
            body = coalesce($4, body)
      WHERE id = $1`,
    [
      id,
      typeof body.topic === "string" ? chu(body.topic, "tiêu đề", 200) : null,
      typeof body.summary === "string" ? chuTuyChon(body.summary, 500) : null,
      typeof body.body === "string" ? chu(body.body, "nội dung", 4000) : null,
    ],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy mục kiến thức này.");
}

export async function xoaKienThuc(id: string): Promise<void> {
  const { rowCount } = await pool.query(
    "DELETE FROM writing_prompt_knowledge WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new LoiNhap("Không tìm thấy mục kiến thức này.");
}
