import type { CardReview, Rating, ReviewLog } from "./types";

/*
  Lịch giãn cách. Port NGUYÊN thuật toán của repo gốc — cùng số, cùng công
  thức, cùng sàn hệ số — để học sinh đã quen nhịp cũ không thấy lịch đổi.

  Nguyên văn luật:
    again → ôn lại ngay hôm nay (0 ngày)
    hard  → mai (1 ngày)
    good  → lần đầu 3 ngày, sau đó interval × easeFactor, tối thiểu 3
    easy  → lần đầu 7 ngày, sau đó interval × easeFactor × 1.3, tối thiểu 7

  `easeFactor` khởi tạo 2.5, cộng/trừ theo mức tự chấm, sàn 1.3. Sàn ấy là
  của SM-2: dưới 1.3 thì khoảng cách gần như không giãn ra nữa, thẻ quay lại
  mỗi ngày và học sinh bỏ cuộc.

  Thuần: không đọc đồng hồ hệ thống bên trong — `today` truyền từ ngoài vào để
  hàm chạy lại bao nhiêu lần cũng ra một kết quả, và để viết kiểm thử được.
*/

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ máy người dùng. */
export function todayString(now: Date = new Date()): string {
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().split("T")[0];
}

export function newReview(
  studentId: string,
  cardId: string,
  today: string,
): CardReview {
  return {
    studentId,
    cardId,
    dueDate: today,
    difficultyRating: null,
    lastReviewedDate: null,
    interval: 0,
    easeFactor: INITIAL_EASE,
    reviewsCount: 0,
  };
}

/** Khoảng cách tới lần ôn sau, tính bằng ngày. */
export function nextInterval(review: CardReview, rating: Rating): number {
  if (rating === "again") return 0;
  if (rating === "hard") return 1;
  if (rating === "good") {
    return review.reviewsCount === 0
      ? 3
      : Math.max(3, Math.round(review.interval * review.easeFactor));
  }
  return review.reviewsCount === 0
    ? 7
    : Math.max(7, Math.round(review.interval * review.easeFactor * 1.3));
}

const EASE_DELTA: Record<Rating, number> = {
  again: -0.2,
  hard: -0.15,
  good: 0,
  easy: 0.15,
};

/** Trả về bản ghi MỚI, không sửa tại chỗ — dễ so trước/sau khi cần dò lỗi. */
export function applyRating(
  review: CardReview,
  rating: Rating,
  today: string,
  at: Date = new Date(),
): CardReview {
  const interval = nextInterval(review, rating);
  return {
    ...review,
    difficultyRating: rating,
    lastReviewedDate: at.toISOString(),
    reviewsCount: review.reviewsCount + 1,
    easeFactor: Math.max(MIN_EASE, review.easeFactor + EASE_DELTA[rating]),
    interval,
    dueDate: addDays(today, interval),
  };
}

/* ── Thống kê ────────────────────────────────────────────────────────────── */

/** Đến hạn khi `dueDate <= today`; so sánh chuỗi được vì định dạng cố định. */
export function isDue(review: CardReview, today: string): boolean {
  return review.dueDate <= today;
}

/**
 * Coi là đã thuộc khi đã ôn ít nhất một lần và lần gần nhất không phải
 * "again" — bản gốc tính đúng như vậy.
 */
export function isLearned(review: CardReview): boolean {
  return review.reviewsCount > 0 && review.difficultyRating !== "again";
}

/**
 * Chuỗi ngày ôn liên tiếp.
 *
 * Chưa ôn hôm nay mà hôm qua có ôn thì chuỗi VẪN còn — đếm lùi từ hôm qua.
 * Không có luật này thì mỗi sáng mở trang ra là thấy chuỗi về 0 dù tối qua
 * vừa học, và đó là thứ làm người ta bỏ.
 */
export function streakFrom(logDates: string[], today: string): number {
  const days = [...new Set(logDates)].sort((a, b) => (a < b ? 1 : -1));
  if (!days.length) return 0;

  const yesterday = addDays(today, -1);
  const reviewedToday = days[0] === today;
  const reviewedYesterday = days[0] === yesterday;
  if (!reviewedToday && !reviewedYesterday) return 0;

  let cursor = reviewedToday ? today : yesterday;
  let streak = 0;
  for (const day of days) {
    if (day !== cursor) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Tỉ lệ nhớ: phần trăm lượt chấm "good" hoặc "easy". Chưa ôn lần nào thì 100. */
export function accuracyFrom(logs: Pick<ReviewLog, "rating">[]): number {
  if (!logs.length) return 100;
  const good = logs.filter(
    (l) => l.rating === "good" || l.rating === "easy",
  ).length;
  return Math.round((good / logs.length) * 100);
}

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Số lượt ôn từng ngày trong bảy ngày gần nhất, cũ → mới. */
export function dailyReviewsFrom(
  logDates: string[],
  today: string,
): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = addDays(today, -i);
    out.push({
      date: DAY_NAMES[new Date(`${day}T00:00:00`).getDay()],
      count: logDates.filter((d) => d === day).length,
    });
  }
  return out;
}
