"use client";

import { useEffect, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";

import {
  MAX_RETAKES,
  PREP_SECONDS,
  TALK_SECONDS,
  formatClock,
} from "../domain/timing";
import type { SpeakingQuestion, SpeakingState } from "../domain/types";
import { useCountdown } from "../application/useCountdown";
import { useRecorder } from "../application/useRecorder";
import { grader } from "../infrastructure";
import SpeakingReport from "./SpeakingReport";

/*
  Màn thu âm một câu. Ba bước theo thi thật: chuẩn bị (chỉ Part 2) → nói →
  nộp. Thu lại đúng MAX_RETAKES lần; nghe lại chỉ sau khi đã dừng.

  Không giữ file thu trên server ở bước này — bộ chấm chưa nối, gửi lên chỉ
  tốn chỗ. Khi nối, `grader.grade()` là chỗ duy nhất nhận Blob.
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

  useEffect(() => {
    if (phase === "prep") prep.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rec.status === "done") {
      setPhase("review");
      setState((s) =>
        s?.kind === "graded"
          ? s
          : { kind: "recorded", durationSeconds: rec.seconds },
      );
    }
  }, [rec.status, rec.seconds]);

  async function submit() {
    if (!rec.blob || submitting) return;
    setSubmitting(true);
    setState({ kind: "grading" });
    const next = await grader.grade(rec.blob, question.id);
    setState(next);
    setSubmitting(false);
  }

  function retake() {
    if (retakes >= MAX_RETAKES) return;
    setRetakes((n) => n + 1);
    setState(null);
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
              onClick={rec.status === "recording" ? rec.stop : rec.start}
              aria-label={
                rec.status === "recording" ? "Dừng thu" : "Bắt đầu thu âm"
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
          <li>File gửi lên để cô nghe và máy chấm theo 4 tiêu chí.</li>
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
            {submitting ? "Đang gửi…" : "Nộp bài nói"}
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
