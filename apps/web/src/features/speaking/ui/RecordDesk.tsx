"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";

import {
  MAX_RETAKES,
  PREP_SECONDS,
  TALK_SECONDS,
  formatClock,
} from "../domain/timing";
import type { SpeakingQuestion, SpeakingState } from "../domain/types";
import { MIN_WORDS_TO_GRADE, speechStats } from "../domain/speech";
import { useCountdown } from "../application/useCountdown";
import { useRecorder } from "../application/useRecorder";
import { useSpeechToText } from "../application/useSpeechToText";
import { grader } from "../infrastructure";
import SpeakingReport from "./SpeakingReport";

/*
  Màn thu âm một câu. Ba bước theo thi thật: chuẩn bị (chỉ Part 2) → nói →
  nộp. Thu lại đúng MAX_RETAKES lần; nghe lại chỉ sau khi đã dừng.

  Thu âm và nhận dạng lời nói chạy SONG SONG, hai đường khác nhau và mỗi
  đường làm được một việc bên kia không làm được:

  - File thu để nghe lại — nghe chính giọng mình là cách duy nhất tự soát
    phát âm, và là thứ gửi cô nghe khi cần.
  - Bản ghi chữ để chấm — chữ hiện ra ngay trong lúc nói, và ba tiêu chí
    Trôi chảy / Vốn từ / Ngữ pháp chấm được từ nó.

  File thu KHÔNG gửi lên server: chấm từ audio cần một model nghe được, chưa
  có, nên gửi lên chỉ tốn chỗ. Khi có, `grader.grade()` là chỗ duy nhất nhận
  Blob — và đó cũng là lúc tiêu chí Phát âm có điểm.
*/
export default function RecordDesk({
  question,
  demoResult,
}: {
  question: SpeakingQuestion;
  /** Chỉ dev: kết quả mẫu để xem bảng điểm. Route production truyền `undefined`. */
  demoResult?: SpeakingState;
}) {
  const prepSeconds = PREP_SECONDS[question.part];
  const talkSeconds = TALK_SECONDS[question.part];

  const [phase, setPhase] = useState<"prep" | "talk" | "review">(
    prepSeconds ? "prep" : "talk",
  );
  const [notes, setNotes] = useState("");
  const [retakes, setRetakes] = useState(0);
  const [state, setState] = useState<SpeakingState | null>(demoResult ?? null);
  const [submitting, setSubmitting] = useState(false);

  const prep = useCountdown(prepSeconds, () => setPhase("talk"));
  const rec = useRecorder(talkSeconds);
  const speech = useSpeechToText();

  /*
    Bản ghi chốt lại lúc dừng. Đọc thẳng `speech.transcript` lúc nộp thì thu
    lại một lần là mất — hook xoá bản cũ khi bắt đầu nghe lần mới.
  */
  const captured = useRef("");

  useEffect(() => {
    if (phase === "prep") prep.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rec.status === "done") {
      /* Thu tự dừng khi hết giờ, nên chốt bản ghi ở đây chứ không ở nút bấm. */
      if (!captured.current) captured.current = speech.transcript.trim();
      speech.stop();
      setPhase("review");
      setState((s) =>
        s?.kind === "graded"
          ? s
          : { kind: "recorded", durationSeconds: rec.seconds },
      );
    }
  }, [rec.status, rec.seconds]);

  function beginTalk() {
    captured.current = "";
    speech.reset();
    speech.start();
    void rec.start();
  }

  function endTalk() {
    captured.current = speech.transcript.trim();
    speech.stop();
    rec.stop();
  }

  async function submit() {
    if (submitting) return;
    const text = captured.current;
    if (!text) {
      /*
        Có file thu mà không có chữ nào: mic bắt được tiếng nhưng bộ nghe của
        trình duyệt không ra chữ. Nói thẳng chứ đừng gửi một bản ghi rỗng đi
        chấm rồi nhận về một lý do khó hiểu hơn.
      */
      setState({
        kind: "ungraded",
        reason:
          "Chưa nghe ra chữ nào trong bài nói. Nghe lại file thu xem có tiếng không, rồi thu lại và nói to hơn.",
      });
      return;
    }

    /* Quá ngắn thì trả lời tại chỗ, khỏi đi một vòng mạng. Chốt thật vẫn ở
       server; hai bên đọc chung `MIN_WORDS_TO_GRADE`. */
    const words = speechStats(text, rec.seconds).words;
    if (words < MIN_WORDS_TO_GRADE) {
      setState({
        kind: "ungraded",
        reason: `Mới nghe được ${words} từ. Cần ít nhất ${MIN_WORDS_TO_GRADE} từ thì chấm mới có nghĩa — thu lại và nói dài hơn.`,
      });
      return;
    }

    setSubmitting(true);
    setState({ kind: "grading" });
    const next = await grader.gradeTranscript({
      questionId: question.id,
      prompt: question.prompt,
      part: question.part,
      transcript: text,
      durationSeconds: rec.seconds,
    });
    setState(next);
    setSubmitting(false);
  }

  function retake() {
    if (retakes >= MAX_RETAKES) return;
    setRetakes((n) => n + 1);
    setState(null);
    captured.current = "";
    speech.reset();
    rec.reset();
    setPhase("talk");
  }

  const talkLeft = Math.max(0, talkSeconds - rec.seconds);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex flex-col gap-4 rounded-2xl border border-sage-3 bg-white p-6 md:p-7">
        <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/65">
          {question.part === 2
            ? "Cue card"
            : `Part ${question.part} · ${question.topic}`}
        </p>
        <h1 className="text-2xl font-extrabold leading-snug text-brand">
          {question.prompt}
        </h1>
        {question.bullets && (
          <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
            {question.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}

        {phase !== "prep" && (
          <div className="flex flex-col gap-2">
            <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/65">
              Máy nghe và ghi lại — có thể sai vài từ
            </p>
            {/*
              Ô chữ có mặt từ trước khi bấm nói, không mọc ra giữa chừng: một
              khối mới xuất hiện lúc đang nói sẽ đẩy cả cột xuống đúng lúc
              người ta đang nhìn đồng hồ.
            */}
            <div
              aria-live="polite"
              aria-label="Bản ghi lời nói"
              className="min-h-[6rem] rounded-xl bg-mist-3 px-4 py-3.5 text-[15px] leading-[1.9]"
            >
              {captured.current || speech.finalText || speech.interimText ? (
                <p className="break-words">
                  {captured.current || speech.finalText}
                  {!captured.current && speech.interimText && (
                    <>
                      {" "}
                      {/* Phần máy còn đang đoán — mờ hơn, vì nó còn đổi. */}
                      <span className="text-ink/65 underline decoration-dotted decoration-ink/30 underline-offset-4">
                        {speech.interimText}
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-sm text-ink/65">
                  {speech.status === "unsupported"
                    ? "Trình duyệt này không nghe được lời nói (Firefox chưa có). File thu vẫn lưu được, nhưng chưa chấm được."
                    : speech.status === "listening"
                      ? "Đang nghe… nói một câu là chữ hiện ra ở đây."
                      : "Bấm nút mic rồi trả lời thành tiếng. Chữ sẽ hiện ra ngay ở ô này."}
                </p>
              )}
            </div>
            {(speech.status === "listening" || captured.current) && (
              <p className="flex flex-wrap gap-x-5 gap-y-1 text-2xs text-ink/60">
                {(() => {
                  const stats = speechStats(
                    captured.current || speech.transcript,
                    rec.seconds,
                  );
                  return (
                    <>
                      <span>
                        <b className="text-ink/80">{stats.words}</b> từ
                      </span>
                      <span>
                        <b className="text-ink/80">{stats.wpm}</b> từ/phút
                      </span>
                      <span>
                        <b className="text-ink/80">{stats.fillers}</b> tiếng
                        ngập ngừng (um, uh…)
                      </span>
                    </>
                  );
                })()}
              </p>
            )}
          </div>
        )}

        {phase === "prep" && (
          <div className="mt-auto flex flex-wrap items-center gap-4 rounded-xl bg-mist-3 p-4">
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-ink/65">
                Chuẩn bị
              </p>
              <p className="font-mono text-2xl font-extrabold text-brand">
                {formatClock(prep.remaining)}
              </p>
            </div>
            <label className="flex-1 min-w-[220px]">
              <span className="sr-only">Ghi chú nhanh</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi vài từ khoá…"
                className="h-12 w-full resize-none rounded-lg border border-sage-3 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={prep.skip}
              className="rounded-xl border border-sage-3 bg-white px-4 py-2.5 text-sm font-bold"
            >
              Nói luôn
            </button>
          </div>
        )}

        {phase !== "prep" && notes.trim() && (
          <p className="mt-auto rounded-xl bg-mist-3 px-4 py-3 text-sm text-ink/70">
            <b className="text-ink">Ghi chú của bạn:</b> {notes}
          </p>
        )}
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl bg-brand-deep p-6 text-white">
        <p className="text-2xs font-extrabold uppercase tracking-wider text-leaf-dark">
          Bài nói của bạn
        </p>

        <div className="flex flex-col items-center gap-3 py-3">
          {rec.status !== "done" ? (
            <button
              type="button"
              disabled={phase === "prep" || rec.status === "asking"}
              onClick={rec.status === "recording" ? endTalk : beginTalk}
              aria-label={
                rec.status === "recording" ? "Hoàn thành nói" : "Bắt đầu nói"
              }
              className={`flex h-24 w-24 items-center justify-center rounded-full disabled:opacity-40 ${
                rec.status === "recording" ? "bg-warn" : "bg-leaf-dark"
              }`}
              style={{
                boxShadow: `0 0 0 ${8 + Math.round(rec.level * 18)}px rgba(134,214,90,0.18)`,
              }}
            >
              {rec.status === "recording" ? (
                <Square size={30} className="text-white" fill="currentColor" />
              ) : (
                <Mic size={34} className="text-brand-deep" />
              )}
            </button>
          ) : (
            <audio
              controls
              src={rec.url ?? undefined}
              className="w-full"
              preload="metadata"
            />
          )}
          <span className="font-mono text-3xl font-extrabold tracking-tight">
            {rec.status === "recording"
              ? formatClock(talkLeft)
              : formatClock(rec.seconds)}
          </span>
          <span className="text-2xs text-white/70">
            {phase === "prep"
              ? "Hết giờ chuẩn bị mới thu được"
              : rec.status === "recording"
                ? `Tự dừng sau ${formatClock(talkSeconds)}`
                : rec.status === "done"
                  ? `Đã thu · còn ${MAX_RETAKES - retakes} lần thu lại`
                  : `Nói tối đa ${formatClock(talkSeconds)}`}
          </span>
        </div>

        {rec.status === "denied" && (
          <p role="alert" className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            Trình duyệt chưa cho dùng mic. Bấm biểu tượng ổ khoá cạnh địa chỉ
            web, cho phép Microphone rồi thử lại.
          </p>
        )}
        {rec.status === "unsupported" && (
          <p role="alert" className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            Trình duyệt này không thu âm được. Dùng Chrome, Edge hoặc Safari
            mới.
          </p>
        )}

        <ul className="mt-auto space-y-1.5 rounded-xl bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/85">
          <li>Thu xong mới nghe lại được — giống thi thật.</li>
          <li>Thu lại tối đa {MAX_RETAKES} lần.</li>
          <li>
            Máy chấm 3 tiêu chí đọc được từ bản ghi chữ. Phát âm phải nghe mới
            chấm được nên để cô chấm.
          </li>
        </ul>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={retake}
            disabled={rec.status !== "done" || retakes >= MAX_RETAKES}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/25 px-3 py-3 text-sm font-bold disabled:opacity-40"
          >
            <RotateCcw size={15} /> Thu lại
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={
              rec.status !== "done" || submitting || state?.kind === "graded"
            }
            className="flex-1 rounded-xl bg-leaf-dark px-3 py-3 text-sm font-extrabold text-brand-deep disabled:opacity-40"
          >
            {submitting ? "Đang chấm…" : "Chấm bài nói"}
          </button>
        </div>
      </aside>

      {state && state.kind !== "recorded" && (
        <div className="lg:col-span-2">
          <SpeakingReport
            state={state}
            audioUrl={rec.url}
            onRetry={submit}
            retrying={submitting}
          />
        </div>
      )}
    </div>
  );
}
