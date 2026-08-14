"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";

import { formatClock } from "../application/useReadingSession";
import { useListeningSession } from "../application/useListeningSession";
import {
  isChoiceQuestion,
  type ChoiceQuestion,
  type GradedQuestion,
  type ListeningTest,
  type Question,
} from "../domain/types";
import GapText, { GapInput, hasInlineGap, type GapField } from "./GapText";
import ReadingResultPanel from "./ReadingResultPanel";

/**
 * The listening exam screen, laid out like the computer-delivered IELTS test:
 * a thin status strip on top, one section on screen at a time, blanks sitting
 * inside the sentence, and a question navigator pinned to the bottom.
 *
 * The audio has no transport controls at all. That is the whole point of the
 * format — the recording plays once, straight through — so the element is
 * rendered hidden and driven entirely by the session.
 */

/** One rendered unit: either a sentence carrying blanks, or a choice question. */
type Block =
  | { kind: "gaps"; key: string; text: string; fields: GapField[] }
  | { kind: "choice"; key: string; question: ChoiceQuestion; review?: GradedQuestion }
  | { kind: "field"; key: string; question: Question; review?: GradedQuestion };

function minutesRemaining(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return mins <= 1 ? "less than a minute remaining" : `${mins} minutes remaining`;
}

export default function ListeningPlayer({ test }: { test: ListeningTest }) {
  const session = useListeningSession(test);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const reviewByQuestion = useMemo(() => {
    if (!session.result) return null;
    return new Map(session.result.items.map((item) => [item.questionId, item]));
  }, [session.result]);

  /**
   * Submitting ends the attempt and the recording with it, so a half-finished
   * paper scores as it stands. Confirm only when something is missing — a
   * student who filled everything in should not be nagged.
   */
  const confirmSubmit = () => {
    const missing = session.unansweredCount;
    if (missing > 0) {
      const ok = window.confirm(
        `Bạn còn ${missing} câu chưa trả lời. Nộp bài bây giờ sẽ kết thúc bài nghe và không làm tiếp được. Vẫn nộp?`
      );
      if (!ok) return;
    }
    session.submit();
  };

  const isReview = session.status === "finished";
  const disabled = isReview || session.status === "submitting";
  const track = test.audio[session.activeTrack];
  const current = session.sections[session.activeSection];

  /**
   * Groups the section's questions into what the page actually draws. Blanks
   * that share a sentence are merged so the sentence appears once with two
   * boxes in it, exactly as the paper shows it.
   */
  const groups = useMemo(() => {
    if (!current) return [];
    const out: { heading?: string; blocks: Block[] }[] = [];
    let heading: string | undefined;

    for (const q of current.questions) {
      if (q.group && q.group !== heading) {
        heading = q.group;
        out.push({ heading, blocks: [] });
      }
      if (out.length === 0) out.push({ heading: undefined, blocks: [] });

      const bucket = out[out.length - 1].blocks;
      const review = reviewByQuestion?.get(q.id);

      if (isChoiceQuestion(q)) {
        bucket.push({ kind: "choice", key: q.id, question: q, review });
        continue;
      }

      const field: GapField = {
        number: q.number,
        questionId: q.id,
        value: session.answers[q.id] ?? "",
        maxWords: "maxWords" in q ? q.maxWords : 2,
        review,
      };

      if (!hasInlineGap(q.prompt, q.number)) {
        bucket.push({ kind: "field", key: q.id, question: q, review });
        continue;
      }

      const last = bucket[bucket.length - 1];
      if (last?.kind === "gaps" && last.text === q.prompt) {
        last.fields.push(field);
      } else {
        bucket.push({ kind: "gaps", key: q.id, text: q.prompt, fields: [field] });
      }
    }

    return out;
  }, [current, session.answers, reviewByQuestion]);

  /**
   * One <audio> for the whole session, portalled so it keeps the same place in
   * the tree on both screens. Two things depend on that:
   *
   * - `start()` runs inside the button's click handler, so the element must
   *   already exist or the ref is null and nothing plays.
   * - Switching from instructions to exam replaces the surrounding tree. If the
   *   audio lived inside either branch React would unmount it and playback
   *   would stop the instant the exam appeared.
   *
   * `key` is deliberately absent: changing it on every track would recreate the
   * element and drop the ref mid-test.
   */
  const audioElement =
    mounted && track
      ? createPortal(
          <audio
            ref={session.audioRef}
            src={track.src}
            preload="auto"
            onPlay={() => session.setAudioPlaying(true)}
            onPause={() => session.setAudioPlaying(false)}
            onEnded={session.handleTrackEnded}
            className="hidden"
          />,
          document.body
        )
      : null;

  // ── Instructions ────────────────────────────────────────────────────────
  if (session.status === "instructions") {
    return (
      <>
        {audioElement}
        <div className="min-h-[70vh] bg-[#F5F5F3] flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-black/5 p-8 md:p-12">
          <h1 className="font-serif text-3xl font-black text-center text-[#1A1A1A] mb-8">
            Hướng dẫn làm bài kiểm tra
          </h1>

          <h2 className="font-serif text-lg font-black text-[#1A1A1A] mb-3 uppercase">
            Lưu ý trước khi làm bài
          </h2>
          <p className="text-[14px] font-bold text-[#1A1A1A] mb-2">Bài nghe sẽ chạy như thi thật:</p>
          <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#1A1A1A]/75 leading-relaxed">
            <li>
              Audio <strong>tự phát một lần duy nhất</strong> và không tạm dừng, tua hay nghe lại
              được. Hãy chuẩn bị tai nghe trước khi bấm bắt đầu.
            </li>
            <li>
              Bài gồm <strong>{session.sections.length} phần</strong>, tổng{" "}
              <strong>{session.totalQuestions} câu</strong>, làm trong{" "}
              <strong>{Math.round(test.durationSeconds / 60)} phút</strong>.
            </li>
            <li>Hết giờ hệ thống tự nộp bài, nên hãy điền hết những gì nghe được.</li>
          </ul>

          {session.canResume && (
            <div className="mt-6 flex items-start gap-2 bg-[#9FE870]/20 border border-[#14532D]/25 text-[#14532D] rounded-xl px-4 py-3 text-[13px]">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                Bạn có một bài đang làm dở. Bấm <strong>Tiếp tục</strong> để làm tiếp — đáp án,
                đồng hồ và bài nghe sẽ trở lại đúng chỗ bạn dừng.
              </span>
            </div>
          )}

          {test.note && (
            <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-[13px]">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{test.note}</span>
            </div>
          )}

          <div className="border-t border-black/10 mt-8 pt-6 flex items-center justify-between">
            <Link
              href="/kiem-tra-kien-thuc/listening"
              className="text-[13px] text-[#1A1A1A]/50 hover:text-[#14532D] transition-colors"
            >
              ← Chọn đề khác
            </Link>
            <div className="flex items-center gap-3">
              {session.canResume && (
                <button
                  type="button"
                  onClick={session.resume}
                  className="px-6 py-3 rounded-xl bg-[#14532D] text-white hover:bg-[#052E16] font-bold text-[14px] transition-colors cursor-pointer"
                >
                  Tiếp tục bài đang làm dở
                </button>
              )}
              <button
                type="button"
                onClick={session.start}
                className="px-8 py-3 rounded-xl border-2 border-[#14532D] text-[#14532D] hover:bg-[#14532D] hover:text-white font-bold text-[14px] transition-colors cursor-pointer"
              >
                {session.canResume ? "Làm lại từ đầu" : "Bắt đầu"}
              </button>
            </div>
          </div>
          </div>
        </div>
      </>
    );
  }

  // ── Exam ────────────────────────────────────────────────────────────────
  const exam = (
    // Full-screen: the marketing nav has no place in an exam, and the sample
    // site hides it too. Fixed rather than a new route so the URL is unchanged.
    // z-[60] because the site header is z-50 and would otherwise paint on top.
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto pb-28">

      <header className="sticky top-0 z-30 bg-white border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
          <span className="shrink-0 h-10 w-10 rounded-full bg-[#14532D] text-[#9FE870] flex items-center justify-center font-mono text-[9px] font-black tracking-tight">
            IELTS
          </span>
          <div className="min-w-0">
            <p className="font-bold text-[14px] text-[#1A1A1A] truncate">{test.title}</p>
            <p className="flex items-center gap-3 text-[12px] text-[#1A1A1A]/60">
              <span className={session.remainingSeconds <= 180 && !isReview ? "text-red-600 font-bold" : ""}>
                {isReview ? `Đã nộp · ${formatClock(session.remainingSeconds)} còn lại` : minutesRemaining(session.remainingSeconds)}
              </span>
              {!isReview && (
                <span className="flex items-center gap-1.5">
                  <Volume2 size={13} className={session.audioPlaying ? "text-[#14532D]" : "text-[#1A1A1A]/35"} />
                  {session.audioPlaying
                    ? `Audio is playing${track?.label ? ` · ${track.label}` : ""}`
                    : "Audio chưa phát"}
                </span>
              )}
            </p>
          </div>
          <Link
            href="/kiem-tra-kien-thuc/listening"
            className="ml-auto shrink-0 h-9 w-9 rounded-full border border-black/10 flex items-center justify-center text-[#1A1A1A]/50 hover:text-[#14532D] transition-colors"
            aria-label="Thoát về danh sách đề"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {session.error && (
          <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{session.error}</span>
          </div>
        )}

        {isReview && session.result && (
          <div className="my-6">
            <ReadingResultPanel
              result={session.result}
              timedOut={session.timedOut}
              onRestart={session.restart}
              catalogHref="/kiem-tra-kien-thuc/listening"
            />
          </div>
        )}

        {current && (
          <>
            <div className="mt-5 bg-[#EFEFEA] rounded px-5 py-4">
              <h2 className="font-black text-[17px] text-[#1A1A1A] tracking-tight">
                SECTION {current.section}
              </h2>
              <p className="text-[14px] text-[#1A1A1A]/70 mt-0.5">
                Nghe và trả lời câu {current.questions[0].number}–
                {current.questions[current.questions.length - 1].number}
              </p>
            </div>

            <div className="py-6 space-y-8">
              {groups.map((group, gi) => (
                <section key={gi}>
                  {group.heading && (
                    <p className="text-[14px] text-[#1A1A1A]/80 leading-relaxed mb-4 font-medium border-l-2 border-[#14532D]/25 pl-3">
                      {group.heading}
                    </p>
                  )}

                  <div className="space-y-4">
                    {group.blocks.map((block) => {
                      if (block.kind === "gaps") {
                        return (
                          <GapText
                            key={block.key}
                            text={block.text}
                            fields={block.fields}
                            disabled={disabled}
                            onChange={session.setAnswer}
                          />
                        );
                      }

                      if (block.kind === "field") {
                        const q = block.question;
                        const review = block.review;
                        return (
                          <p key={block.key} className="text-[15px] leading-[2.4] text-[#1A1A1A]">
                            <span className="font-bold mr-2">{q.number}</span>
                            {q.prompt}
                            <GapInput
                              field={{
                                number: q.number,
                                questionId: q.id,
                                value: session.answers[q.id] ?? "",
                                maxWords: "maxWords" in q ? q.maxWords : 2,
                                review,
                              }}
                              disabled={disabled}
                              onChange={(value) => session.setAnswer(q.id, value)}
                            />
                          </p>
                        );
                      }

                      const q = block.question;
                      const review = block.review;
                      return (
                        <div key={block.key} id={`question-${q.number}`} className="scroll-mt-32">
                          <p className="text-[15px] text-[#1A1A1A] mb-2">
                            <span className="font-bold mr-2">{q.number}</span>
                            {q.prompt}
                          </p>
                          <div className="space-y-1.5 pl-6">
                            {q.options.map((option) => {
                              const chosen = session.answers[q.id] === option;
                              const isAnswer = review && !review.isCorrect && review.expected === option;
                              return (
                                <label
                                  key={option}
                                  className={`flex items-start gap-2.5 text-[15px] rounded px-2 py-1 ${
                                    disabled ? "cursor-default" : "cursor-pointer hover:bg-[#FAF9F6]"
                                  } ${
                                    review && chosen
                                      ? review.isCorrect
                                        ? "bg-[#9FE870]/25"
                                        : "bg-red-50 text-red-700"
                                      : isAnswer
                                        ? "bg-[#9FE870]/20"
                                        : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    checked={chosen}
                                    onChange={() => session.setAnswer(q.id, option)}
                                    disabled={disabled}
                                    className="mt-1.5 accent-[#14532D]"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                          {isAnswerShown(review) && (
                            <p className="text-[12px] text-[#14532D] mt-1.5 pl-6 font-medium">
                              Đáp án: {review!.expected}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Question navigator */}
      <nav className="fixed bottom-0 inset-x-0 z-[70] bg-[#FAF9F6] border-t border-black/10">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-2 flex items-center gap-3">
          {/*
            Only the section list scrolls. Keeping the actions outside it is what
            stops "Nộp bài" from being pushed off a phone screen behind ten
            question buttons — a student could not submit without knowing to
            swipe the bar sideways first.
          */}
          <div className="flex-1 min-w-0 flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar">
          {session.sectionProgress.map((progress, index) => {
            const isCurrent = index === session.activeSection;
            if (!isCurrent) {
              return (
                <button
                  key={progress.section}
                  type="button"
                  onClick={() => session.goToSection(index)}
                  className="shrink-0 flex items-center gap-2 text-[12px] font-bold text-[#1A1A1A]/55 hover:text-[#14532D] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>SECTION {progress.section}</span>
                  <span className="font-normal text-[#1A1A1A]/45">
                    {progress.answered} of {progress.total}
                  </span>
                </button>
              );
            }

            return (
              <div key={progress.section} className="shrink-0 flex items-center gap-2">
                <span className="text-[12px] font-black text-[#1A1A1A] whitespace-nowrap">
                  SECTION {progress.section}
                </span>
                <div className="flex gap-1">
                  {session.sections[index].questions.map((q) => {
                    const done = (session.answers[q.id] ?? "").trim().length > 0;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          document
                            .getElementById(`question-${q.number}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className={`h-7 min-w-7 px-1 rounded border font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                          done
                            ? "bg-[#14532D] text-white border-[#14532D]"
                            : "bg-white text-[#1A1A1A]/60 border-black/20 hover:border-[#14532D]"
                        }`}
                      >
                        {q.number}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => session.goToSection(session.activeSection - 1)}
              disabled={session.activeSection === 0}
              className="hidden sm:flex h-9 w-9 rounded bg-[#1A1A1A]/10 text-[#1A1A1A]/70 items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Phần trước"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => session.goToSection(session.activeSection + 1)}
              disabled={session.activeSection >= session.sections.length - 1}
              className="hidden sm:flex h-9 w-9 rounded bg-[#1A1A1A] text-white items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Phần sau"
            >
              <ArrowRight size={16} />
            </button>
            {!isReview && (
              <button
                type="button"
                onClick={confirmSubmit}
                disabled={session.status === "submitting"}
                title="Nộp bài"
                className="h-9 px-4 rounded bg-[#14532D] hover:bg-[#052E16] text-white flex items-center gap-2 font-bold text-[12px] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
              >
                <Check size={16} />
                {session.status === "submitting" ? "Đang chấm..." : "Nộp bài"}
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );

  /**
   * Rendered into <body> rather than in place. The page sits inside the
   * marketing layout, whose header creates its own stacking context — a child
   * cannot paint above it no matter how high its z-index goes. A portal leaves
   * that context entirely, which is the only reliable fix.
   */
  return (
    <>
      {audioElement}
      {mounted ? createPortal(exam, document.body) : null}
    </>
  );
}

/** Only worth printing the expected answer when the student got it wrong. */
function isAnswerShown(review?: GradedQuestion): boolean {
  return Boolean(review && !review.isCorrect);
}
