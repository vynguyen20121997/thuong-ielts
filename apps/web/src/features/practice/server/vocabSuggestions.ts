import "server-only";

import { pool } from "@thuong-ielts/db";

/*
  Từ vựng gợi ý cho một đề Writing.

  KHÔNG sinh bằng model — lấy từ chính bộ thẻ từ vựng cô đã soạn
  (`vocab_decks` / `vocab_cards`). Hai cái lợi: từ gợi ý ở đây đúng là từ học
  sinh đang học trong phần Anki, nên gặp lại là củng cố chứ không phải học
  thêm một danh sách rời; và không có từ nào bịa ra.

  Khớp theo chủ đề của đề trước; không có bộ nào cùng chủ đề thì thôi, không
  lấy bừa bộ khác — một danh sách từ chẳng liên quan còn tệ hơn danh sách rỗng.
*/

export type VocabSuggestion = {
  word: string;
  ipa?: string;
  meaning: string;
  example: string;
};

export async function suggestVocabulary(
  topic: string,
  prompt: string,
  limit = 12,
): Promise<VocabSuggestion[]> {
  if (!topic.trim()) return [];

  const { rows } = await pool.query<{
    word: string;
    ipa: string | null;
    vietnamese: string;
    examples: string[];
  }>(
    `SELECT c.word, c.ipa, c.vietnamese, c.examples
     FROM vocab_cards c
     JOIN vocab_decks d ON d.id = c.deck_id
     WHERE d.type = 'official' AND d.topic ILIKE $1
     ORDER BY c.position
     LIMIT $2`,
    [`%${topic.split(/[^A-Za-z]+/)[0]}%`, limit],
  );

  /*
    Ưu tiên từ đã xuất hiện trong chính đề bài: đó là từ học sinh chắc chắn
    phải dùng lại (bằng cách diễn đạt khác) nên đưa lên đầu.
  */
  const inPrompt = (word: string) =>
    prompt.toLowerCase().includes(word.toLowerCase());

  return rows
    .map((r) => ({
      word: r.word,
      ipa: r.ipa ?? undefined,
      meaning: r.vietnamese,
      example: Array.isArray(r.examples) ? (r.examples[0] ?? "") : "",
    }))
    .sort((a, b) => Number(inPrompt(b.word)) - Number(inPrompt(a.word)));
}
