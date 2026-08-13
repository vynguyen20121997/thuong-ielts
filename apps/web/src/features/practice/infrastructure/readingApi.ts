import type { ReadingAnswers, ReadingResult, ReadingTestSummary } from "../domain/types";

/**
 * Browser-side transport. The only place in the client bundle that knows the
 * URL shape of the practice API — hooks call these functions, never `fetch`.
 */

export async function fetchReadingTests(): Promise<ReadingTestSummary[]> {
  const res = await fetch("/api/practice/reading", { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách đề đọc.");
  return (await res.json()) as ReadingTestSummary[];
}

export async function submitReadingAttempt(
  slug: string,
  answers: ReadingAnswers,
  elapsedSeconds: number
): Promise<ReadingResult> {
  const res = await fetch(`/api/practice/reading/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, elapsedSeconds }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Nộp bài thất bại. Vui lòng thử lại.");
  }

  return (await res.json()) as ReadingResult;
}
