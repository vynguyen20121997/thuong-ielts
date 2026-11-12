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
  SpeakingCriterionId,
  SpeakingResult,
  SpeakingState,
  TranscriptMark,
} from "../features/speaking/domain/types";

/*
  Chấm một bài nói từ FILE THU ÂM bằng Gemini — đường duy nhất chấm được Phát
  âm, vì chữ không mang trọng âm, ngữ điệu hay âm cuối bị nuốt.

  ## Vì sao gọi một lần, không dùng Live/Realtime

  Bài đã thu xong; cần một lượt nghe rồi chấm, không cần hội thoại hai chiều.
  `generateContent` với audio đính kèm + `responseSchema` ép model trả đúng
  khuôn JSON, nên không phải đoán cấu trúc câu trả lời.

  ## Model tự ghi lại lời nói

  Bản ghi của trình duyệt dễ sai với giọng Việt và không có trên Firefox. Model
  nghe audio thì tự chép lại, và các đoạn đánh dấu lỗi (`marks`) trỏ vào chính
  bản chép ấy — trỏ vào bản của trình duyệt thì vị trí lệch.

  ## Không lưu audio

  File chỉ sống trong request này: gửi đi chấm rồi bỏ. Giọng nói học sinh là
  dữ liệu cá nhân; lưu lại cần lý do và chỗ để xoá, hiện chưa có cả hai.

  Thiếu một tiêu chí, level ngoài thang, hay JSON hỏng → `ungraded`, không
  vá. Cùng luật với `speakingBand.ts`: thà không có điểm còn hơn bảng điểm thiếu
  mà học sinh không biết là thiếu.
*/

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 45000;

export function audioGraderConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type AudioSubmission = {
  questionId: string;
  prompt: string;
  part: 1 | 2 | 3;
  durationSeconds: number;
  audio: Buffer;
  mimeType: string;
};

type CriterionReply = { level: number; note: string };
type Reply = {
  transcript: string;
  FC: CriterionReply;
  LR: CriterionReply;
  GRA: CriterionReply;
  P: CriterionReply;
  marks: { quote: string; kind: "error" | "good"; fix?: string }[];
};

const criterionSchema = {
  type: "OBJECT",
  properties: {
    level: { type: "INTEGER", minimum: 0, maximum: 5 },
    note: { type: "STRING" },
  },
  required: ["level", "note"],
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    transcript: { type: "STRING" },
    FC: criterionSchema,
    LR: criterionSchema,
    GRA: criterionSchema,
    P: criterionSchema,
    marks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          quote: { type: "STRING" },
          kind: { type: "STRING", enum: ["error", "good"] },
          fix: { type: "STRING" },
        },
        required: ["quote", "kind"],
      },
    },
  },
  required: ["transcript", "FC", "LR", "GRA", "P", "marks"],
};

function instructions(input: AudioSubmission): string {
  const scales = SPEAKING_CRITERIA.map(
    (c) =>
      `${c.id} — ${c.english}. ${c.id === "P" ? c.instructions : c.instructions.replace(/The text is an automatic transcript[^.]*\.( [^.]*\.)?/g, "").trim()}\n` +
      c.levels.map((l, i) => `  level ${i} (band ${i + 4}): ${l}`).join("\n"),
  ).join("\n\n");

  return [
    `You are an IELTS Speaking examiner. The attached audio is a candidate's answer to IELTS Speaking Part ${input.part}.`,
    `Examiner question: "${input.prompt}"`,
    "",
    "1. Transcribe exactly what the candidate says, in English, including hesitations (um, uh), repetitions and self-corrections. Do not fix grammar.",
    "2. Rate each criterion on the 0–5 level scale below, judging only this answer. Listen to the audio itself for Pronunciation and Fluency (pauses, pace, stress, intonation, final sounds).",
    "3. For each criterion write `note`: ONE short sentence in Vietnamese telling the student the most important thing to improve, citing what you heard.",
    "4. `marks`: up to 8 items. `quote` must be copied character-for-character from your transcript. Use kind \"error\" for a grammar/word-choice/pronunciation problem with `fix` = corrected English (for pronunciation, write the word and a simple stress hint like in-for-MA-tion); use kind \"good\" for a strong phrase, without `fix`.",
    "",
    "If the audio is silent, not English, or unintelligible, return an empty transcript and level 0 for every criterion.",
    "",
    scales,
  ].join("\n");
}

/** Tìm đoạn trích trong bản chép; không thấy thì bỏ mark đó chứ không đoán vị trí. */
function locateMarks(transcript: string, marks: Reply["marks"]): TranscriptMark[] {
  const lower = transcript.toLowerCase();
  const out: TranscriptMark[] = [];
  let from = 0;
  for (const m of marks) {
    const quote = m.quote?.trim();
    if (!quote) continue;
    let start = lower.indexOf(quote.toLowerCase(), from);
    if (start < 0) start = lower.indexOf(quote.toLowerCase());
    if (start < 0) continue;
    const end = start + quote.length;
    if (out.some((o) => start < o.end && end > o.start)) continue;
    out.push({
      start,
      end,
      kind: m.kind === "good" ? "good" : "error",
      ...(m.kind === "error" && m.fix ? { fix: m.fix } : {}),
    });
    from = end;
  }
  return out.sort((a, b) => a.start - b.start);
}

export async function gradeAudioBand(
  input: AudioSubmission,
): Promise<SpeakingState> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { kind: "ungraded", reason: "Chưa cấu hình dịch vụ chấm audio." };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: instructions(input) },
              {
                inline_data: {
                  /* Gemini không nhận tham số codecs trong mime. */
                  mime_type: input.mimeType.split(";")[0],
                  data: input.audio.toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          /* Mặc định model suy nghĩ lâu: đo được 36s/bài. Mức "low" đủ cho
             việc chấm theo thang có sẵn, và học sinh không phải ngồi chờ. */
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `Gemini trả ${response.status} khi chấm audio:`,
        (await response.text()).slice(0, 300),
      );
      return { kind: "ungraded", reason: "Dịch vụ chấm audio đang bận." };
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("");
    if (!text) return { kind: "ungraded", reason: "Dịch vụ chấm không trả lời." };

    let reply: Reply;
    try {
      reply = JSON.parse(text) as Reply;
    } catch {
      return { kind: "ungraded", reason: "Dịch vụ chấm trả về dữ liệu hỏng." };
    }

    const transcript = (reply.transcript ?? "").trim();
    const stats = speechStats(transcript, input.durationSeconds);
    if (!stats.words) {
      return {
        kind: "ungraded",
        reason: "Máy không nghe ra lời nói tiếng Anh trong file thu — kiểm tra mic rồi nói lại.",
      };
    }
    if (stats.words < MIN_WORDS_TO_GRADE) {
      return {
        kind: "ungraded",
        reason: `Mới nghe được ${stats.words} từ. Cần ít nhất ${MIN_WORDS_TO_GRADE} từ thì chấm mới có nghĩa — nói lại dài hơn.`,
      };
    }

    const criteria: CriterionScore[] = [];
    const notes: Partial<Record<SpeakingCriterionId, string>> = {};
    for (const c of SPEAKING_CRITERIA) {
      const r = reply[c.id];
      if (!r || !Number.isInteger(r.level) || r.level < 0 || r.level > 5) {
        return { kind: "ungraded", reason: "Dịch vụ chấm trả về thiếu tiêu chí." };
      }
      criteria.push({ id: c.id, band: bandFromLevel(r.level), confidence: null });
      if (r.note?.trim()) notes[c.id] = r.note.trim();
    }

    const bands = Object.fromEntries(criteria.map((c) => [c.id, c.band]));
    const result: SpeakingResult = {
      questionId: input.questionId,
      durationSeconds: stats.seconds,
      transcript,
      marks: locateMarks(transcript, reply.marks ?? []),
      criteria,
      overall: overallBand(bands),
      notes,
      gradedAt: new Date().toISOString(),
    };
    return { kind: "graded", result };
  } catch (err) {
    console.error("Gọi Gemini để chấm audio thất bại:", err);
    return { kind: "ungraded", reason: "Không gọi được dịch vụ chấm audio." };
  } finally {
    clearTimeout(timer);
  }
}
