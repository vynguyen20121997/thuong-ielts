import { pool } from "@thuong-ielts/db";

import {
  LoiSoan,
  SLUG_TIEN_TO,
  WRITING_TIEN_TO,
  type DeWritingSoan,
  chuanHoaMa,
  dongThanhSoan,
  soanThanhDong,
  type DeNoiBoTomTat,
  type DeSoan,
  type DongDb,
} from "./deNoiBoKieu";

/**
 * Đề nội bộ: dòng `reading_tests` có `owner_id` = cô. Xem `deNoiBoKieu.ts`
 * vì sao không có bảng riêng.
 *
 * Mọi câu lệnh đều lọc `owner_id = $teacher`: cô A không đọc, sửa hay xoá
 * được đề của cô B, kể cả khi đoán ra id.
 *
 * Kho công khai bên web và danh sách đề ở Giao bài đều lọc `owner_id IS NULL`
 * — đó là thứ giữ đề này "nội bộ". Học sinh chỉ mở được qua link cô giao.
 */

export async function danhSachDeNoiBo(teacherId: string): Promise<DeNoiBoTomTat[]> {
  const { rows } = await pool.query(
    `SELECT r.id, r.slug, r.title, r.duration_seconds, r.question_count, r.updated_at, r.status,
            (SELECT count(*)::int FROM assignments a
              WHERE a.teacher_id = $1 AND a.skill = 'reading' AND a.target = r.slug) AS so_lan_giao
       FROM reading_tests r
      WHERE r.owner_id = $1
      ORDER BY r.updated_at DESC`,
    [teacherId]
  );
  const doc = rows.map((r): DeNoiBoTomTat => ({
    id: r.id,
    skill: "reading",
    code: String(r.slug).slice(SLUG_TIEN_TO.length),
    title: r.title,
    minutes: Math.round((r.duration_seconds ?? 0) / 60),
    questionCount: r.question_count ?? 0,
    choDuyet: r.status === "draft" && (r.question_count ?? 0) > 0,
    soLanGiao: r.so_lan_giao,
    updatedAt: new Date(r.updated_at).toISOString(),
  }));

  const { rows: viet } = await pool.query(
    `SELECT w.id, w.title, w.task, w.duration_seconds, w.updated_at,
            (SELECT count(*)::int FROM assignments a
              WHERE a.teacher_id = $1 AND a.skill = 'writing' AND a.target = w.id) AS so_lan_giao
       FROM writing_prompts w
      WHERE w.owner_id = $1`,
    [teacherId]
  );
  const writing = viet.map((r): DeNoiBoTomTat => ({
    id: r.id,
    skill: "writing",
    code: `Writing Task ${r.task}`,
    title: r.title,
    minutes: Math.round((r.duration_seconds ?? 0) / 60),
    questionCount: 1,
    choDuyet: false,
    soLanGiao: r.so_lan_giao,
    updatedAt: new Date(r.updated_at).toISOString(),
  }));

  return [...doc, ...writing].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function docDeNoiBo(
  teacherId: string,
  id: string
): Promise<{ slug: string; de: DeSoan; choDuyet: boolean } | null> {
  const { rows } = await pool.query(
    `SELECT slug, status, question_count, title, duration_seconds, topic, passage, questions, answer_key
       FROM reading_tests WHERE id = $1 AND owner_id = $2`,
    [id, teacherId]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  const dongDb: DongDb = {
    passage: r.passage ?? { title: "", paragraphs: [] },
    questions: r.questions ?? [],
    answerKey: r.answer_key ?? [],
  };
  return {
    slug: r.slug,
    choDuyet: r.status === "draft" && (r.question_count ?? 0) > 0,
    de: dongThanhSoan(
      {
        code: String(r.slug).slice(SLUG_TIEN_TO.length),
        title: r.title,
        minutes: Math.round((r.duration_seconds ?? 0) / 60),
        description: r.topic ?? "",
      },
      dongDb
    ),
  };
}

function kiemMeta(de: { code: string; title: string; minutes: number }) {
  const ma = chuanHoaMa(de.code ?? "");
  if (!ma) throw new LoiSoan("Mã đề chỉ gồm chữ, số và dấu gạch (vd. IT209-BUOI5).");
  if (!String(de.title ?? "").trim()) throw new LoiSoan("Chưa có tên đề.");
  const phut = Number(de.minutes);
  if (!Number.isInteger(phut) || phut < 1 || phut > 180) throw new LoiSoan("Thời gian làm bài từ 1 đến 180 phút.");
  return { slug: SLUG_TIEN_TO + ma, title: String(de.title).trim().slice(0, 200), seconds: phut * 60 };
}

/**
 * Tạo đề rỗng (chỉ thông tin chung), như nút "Tạo mới" của LMS. Nội dung soạn
 * sau ở trang chi tiết. Tạo ở trạng thái `draft`: đề chưa có câu nào thì giao
 * đi là giao một trang trống.
 */
export async function taoDeNoiBo(
  teacherId: string,
  input: { code: string; title: string; minutes: number; description: string }
): Promise<string> {
  const { slug, title, seconds } = kiemMeta(input);
  const id = `rieng-${crypto.randomUUID()}`;
  try {
    await pool.query(
      `INSERT INTO reading_tests
         (id, slug, title, collection, topic, duration_seconds, question_count, status,
          passage, questions, answer_key, owner_id)
       VALUES ($1, $2, $3, 'Đề nội bộ', $4, $5, 0, 'draft',
               $6::jsonb, '[]'::jsonb, '[]'::jsonb, $7)`,
      [id, slug, title, String(input.description ?? "").slice(0, 500), seconds,
       JSON.stringify({ title, paragraphs: [] }), teacherId]
    );
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new LoiSoan("Mã đề này đã có. Đặt mã khác giúp cô.");
    throw err;
  }
  return id;
}

/**
 * Lưu trọn bản soạn. Đổi được cả mã đề, NHƯNG không đổi nếu đề đã từng được
 * giao: bài giao trỏ vào `slug`, đổi đi là mọi link cũ thành link chết.
 */
/**
 * `nguon: "ai"` = AI agent soạn qua MCP: lưu đủ nội dung nhưng giữ `draft`.
 * Đáp án do model viết có thể sai, mà sai đáp án là chấm sai cả lớp không ai
 * hay — nên đề chỉ giao được sau khi CÔ mở trang soạn, xem lại và bấm lưu.
 */
export async function luuDeNoiBo(teacherId: string, id: string, de: DeSoan, nguon: "co" | "ai" = "co"): Promise<void> {
  const { slug, title, seconds } = kiemMeta(de);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cu = await client.query(
      `SELECT slug FROM reading_tests WHERE id = $1 AND owner_id = $2 FOR UPDATE`,
      [id, teacherId]
    );
    if (!cu.rows[0]) throw new LoiSoan("Không tìm thấy đề này.");
    if (cu.rows[0].slug !== slug) {
      const daGiao = await client.query(
        `SELECT 1 FROM assignments WHERE skill = 'reading' AND target = $1 LIMIT 1`,
        [cu.rows[0].slug]
      );
      if (daGiao.rows[0]) throw new LoiSoan("Đề đã giao rồi nên không đổi mã được — link cũ sẽ hỏng.");
    }

    const dong = soanThanhDong(de, slug);
    await client.query(
      `UPDATE reading_tests
          SET slug = $3, title = $4, topic = $5, duration_seconds = $6,
              passage = $7::jsonb, questions = $8::jsonb, answer_key = $9::jsonb,
              question_count = $10, status = $11, updated_at = now()
        WHERE id = $1 AND owner_id = $2`,
      [id, teacherId, slug, title, String(de.description ?? "").slice(0, 500), seconds,
       JSON.stringify(dong.passage), JSON.stringify(dong.questions), JSON.stringify(dong.answerKey),
       dong.questions.length, nguon === "ai" ? "draft" : "published"]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    if ((err as { code?: string }).code === "23505") throw new LoiSoan("Mã đề này đã có. Đặt mã khác giúp cô.");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Xoá đề. Chặn nếu đã có học sinh làm: lượt làm giữ `target` (slug) chứ không
 * chụp đề, nên xoá đề là các em mở lại bài cũ không ra.
 */
export async function xoaDeNoiBo(teacherId: string, id: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT slug FROM reading_tests WHERE id = $1 AND owner_id = $2`,
    [id, teacherId]
  );
  if (!rows[0]) throw new LoiSoan("Không tìm thấy đề này.");
  const daGiao = await pool.query(
    `SELECT 1 FROM assignments WHERE skill = 'reading' AND target = $1 LIMIT 1`,
    [rows[0].slug]
  );
  if (daGiao.rows[0]) throw new LoiSoan("Đề đã giao cho lớp nên không xoá được — đóng bài giao là đủ.");
  await pool.query(`DELETE FROM reading_tests WHERE id = $1 AND owner_id = $2`, [id, teacherId]);
}

/* ── Writing ─────────────────────────────────────────────────────────────── */
/*
  Đề Writing nội bộ là một dòng `writing_prompts` có `owner_id` = cô. Trang
  luyện Writing công khai chỉ đọc đề `owner_id IS NULL`, nên đề này chỉ mở qua
  link giao. Chấm band dùng đúng `writingBand.ts` của web — một bản cài đặt.
*/

function kiemWriting(de: DeWritingSoan) {
  const title = String(de.title ?? "").trim();
  const prompt = String(de.prompt ?? "").trim();
  if (!title) throw new LoiSoan("Chưa có tên đề.");
  if (prompt.length < 20) throw new LoiSoan("Đề bài quá ngắn — dán nguyên đề như học sinh sẽ đọc.");
  if (de.task !== 1 && de.task !== 2) throw new LoiSoan("Chọn Task 1 hoặc Task 2.");
  const minWords = Number(de.minWords);
  if (!Number.isInteger(minWords) || minWords < 50 || minWords > 500) throw new LoiSoan("Số từ tối thiểu từ 50 đến 500.");
  const phut = Number(de.minutes);
  if (!Number.isInteger(phut) || phut < 5 || phut > 120) throw new LoiSoan("Thời gian viết từ 5 đến 120 phút.");
  return { title: title.slice(0, 200), prompt: prompt.slice(0, 4000), task: de.task, minWords, seconds: phut * 60 };
}

export async function taoDeWritingNoiBo(teacherId: string, de: DeWritingSoan): Promise<string> {
  const v = kiemWriting(de);
  const id = WRITING_TIEN_TO + crypto.randomUUID();
  await pool.query(
    `INSERT INTO writing_prompts (id, task, topic, title, prompt, published, position, owner_id, min_words, duration_seconds)
     VALUES ($1, $2, 'Đề nội bộ', $3, $4, true, 100, $5, $6, $7)`,
    [id, v.task, v.title, v.prompt, teacherId, v.minWords, v.seconds]
  );
  return id;
}

export async function docDeWritingNoiBo(
  teacherId: string,
  id: string
): Promise<(DeWritingSoan & { soBaiNop: number }) | null> {
  const { rows } = await pool.query(
    `SELECT w.title, w.task, w.prompt, w.min_words, w.duration_seconds,
            (SELECT count(*)::int FROM writing_submissions s WHERE s.prompt_id = w.id) AS so_bai_nop
       FROM writing_prompts w WHERE w.id = $1 AND w.owner_id = $2`,
    [id, teacherId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    title: r.title,
    task: r.task === 1 ? 1 : 2,
    prompt: r.prompt,
    minWords: r.min_words ?? 250,
    minutes: Math.round((r.duration_seconds ?? 2400) / 60),
    soBaiNop: r.so_bai_nop,
  };
}

/** Sửa đề không đụng bài đã nộp: mỗi bài nộp chụp nguyên đề lúc nộp. */
export async function luuDeWritingNoiBo(teacherId: string, id: string, de: DeWritingSoan): Promise<void> {
  const v = kiemWriting(de);
  const { rowCount } = await pool.query(
    `UPDATE writing_prompts
        SET title = $3, task = $4, prompt = $5, min_words = $6, duration_seconds = $7, updated_at = now()
      WHERE id = $1 AND owner_id = $2`,
    [id, teacherId, v.title, v.task, v.prompt, v.minWords, v.seconds]
  );
  if (!rowCount) throw new LoiSoan("Không tìm thấy đề này.");
}

export async function xoaDeWritingNoiBo(teacherId: string, id: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM assignments WHERE skill = 'writing' AND target = $1) AS da_giao`,
    [id]
  );
  if (rows[0].da_giao) throw new LoiSoan("Đề đã giao cho lớp nên không xoá được — đóng bài giao là đủ.");
  const { rowCount } = await pool.query(`DELETE FROM writing_prompts WHERE id = $1 AND owner_id = $2`, [id, teacherId]);
  if (!rowCount) throw new LoiSoan("Không tìm thấy đề này.");
}
