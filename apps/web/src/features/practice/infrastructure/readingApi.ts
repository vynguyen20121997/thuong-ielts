import { paperFromTest } from "../domain/paper";
import type {
  ReadingAnswers,
  ReadingPaper,
  ReadingResult,
  ReadingTest,
  ReadingTestSummary,
} from "../domain/types";

/**
 * Browser-side transport. The only place in the client bundle that knows the
 * URL shape of the practice API — hooks call these functions, never `fetch`.
 */

export async function fetchReadingTests(): Promise<ReadingTestSummary[]> {
  const res = await fetch("/api/practice/reading", { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách đề đọc.");
  return (await res.json()) as ReadingTestSummary[];
}

/**
 * Tải nội dung bài thi khi học sinh bấm bắt đầu. Đây là chỗ màn chờ thật sự
 * chờ — không phải hoạt hình cho có.
 */
export async function fetchReadingPaper(
  mode: ReadingPaper["mode"],
  id: string,
): Promise<ReadingPaper> {
  const path = mode === "test" ? `/api/practice/reading/test/${id}` : `/api/practice/reading/${id}`;

  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Không tải được đề. Vui lòng thử lại.");
  }

  const data = await res.json();

  // Passage lẻ: endpoint cũ trả về ReadingTest, gói lại thành paper một phần
  // để màn thi chỉ phải biết đúng một kiểu dữ liệu.
  return mode === "test" ? (data as ReadingPaper) : paperFromTest(data as ReadingTest);
}

/**
 * Nộp bài. `mode` quyết định endpoint: một passage lẻ hay cả test 3 passage —
 * hai đường chấm khác nhau ở server, nhưng client gọi cùng một hàm.
 */
export async function submitReadingAttempt(
  mode: ReadingPaper["mode"],
  id: string,
  answers: ReadingAnswers,
  elapsedSeconds: number,
): Promise<ReadingResult> {
  const path =
    mode === "test"
      ? `/api/practice/reading/test/${id}/submit`
      : `/api/practice/reading/${id}/submit`;

  const res = await fetch(path, {
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
