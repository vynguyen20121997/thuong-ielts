import type { Card } from "../domain/types";

/*
  Cục logic của phần từ vựng — hiện chỉ có một cổng.

  Sheet của cô: "hs tự tạo deck vocab: nhập vocab vào => AI tự generate các cột
  còn lại (IPA / audio / 3 examples / meaning)".

  ## Vì sao chưa nối được vào model đang dùng

  Model hiện tại của dự án là TypeSafe (Jev), dùng cho chấm Writing. Nó chỉ
  trả lời được các câu hỏi CÓ SẴN LỰA CHỌN: `noul` (0–1), `score` (chọn một
  mức trong thang), `choice` (chọn một nhãn). Đã thử gửi kiểu `text`,
  `string`, `freeform`, `generate` — cả bốn đều bị trả về 400
  `api_usage_error`. Sinh phiên âm, nghĩa và ba câu ví dụ là sinh VĂN BẢN
  TỰ DO, nên Jev làm không được.

  Vậy nên cổng này để trống một chỗ: nối một model sinh văn bản (Gemini,
  Anthropic…) là viết một bản cài đặt của `CardGenerator` rồi đổi một dòng ở
  `infrastructure/index.ts`. Không file UI nào import thẳng bản tạm.
*/

export type GeneratedCard = Omit<Card, "id" | "deckId">;

export interface CardGenerator {
  /** Có nối model sinh văn bản chưa; giao diện dựa vào đây để hiện đúng lời. */
  available(): boolean;
  /**
   * Nhận danh sách từ thô, trả về thẻ đã điền phiên âm / nghĩa / ví dụ.
   * `null` cho từ nào không sinh được — nơi gọi phải coi đó là chuyện thường.
   */
  generate(words: string[]): Promise<(GeneratedCard | null)[]>;
}
