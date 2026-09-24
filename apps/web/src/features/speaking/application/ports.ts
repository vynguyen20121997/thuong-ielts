import type {
  IdeaFeedback,
  IdeaSeed,
  Part,
  SpeakingState,
  TopicPack,
} from "../domain/types";

/*
  "Cục logic" của Speaking, gom về ba cổng. Giao diện chỉ gọi qua đây.

  Hôm nay cả ba đều là bản tạm (`infrastructure/stubs.ts`) — chưa có bộ chấm
  nào nghe được âm thanh. Khi có, viết một bản cài đặt mới của cùng cổng
  (`infrastructure/speakingApi.ts` gọi route server), đổi một dòng ở
  `infrastructure/index.ts`, UI giữ nguyên.

  Nói thẳng điều kiện kỹ thuật ở đây để người nối sau không phải đoán:

  - Chấm FC/LR/GRA có thể làm từ BẢN GHI LỜI NÓI (speech-to-text trước, rồi
    chấm chữ giống Writing).
  - Chấm Phát âm (P) KHÔNG làm được từ chữ. Cần model nghe được audio, hoặc để
    cô chấm tay và bộ chấm trả `confidence: null` cho tiêu chí đó.
*/

export interface SpeakingGrader {
  /**
   * Nhận file thu âm và mã câu hỏi, trả về trạng thái chấm. Không bao giờ
   * ném lỗi: hỏng thì trả `{ kind: "ungraded", reason }` — bài nói vẫn còn.
   */
  grade(recording: Blob, questionId: string): Promise<SpeakingState>;
}

export interface IdeaCoach {
  /** Đọc ý thô của học sinh, trả về ý viết lại + câu gợi mở + từ gợi ý. */
  reshape(
    questionId: string,
    rawIdea: string,
    round: number,
  ): Promise<IdeaFeedback | null>;
  /** Ba hướng ý chính khi học sinh bấm "Không biết nói gì". */
  seeds(questionId: string): Promise<IdeaSeed[]>;
}

export interface TopicProvider {
  /** Bốc một chủ đề cho part đã chọn; `exclude` để không lặp chủ đề vừa bốc. */
  draw(part: Part, exclude?: string[]): Promise<TopicPack | null>;
}
