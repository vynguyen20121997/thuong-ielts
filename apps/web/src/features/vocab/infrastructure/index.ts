import type { CardGenerator, GeneratedCard } from "../application/ports";

/*
  Điểm nối duy nhất giữa UI và bộ sinh thẻ.

  Bản tạm KHÔNG bịa: trả `null` cho mọi từ và khai `available() === false`, để
  giao diện nói thẳng "chưa nối" thay vì hiện một phiên âm sai mà học sinh học
  thuộc. Nối model thật là thay ba dòng cuối file này.
*/
const notWired: CardGenerator = {
  available: () => false,
  async generate(words: string[]): Promise<(GeneratedCard | null)[]> {
    return words.map(() => null);
  },
};

export const cardGenerator: CardGenerator = notWired;
