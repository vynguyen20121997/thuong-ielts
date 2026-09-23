import "server-only";

import { pool } from "@thuong-ielts/db";

import type { Idea } from "../domain/writingCoach";

/**
 * Đề Writing đọc từ Postgres, không có bản dự phòng trong code — cùng lý do đã
 * ghi ở CLAUDE.md cho đề Reading/Listening: có trang quản trị sửa đề thì bản dự
 * phòng sẽ nói dối.
 */

export type WritingPrompt = {
  id: string;
  task: number;
  topic: string;
  title: string;
  prompt: string;
};

export async function listWritingPrompts(): Promise<WritingPrompt[]> {
  const { rows } = await pool.query(
    `SELECT id, task, topic, title, prompt
       FROM writing_prompts
      WHERE published
      ORDER BY position, created_at, id`,
  );
  return rows as WritingPrompt[];
}

export async function getWritingPrompt(id: string): Promise<WritingPrompt | null> {
  const { rows } = await pool.query(
    `SELECT id, task, topic, title, prompt
       FROM writing_prompts
      WHERE id = $1 AND published`,
    [id],
  );
  return (rows[0] as WritingPrompt) ?? null;
}

/**
 * Ngân hàng ý của một đề — phần cô soạn, máy chỉ chọn trong đây.
 *
 * Đề chưa có ý nào thì trả mảng rỗng, và bảng gợi ý bên client tự rút về khung
 * mở–thân–kết chung. Không có ý KHÔNG phải lỗi: đề mới nhập là chưa có.
 */
export async function listPromptIdeas(promptId: string): Promise<Idea[]> {
  const { rows } = await pool.query(
    `SELECT id, side, label, probe, starter, frame_explain, frame_example, questions
       FROM writing_prompt_ideas
      WHERE prompt_id = $1
      ORDER BY position, id`,
    [promptId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    side: r.side as "pos" | "neg",
    label: r.label as string,
    probe: r.probe as string,
    starter: (r.starter ?? "") as string,
    explain: (r.frame_explain ?? "") as string,
    example: (r.frame_example ?? "") as string,
    questions: (r.questions ?? []) as string[],
  }));
}

/**
 * Ghi chú kiến thức nền của một đề — phần cô soạn.
 *
 * `body` không trả về ở danh sách: học sinh mới chỉ đang chọn chủ đề, chưa
 * cần đọc. Gửi cả năm bài xuống client ngay từ đầu là gửi thừa vài KB và
 * khiến trang nặng hơn vì một thứ đa số không mở.
 */
export type KnowledgeNote = {
  id: string;
  topic: string;
  summary: string;
  body: string;
};

export async function listKnowledgeTopics(
  promptId: string,
): Promise<Pick<KnowledgeNote, "id" | "topic">[]> {
  const { rows } = await pool.query(
    `SELECT id, topic FROM writing_prompt_knowledge
      WHERE prompt_id = $1 ORDER BY position, id`,
    [promptId],
  );
  return rows as Pick<KnowledgeNote, "id" | "topic">[];
}

export async function listKnowledgeNotes(promptId: string): Promise<KnowledgeNote[]> {
  const { rows } = await pool.query(
    `SELECT id, topic, summary, body FROM writing_prompt_knowledge
      WHERE prompt_id = $1 ORDER BY position, id`,
    [promptId],
  );
  return rows as KnowledgeNote[];
}
