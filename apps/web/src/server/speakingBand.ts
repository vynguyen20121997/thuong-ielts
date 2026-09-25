import "server-only";

import {
  SPEAKING_CRITERIA,
  bandFromLevel,
  overallBand,
} from "../features/speaking/domain/criteria";
import {
  MIN_WORDS_TO_GRADE,
  speechStats,
} from "../features/speaking/domain/speech";
import type {
  CriterionScore,
  SpeakingResult,
  SpeakingState,
  TranscriptSubmission,
} from "../features/speaking/domain/types";

/*
  Chấm một bài nói theo tiêu chí Speaking, từ BẢN GHI CHỮ.

  Dựng theo đúng khuôn `writingBand.ts` — một request cho mọi tiêu chí (Jev
  đọc `state` một lần rồi trả lời song song, gửi nhiều request là trả tiền cho
  cùng một bài mấy lần), và không bao giờ ném lỗi.

  ## Ba tiêu chí, không phải bốn

  Bản ghi chữ giữ được từ ngữ và câu cú, nên Trôi chảy / Vốn từ / Ngữ pháp
  chấm được. Phát âm thì KHÔNG: chữ không mang trọng âm, ngữ điệu hay âm cuối
  bị nuốt. Nên tiêu chí `P` (`needsAudio`) bị loại khỏi câu hỏi gửi đi, kết
  quả trả về thiếu hẳn nó, và `overall` vì thế là `null`. Đắp cho đủ bốn ô
  bằng một con số đoán ra thì học sinh đọc band tổng như band thật.

  ## Vì sao gửi kèm số giây, tốc độ nói và số tiếng ngập ngừng

  Bản ghi chữ trơ trọi mất hẳn chiều thời gian: 60 từ trong 20 giây và 60 từ
  trong 2 phút ra cùng một đoạn chữ, mà hai bài đó khác hẳn nhau ở tiêu chí
  Trôi chảy. Ba con số ấy đều ĐẾM ĐƯỢC (`domain/speech.ts`), không phải đoán.

  `server-only` ở dòng đầu là cố ý: lỡ import từ component client thì build
  hỏng ngay, thay vì nhét `TYPESAFE_API_KEY` vào bundle gửi xuống trình duyệt.
*/

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const TIMEOUT_MS = 25000;
/* Hai phút nói nhanh nhất cũng chưa tới 400 từ; chặn để cú dán khổng lồ không thành hoá đơn. */
const MAX_CHARS = 6000;

export function speakingGraderConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

export async function gradeTranscriptBand(
  input: TranscriptSubmission,
): Promise<SpeakingState> {
  const transcript = input.transcript.trim();
  const stats = speechStats(transcript, input.durationSeconds);

  if (!stats.words) {
    return {
      kind: "ungraded",
      reason: "Chưa nghe được chữ nào — thử nói to hơn hoặc kiểm tra mic.",
    };
  }
  if (stats.words < MIN_WORDS_TO_GRADE) {
    return {
      kind: "ungraded",
      reason: `Mới nghe được ${stats.words} từ. Cần ít nhất ${MIN_WORDS_TO_GRADE} từ thì chấm mới có nghĩa — nói thêm rồi bấm chấm lại.`,
    };
  }

  const key = process.env.TYPESAFE_API_KEY;
  if (!key) return { kind: "ungraded", reason: "Chưa cấu hình dịch vụ chấm." };

  /* Chỉ những tiêu chí chấm được từ chữ. `P` đứng ngoài, có lý do ở đầu file. */
  const gradable = SPEAKING_CRITERIA.filter((c) => !c.needsAudio);

  const questions: Record<string, unknown> = {};
  for (const criterion of gradable) {
    questions[criterion.id] = {
      type: "score",
      instructions: criterion.instructions,
      criteria: criterion.levels,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        state: {
          part: `IELTS Speaking Part ${input.part}`,
          examiner_question: input.prompt,
          /* Nói rõ đây là bản máy nhận dạng, để model không chấm lỗi chấm câu. */
          transcript_note:
            "This is an automatic speech-to-text transcript of a spoken answer. It has no punctuation and may contain a few misheard words. Judge the speech, not the transcription.",
          candidate_answer: transcript.slice(0, MAX_CHARS),
          seconds_spoken: stats.seconds,
          words_spoken: stats.words,
          words_per_minute: stats.wpm,
          hesitation_markers: stats.fillers,
        },
        questions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `TypeSafe trả ${response.status} khi chấm bài nói:`,
        (await response.text()).slice(0, 300),
      );
      return { kind: "ungraded", reason: "Dịch vụ chấm đang bận." };
    }

    const payload = (await response.json()) as {
      answers?: Record<string, { score?: number; confidence?: number }>;
    };
    const answers = payload.answers ?? {};

    const criteria: CriterionScore[] = [];
    for (const criterion of gradable) {
      const level = answers[criterion.id]?.score;
      /*
        Thiếu một tiêu chí thì bỏ cả lượt chấm, giống Writing: hiện hai thẻ có
        điểm và một thẻ trống thì học sinh không có cách nào biết mình đang
        nhìn một kết quả thiếu.
      */
      if (typeof level !== "number") {
        return {
          kind: "ungraded",
          reason: "Dịch vụ chấm trả về thiếu tiêu chí.",
        };
      }
      const confidence = answers[criterion.id]?.confidence;
      criteria.push({
        id: criterion.id,
        band: bandFromLevel(level),
        confidence: typeof confidence === "number" ? confidence : null,
      });
    }

    const bands = Object.fromEntries(criteria.map((c) => [c.id, c.band]));
    const result: SpeakingResult = {
      questionId: input.questionId,
      durationSeconds: stats.seconds,
      transcript,
      /* Chưa đánh dấu được vị trí lỗi: bộ chấm dạng `score` chỉ trả con số. */
      marks: [],
      criteria,
      /* `null` vì thiếu Phát âm — `overallBand` đòi đủ bốn tiêu chí. */
      overall: overallBand(bands),
      notes: {},
      gradedAt: new Date().toISOString(),
    };
    return { kind: "graded", result };
  } catch (err) {
    console.error("Gọi TypeSafe để chấm bài nói thất bại:", err);
    return { kind: "ungraded", reason: "Không gọi được dịch vụ chấm." };
  } finally {
    clearTimeout(timer);
  }
}
