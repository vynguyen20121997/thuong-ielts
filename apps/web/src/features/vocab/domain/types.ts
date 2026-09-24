/*
  Kiểu dữ liệu phần học từ vựng.

  Port từ repo `vynguyen20121997/ielts` (bản dựng trên AI Studio: Vite + Express
  + file JSON). Mô hình dữ liệu và thuật toán giãn cách giữ NGUYÊN; chỗ đổi là
  nơi lưu (file JSON → Postgres) và cách đăng nhập (mật khẩu thô + token giả →
  Auth.js đã có sẵn ở đây).

  Thuần: không React, không fetch, không `pg`.
*/

/** Bốn mức tự chấm sau khi lật thẻ, đúng thang của bản gốc. */
export type Rating = "again" | "hard" | "good" | "easy";

export type DeckType = "official" | "personal";

export type Deck = {
  id: string;
  name: string;
  description: string;
  /** Government, Education, Environment, Technology… */
  topic: string;
  /** `official` = bộ của cô, `personal` = học sinh tự tạo. */
  type: DeckType;
  creatorId: string;
};

export type Card = {
  id: string;
  deckId: string;
  word: string;
  ipa: string;
  audioUrl?: string;
  examples: string[];
  vietnamese: string;
};

export type CardReview = {
  studentId: string;
  cardId: string;
  /** Ngày dạng YYYY-MM-DD, so sánh bằng chuỗi được vì định dạng cố định. */
  dueDate: string;
  difficultyRating: Rating | null;
  lastReviewedDate: string | null;
  interval: number;
  easeFactor: number;
  reviewsCount: number;
};

export type ReviewLog = {
  id: string;
  studentId: string;
  cardId: string;
  reviewDate: string;
  rating: Rating;
  interval: number;
};

export type DeckProgress = {
  deck: Deck;
  totalCards: number;
  learnedCount: number;
  percentage: number;
};

export type StudentStats = {
  dueCount: number;
  learnedCount: number;
  streak: number;
  accuracy: number;
  progressDecks: DeckProgress[];
  totalLogsCount: number;
  dailyReviews: { date: string; count: number }[];
};

export type StudentProgress = {
  student: { id: string; name: string; email: string };
  totalAssignedCards: number;
  completedCount: number;
  overdueCount: number;
  difficultCount: number;
  completionRate: number;
  historyCount: number;
  recentLogs: (ReviewLog & { word: string })[];
};

export type TeacherStats = {
  studentsCount: number;
  decksCount: number;
  completedCount: number;
  overdueCount: number;
  difficultCount: number;
  completionRate: number;
};

/** Một thẻ đến hạn, kèm deck để hiện tên bộ trong lúc ôn. */
export type DueCard = { card: Card; deck: Deck; review: CardReview };
