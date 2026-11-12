import type { SpeakingGrader } from "../application/ports";
import type { SpeakingState, TranscriptSubmission } from "../domain/types";

/*
  Bản cài đặt thật của cổng chấm.

  `grade(blob)` gửi file thu âm lên `/api/speaking/grade-audio` — chấm cả bốn
  tiêu chí, kể cả Phát âm. Đường ấy hỏng (dịch vụ bận, hết lượt trong ngày,
  chưa đăng nhập) mà trình duyệt có bản ghi chữ thì lùi về `gradeTranscript`:
  ba tiêu chí còn hơn không có gì, và bảng điểm tự hiện ô Phát âm "chưa chấm".

  `gradeTranscript` gọi `/api/speaking/grade`: chấm ba tiêu chí từ chữ.
*/

async function readState(response: Response): Promise<SpeakingState | null> {
  try {
    const payload = (await response.json()) as { speaking?: SpeakingState };
    return payload.speaking ?? null;
  } catch {
    return null;
  }
}

async function gradeTranscript(
  input: TranscriptSubmission,
): Promise<SpeakingState> {
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
    /*
      Route luôn trả `speaking`. Thiếu nó nghĩa là đang nói chuyện với một
      thứ khác (proxy, trang đăng nhập) — nói ra chứ đừng dựng một kết quả
      rỗng rồi để học sinh tưởng mình bị chấm 0.
    */
    return (
      (await readState(response)) ?? {
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
}

export const apiGrader: SpeakingGrader = {
  async grade(recording, input): Promise<SpeakingState> {
    let audioState: SpeakingState;
    try {
      const form = new FormData();
      form.append("audio", recording);
      form.append("questionId", input.questionId);
      form.append("prompt", input.prompt);
      form.append("part", String(input.part));
      form.append("durationSeconds", String(input.durationSeconds));
      const response = await fetch("/api/speaking/grade-audio", {
        method: "POST",
        body: form,
      });
      audioState = (await readState(response)) ?? {
        kind: "ungraded",
        reason:
          response.status === 401
            ? "Đăng nhập để được chấm Phát âm."
            : "Máy chủ chấm audio đang bận.",
      };
    } catch {
      audioState = { kind: "ungraded", reason: "Mất mạng khi gửi file thu." };
    }

    if (audioState.kind === "graded" || !input.transcript.trim()) {
      return audioState;
    }
    const fallback = await gradeTranscript(input);
    return fallback.kind === "graded" ? fallback : audioState;
  },

  gradeTranscript,
};
