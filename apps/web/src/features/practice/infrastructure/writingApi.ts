import type { WritingFeedback } from "../domain/writing";
import type { Coaching } from "../domain/writingCoach";

/** Lý do không có checklist, khác nhau ở cách màn hình nói với học sinh. */
export type FeedbackReason = "too-short" | "unavailable" | undefined;

export type CheckResponse = WritingFeedback & { reason?: FeedbackReason };

export async function checkWriting(
  promptId: string,
  essay: string,
): Promise<CheckResponse> {
  const res = await fetch("/api/practice/writing/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptId, essay }),
  });

  // `fetch` chỉ reject khi đứt mạng — HTTP 500 vẫn resolve và body {error} của
  // nó vẫn parse ra JSON hợp lệ. Cùng cái bẫy đã ghi trong `Testimonials.tsx`.
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `Chấm nháp thất bại (${res.status}).`);
  }

  return (await res.json()) as CheckResponse;
}

/**
 * Xin gợi ý cho đoạn tiếp theo. `null` = server không đọc được lúc này
 * (204); nơi gọi phải GIỮ NGUYÊN gợi ý đang hiện, đừng xoá trắng bảng.
 */
export async function trackWriting(
  promptId: string,
  essay: string,
  signal?: AbortSignal,
): Promise<Coaching | null> {
  const res = await fetch("/api/practice/writing/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptId, essay }),
    // Huỷ được: học sinh gõ tiếp trong lúc request đang bay thì câu trả lời cũ
    // đã lạc hậu — bỏ nó đi rẻ hơn là để nó về rồi ghi đè gợi ý mới.
    signal,
  });

  if (res.status === 204) return null;
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `Không lấy được gợi ý (${res.status}).`);
  }
  return (await res.json()) as Coaching;
}
