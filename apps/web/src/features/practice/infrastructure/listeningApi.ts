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
): Promise<AttemptResult> {
  const res = await fetch(`/api/practice/listening/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, elapsedSeconds }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Nộp bài thất bại. Vui lòng thử lại.");
  }

  return (await res.json()) as AttemptResult;
}
