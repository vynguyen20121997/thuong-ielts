import type { SpeakingGrader } from "../application/ports";
import type { SpeakingState, TranscriptSubmission } from "../domain/types";
import { stubGrader } from "./stubs";

/*
  Bản cài đặt thật của cổng chấm — phần chấm được.

  `gradeTranscript` gọi route `/api/speaking/grade`: bản ghi chữ do trình duyệt
  nhận dạng, chấm ba tiêu chí đọc ra được từ chữ.

  `grade(blob)` vẫn là bản tạm: gửi file thu âm lên chấm cần một model NGHE
  được, chưa có. Để nguyên bản tạm ở đây thay vì xoá khỏi cổng, vì tiêu chí
  Phát âm chỉ chấm được bằng đường đó — ngày có model nghe được thì thay đúng
  một hàm này.
*/

export const apiGrader: SpeakingGrader = {
  grade: stubGrader.grade,

  async gradeTranscript(input: TranscriptSubmission): Promise<SpeakingState> {
    try {
      const response = await fetch("/api/speaking/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        return {
          kind: "ungraded",
          reason: "Máy chủ chấm đang bận. Bấm chấm lại sau một lát.",
        };
      }
      const payload = (await response.json()) as { speaking?: SpeakingState };
      /*
        Route luôn trả `speaking`. Thiếu nó nghĩa là đang nói chuyện với một
        thứ khác (proxy, trang đăng nhập) — nói ra chứ đừng dựng một kết quả
        rỗng rồi để học sinh tưởng mình bị chấm 0.
      */
      return (
        payload.speaking ?? {
          kind: "ungraded",
          reason: "Máy chủ trả về dữ liệu lạ.",
        }
      );
    } catch {
      return {
        kind: "ungraded",
        reason: "Mất mạng giữa chừng. Bản ghi vẫn còn — bấm chấm lại.",
      };
    }
  },
};
