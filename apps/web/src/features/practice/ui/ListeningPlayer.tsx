"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Headphones, ListChecks, Timer } from "lucide-react";

import { formatClock } from "../application/useReadingSession";
import { useListeningSession } from "../application/useListeningSession";
import { LEVEL_LABELS } from "../domain/catalog";
import type { ListeningTest } from "../domain/types";
import QuestionField from "./QuestionField";
import ReadingResultPanel from "./ReadingResultPanel";

/**
 * The listening exam screen. Layout only — answers, clock, grading and section
 * grouping all come from `useListeningSession`.
 *
 * The recording sits in a sticky bar rather than beside the questions: a
 * listening paper has no passage to read against, so the audio is the thing
 * that must stay reachable while the student scrolls.
 */
export default function ListeningPlayer({ test }: { test: ListeningTest }) {
  const session = useListeningSession(test);

  const reviewByQuestion = useMemo(() => {
    if (!session.result) return null;
    return new Map(session.result.items.map((item) => [item.questionId, item]));
  }, [session.result]);

  const isReview = session.status === "finished";
  const lowTime = session.remainingSeconds <= 180 && !isReview;
  const progress = session.totalQuestions
    ? Math.round((session.answeredCount / session.totalQuestions) * 100)
    : 0;
  const track = test.audio[session.activeTrack];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8">
      {/* Sticky exam bar + player */}
      <div className="sticky top-16 md:top-20 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href="/kiem-tra-kien-thuc/listening"
            className="shrink-0 h-9 w-9 rounded-full border border-black/10 bg-white flex items-center justify-center text-[#1A1A1A]/60 hover:text-[#14532D] hover:border-[#14532D]/40 transition-colors"
            aria-label="Quay lại danh sách đề"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="min-w-0 hidden sm:block">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#14532D] font-bold block">
              {test.collection} · {LEVEL_LABELS[test.level]}
            </span>
            <h1 className="font-serif text-sm md:text-base font-black text-[#1A1A1A] truncate">
              {test.title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/45 font-bold">
                Đã làm {session.answeredCount}/{session.totalQuestions}
              </span>
              <div className="h-1 w-28 bg-black/[0.08] rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-[#14532D] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <span
              className={`flex items-center gap-1.5 font-mono text-sm font-black px-3 py-1.5 rounded-full tabular-nums ${
                isReview
                  ? "bg-black/[0.05] text-[#1A1A1A]/50"
                  : lowTime
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-white border border-black/10 text-[#14532D]"
              }`}
            >
              <Timer size={14} />
              {formatClock(session.remainingSeconds)}
            </span>

            {!isReview && (
              <button
                type="button"
                onClick={session.submit}
                disabled={session.status === "submitting"}
                className="px-4 md:px-6 py-2.5 bg-[#14532D] hover:bg-[#052E16] disabled:opacity-60 disabled:cursor-wait text-white font-bold text-[11px] rounded-full transition-colors cursor-pointer tracking-wider uppercase whitespace-nowrap"
              >
                {session.status === "submitting" ? "Đang chấm..." : "Nộp bài"}
              </button>
            )}
          </div>
        </div>

        {/* Recording */}
        <div className="mt-3 bg-white border border-black/10 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Headphones size={13} className="text-[#14532D]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#14532D] font-bold">
              Bài nghe
            </span>
            {test.audio.length > 1 && (
              <div className="flex gap-1.5 ml-auto overflow-x-auto no-scrollbar">
                {test.audio.map((t, i) => (
                  <button
                    key={t.src}
                    type="button"
                    onClick={() => session.setActiveTrack(i)}
                    className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                      i === session.activeTrack
                        ? "bg-[#14532D] text-white border-[#14532D]"
                        : "bg-white text-[#1A1A1A]/55 border-black/10 hover:border-[#14532D]/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {track ? (
            <audio
              key={track.src}
              src={track.src}
              controls
              preload="metadata"
              className="w-full h-10"
            />
          ) : (
            <p className="text-[13px] text-[#1A1A1A]/50">Đề này chưa có file nghe.</p>
          )}
        </div>
      </div>

      {/* Incomplete-recording caveat, shown before the student commits time to the test. */}
      {test.note && (
        <div className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-[13px]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{test.note}</span>
        </div>
      )}

      {session.error && (
        <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{session.error}</span>
        </div>
      )}

      <div className="py-8">
        {isReview && session.result && (
          <div className="mb-8">
            <ReadingResultPanel
              result={session.result}
              timedOut={session.timedOut}
              onRestart={session.restart}
              catalogHref="/kiem-tra-kien-thuc/listening"
            />
          </div>
        )}

        {session.sections.map(({ section, questions }) => (
          <section key={section} className="mb-10">
            <div className="flex items-center gap-1.5 mb-4">
              <ListChecks size={13} className="text-[#14532D]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#14532D] font-bold">
                Section {section} · câu {questions[0].number}-{questions[questions.length - 1].number}
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className={question.group ? "pt-4" : undefined}>
                  {question.group && (
                    <p className="font-mono text-[10px] leading-relaxed uppercase tracking-wider text-[#1A1A1A]/45 font-bold mb-3">
                      {question.group}
                    </p>
                  )}
                  <QuestionField
                    question={question}
                    value={session.answers[question.id] ?? ""}
                    onChange={(value) => session.setAnswer(question.id, value)}
                    review={reviewByQuestion?.get(question.id)}
                    disabled={isReview || session.status === "submitting"}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {!isReview && (
          <button
            type="button"
            onClick={session.submit}
            disabled={session.status === "submitting"}
            className="w-full py-4 bg-[#9FE870] hover:bg-[#86D65A] disabled:opacity-60 disabled:cursor-wait text-[#14532D] font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase"
          >
            {session.status === "submitting"
              ? "Đang chấm bài..."
              : `Nộp bài (${session.answeredCount}/${session.totalQuestions} câu)`}
          </button>
        )}
      </div>
    </div>
  );
}
