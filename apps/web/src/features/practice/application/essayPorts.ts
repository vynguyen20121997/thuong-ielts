/*
  Những phần của màn kết quả Writing mà PHẢI có model sinh văn bản.

  Màn kết quả có năm mục (theo bản mẫu cô gửi):

    1. Phân tích đề        — làm được bằng luật, xem `domain/taskAnalysis.ts`
    2. Idea Development    — lấy từ `writing_prompt_ideas`, cô soạn sẵn
    3. Grammar Enhancement — CẦN sinh văn bản
    4. Useful Vocabulary   — lấy từ bộ thẻ `vocab_decks` cùng chủ đề
    5. Sample Essay        — CẦN sinh văn bản (hoặc cô viết và lưu vào DB)

  Cộng thêm tab "Lỗi chi tiết" cạnh "Điểm chi tiết" — cũng CẦN sinh văn bản,
  vì phải trích đúng câu sai trong bài và viết câu sửa.

  ## Vì sao chưa nối

  Model đang dùng (TypeSafe / Jev) chỉ trả lời câu hỏi có sẵn lựa chọn:
  `noul` (0–1), `score` (một mức trong thang), `choice` (một nhãn). Đã thử gửi
  kiểu `text`, `string`, `freeform`, `generate` — cả bốn trả về
  `400 api_usage_error`. Nên ba mục trên chờ một model khác.

  Nối vào: viết một bản cài đặt `EssayCoach` rồi đổi một dòng ở
  `infrastructure/essayCoach.ts`. Không file UI nào import thẳng bản tạm.
*/

/** Một chỗ trong bài viết được chỉ ra là sai, kèm câu sửa. */
export type EssayIssue = {
  /** Tiêu chí mà lỗi này ảnh hưởng — để gom nhóm đúng bốn cột IELTS. */
  criterion: "TR" | "CC" | "LR" | "GRA";
  /** Nguyên văn câu (hoặc cụm) trong bài học sinh. */
  quote: string;
  /** Vì sao chỗ đó bị tính là lỗi, viết cho học sinh đọc. */
  why: string;
  /** Câu viết lại. Bỏ trống khi lỗi là thiếu chứ không phải sai. */
  fix?: string;
};

/** Một câu của học sinh đặt cạnh bản nâng cấp. */
export type SentenceUpgrade = {
  original: string;
  upgraded: string;
  /** Kỹ thuật đã dùng: mệnh đề phân từ, đảo ngữ, mệnh đề quan hệ rút gọn… */
  technique: string;
};

export type VocabSuggestion = {
  word: string;
  ipa?: string;
  meaning: string;
  example: string;
};

export interface EssayCoach {
  /** Đã nối model sinh văn bản chưa. Giao diện dựa vào đây để hiện đúng lời. */
  available(): boolean;

  /** Danh sách lỗi có trích dẫn, cho tab "Lỗi chi tiết". */
  issues(prompt: string, essay: string): Promise<EssayIssue[] | null>;

  /** Vài câu của chính học sinh, viết lại ở mức band cao hơn. */
  upgrades(essay: string): Promise<SentenceUpgrade[] | null>;

  /** Bài mẫu viết theo đúng đề này. */
  sampleEssay(prompt: string): Promise<string | null>;
}
