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
  attemptId?: string | null,
  autoSubmitted = false,
): Promise<ReadingResult> {
  const path =
    mode === "test"
      ? `/api/practice/reading/test/${id}/submit`
      : `/api/practice/reading/${id}/submit`;

  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `attemptId` là lượt đã mở lúc bấm bắt đầu. Có nó thì server chốt đúng
    // lượt ấy thay vì đẻ ra một dòng mới, và bảng lớp của cô thấy em này
    // chuyển sang "đã nộp" thay vì vẫn treo ở "đang làm" mãi mãi.
    body: JSON.stringify({ answers, elapsedSeconds, attemptId, autoSubmitted }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Nộp bài thất bại. Vui lòng thử lại.");
  }

  return (await res.json()) as ReadingResult;
}

/**
 * Mở một lượt làm bài ở server, ngay khi học sinh bấm bắt đầu.
 *
 * Trả `null` khi hỏng, và đó là chủ ý: không mở được lượt thì cô không thấy em
 * ấy trên bảng lớp, nhưng bài thi vẫn phải chạy. Chặn học sinh vào phòng thi vì
 * một tính năng theo dõi là đánh đổi sai hướng.
 */

/*
  Thử lại vài lần trước khi bỏ cuộc.

  DNS của RDS chập chờn — một cú `ENOTFOUND` đúng vào giây học sinh bấm bắt đầu
  là em ấy VÔ HÌNH với cô suốt cả buổi, vì không có gì thử lại. Bài thi vẫn chạy
  bình thường (đó là lý do hàm này trả `null` chứ không ném), nhưng cô mất hẳn
  một em mà không có gì trên màn hình nói rằng đã mất.

  Đo được: 2/6 học sinh ảo trượt vì đúng lỗi này trong một lần chạy thử.
*/
const SO_LAN_THU = 3;

/**
 * Token của bài cô giao, lấy từ `?bai=` trên URL.
 *
 * Đọc thẳng từ thanh địa chỉ thay vì truyền qua chục lớp component: token chỉ
 * có nghĩa với đúng một lời gọi (mở lượt), và luồn nó qua từng props chỉ để
 * tới đây thì mọi component ở giữa đều phải biết về một thứ không liên quan
 * gì tới việc chúng làm.
 */
function tokenBaiGiao(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("bai");
}


export async function openReadingAttempt(
  mode: ReadingPaper["mode"],
  id: string,
): Promise<string | null> {
  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    try {
      const res = await fetch("/api/practice/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: "reading",
          scope: mode === "test" ? "test" : "paper",
          target: id,
          token: tokenBaiGiao(),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { attemptId?: string };
        return data.attemptId ?? null;
      }
      // 401/404 là câu trả lời dứt khoát, thử lại cũng thế. Chỉ 5xx mới đáng thử.
      if (res.status < 500) return null;
    } catch {
      // Mạng hỏng — rơi xuống nhánh chờ rồi thử lại.
    }
    if (lan < SO_LAN_THU) await new Promise((r) => setTimeout(r, 400 * lan));
  }
  return null;
}
