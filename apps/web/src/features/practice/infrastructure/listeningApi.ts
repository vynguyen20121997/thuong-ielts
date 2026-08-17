import type { AttemptResult, ListeningTestSummary, ReadingAnswers } from "../domain/types";

/** Browser-side transport for the listening endpoints. */

export async function fetchListeningTests(): Promise<ListeningTestSummary[]> {
  const res = await fetch("/api/practice/listening", { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách đề nghe.");
  return (await res.json()) as ListeningTestSummary[];
}

export async function submitListeningAttempt(
  slug: string,
  answers: ReadingAnswers,
  elapsedSeconds: number,
  attemptId?: string | null,
  autoSubmitted = false,
): Promise<AttemptResult> {
  const res = await fetch(`/api/practice/listening/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `attemptId` là lượt đã mở lúc bài bắt đầu. Có nó thì server chốt đúng
    // lượt ấy thay vì đẻ dòng mới, và bảng lớp của cô thấy em này chuyển sang
    // "đã nộp" thay vì treo ở "đang làm" mãi.
    body: JSON.stringify({ answers, elapsedSeconds, attemptId, autoSubmitted }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Nộp bài thất bại. Vui lòng thử lại.");
  }

  return (await res.json()) as AttemptResult;
}

/**
 * Mở một lượt làm bài ở server, ngay khi bài nghe bắt đầu.
 *
 * Trả `null` khi hỏng, và đó là chủ ý: không mở được lượt thì cô không thấy em
 * ấy trên bảng lớp, nhưng bài thi vẫn phải chạy. Chặn học sinh vào phòng thi vì
 * một tính năng theo dõi là đánh đổi sai hướng.
 *
 * Listening lưu cả bài một dòng nên luôn là `scope: "test"`, không có passage lẻ.
 */
export async function openListeningAttempt(slug: string): Promise<string | null> {
  try {
    const res = await fetch("/api/practice/attempt/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "listening", scope: "test", target: slug }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { attemptId?: string };
    return data.attemptId ?? null;
  } catch {
    return null;
  }
}
