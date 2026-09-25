import { pool } from "@thuong-ielts/db";

import type { BoThe, DeWriting, KienThuc, The, YTuong } from "./noiDungKieu";

/**
 * Soạn nội dung: bộ thẻ từ vựng và đề Writing.
 *
 * Trước khi có mấy trang này, cô không có cách nào thêm một thẻ từ vựng hay
 * một đề Writing ngoài việc viết SQL tay — nên ba tính năng đã dựng xong
 * (Anki, Writing coach, Speaking) đứng gần như rỗng: 2 bộ thẻ / 6 thẻ, và 7
 * đề Writing trong đó đúng 1 đề có ngân hàng ý.
 *
 * Kiểu để ở `noiDungKieu.ts` — file này mở kết nối Postgres nên component
 * client không được import nó.
 */

export * from "./noiDungKieu";

/* ── Từ vựng ─────────────────────────────────────────────────────────────── */

/**
 * Danh sách bộ thẻ.
 *
 * Lấy CẢ bộ của học sinh tự tạo (`personal`), nhưng chỉ để cô nhìn thấy cả
 * kho — phần ghi chặn không cho sửa. Giấu hẳn đi thì cô không hiểu vì sao con
 * số thẻ trên trang học sinh lại khác con số ở đây.
 */
export async function danhSachBoThe(): Promise<BoThe[]> {
  const { rows } = await pool.query(
    `SELECT d.*,
            (SELECT count(*) FROM vocab_cards c WHERE c.deck_id = d.id) so_the,
            (SELECT count(*) FROM vocab_cards c
              WHERE c.deck_id = d.id AND btrim(c.vietnamese) = '') thieu_nghia,
            (SELECT count(DISTINCT r.student_id) FROM vocab_reviews r
              JOIN vocab_cards c ON c.id = r.card_id
             WHERE c.deck_id = d.id) nguoi_hoc,
            EXISTS (SELECT 1 FROM vocab_assignments a
                     WHERE a.deck_id = d.id AND a.student_id IS NULL
                       AND a.audience = 'all') giao_ca_lop
       FROM vocab_decks d
      ORDER BY d.type <> 'official', d.name`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    topic: r.topic,
    type: r.type,
    creatorId: r.creator_id,
    soThe: Number(r.so_the),
    soTheThieuNghia: Number(r.thieu_nghia),
    soNguoiHoc: Number(r.nguoi_hoc),
    giaoCaLop: Boolean(r.giao_ca_lop),
  }));
}

export async function docBoThe(deckId: string): Promise<BoThe | null> {
  const ds = await danhSachBoThe();
  return ds.find((d) => d.id === deckId) ?? null;
}

export async function theCuaBo(deckId: string): Promise<The[]> {
  const { rows } = await pool.query(
    `SELECT c.*,
            EXISTS (SELECT 1 FROM vocab_reviews r WHERE r.card_id = c.id) da_on
       FROM vocab_cards c
      WHERE c.deck_id = $1
      ORDER BY c.position, c.created_at`,
    [deckId],
  );
  return rows.map((r) => ({
    id: r.id,
    deckId: r.deck_id,
    word: r.word,
    ipa: r.ipa,
    vietnamese: r.vietnamese,
    examples: Array.isArray(r.examples) ? (r.examples as string[]) : [],
    position: r.position,
    daCoNguoiOn: Boolean(r.da_on),
  }));
}

/* ── Đề Writing ──────────────────────────────────────────────────────────── */

export async function danhSachDeWriting(): Promise<DeWriting[]> {
  const { rows } = await pool.query(
    `SELECT p.*,
            (SELECT count(*) FROM writing_prompt_ideas i WHERE i.prompt_id = p.id) so_y,
            (SELECT count(*) FROM writing_prompt_knowledge k WHERE k.prompt_id = p.id) so_kt
       FROM writing_prompts p
      ORDER BY p.position, p.created_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    task: r.task,
    topic: r.topic,
    title: r.title,
    prompt: r.prompt,
    published: r.published,
    position: r.position,
    soYTuong: Number(r.so_y),
    soKienThuc: Number(r.so_kt),
  }));
}

export async function docDeWriting(id: string): Promise<DeWriting | null> {
  const ds = await danhSachDeWriting();
  return ds.find((d) => d.id === id) ?? null;
}

export async function yTuongCuaDe(promptId: string): Promise<YTuong[]> {
  const { rows } = await pool.query(
    `SELECT * FROM writing_prompt_ideas WHERE prompt_id = $1 ORDER BY position, id`,
    [promptId],
  );
  return rows.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    side: r.side,
    label: r.label,
    starter: r.starter,
    frameExplain: r.frame_explain,
    frameExample: r.frame_example,
    probe: r.probe,
    questions: Array.isArray(r.questions) ? (r.questions as string[]) : [],
    position: r.position,
  }));
}

export async function kienThucCuaDe(promptId: string): Promise<KienThuc[]> {
  const { rows } = await pool.query(
    `SELECT * FROM writing_prompt_knowledge WHERE prompt_id = $1 ORDER BY position, id`,
    [promptId],
  );
  return rows.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    topic: r.topic,
    summary: r.summary,
    body: r.body,
    position: r.position,
  }));
}

/** Chủ đề đã dùng ở bộ thẻ — để gợi ý khi soạn đề Writing cùng chủ đề. */
export async function chuDeDaCo(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT topic FROM vocab_decks WHERE btrim(topic) <> ''
     UNION SELECT DISTINCT topic FROM writing_prompts WHERE btrim(topic) <> ''
     ORDER BY 1`,
  );
  return rows.map((r) => r.topic as string);
}
