"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Check, Volume2 } from "lucide-react";

import { formatClock } from "../application/useReadingSession";
import { useListeningSession } from "../application/useListeningSession";
import {
  isChoiceQuestion,
  type ChoiceQuestion,
  type GradedQuestion,
  type ListeningTest,
  type Question,
} from "../domain/types";
import { useAnnotations } from "../application/useAnnotations";
import { useExitGuard } from "../application/useExitGuard";
import { highlightsFor } from "../domain/annotations";
import ExitWarningDialog from "./ExitWarningDialog";
import GapText, { GapInput, hasInlineGap, type GapField } from "./GapText";
import HighlightableText from "./HighlightableText";
import SelectionPopup from "./SelectionPopup";
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

/**
 * Thời gian còn lại, tính theo phút như đề nghe trên máy thật.
 *
 * Trước đây câu này viết tiếng Anh ("30 minutes remaining") trong khi nút ngay
 * cạnh là "Nộp bài" và màn hướng dẫn cũng tiếng Việt. Học sinh mất gốc — đúng
 * đối tượng của trang — là người khó đọc nhất mà lại gặp chỗ tiếng Anh duy
 * nhất ở ngay thanh trạng thái.
 */
function minutesRemaining(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return mins <= 1 ? "Còn chưa đầy một phút" : `Còn ${mins} phút`;
}

export default function ListeningPlayer({ test }: { test: ListeningTest }) {
  const session = useListeningSession(test);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /** The exam's own scroll container — not the window. */
  const examRef = useRef<HTMLDivElement>(null);
  /** Which question the student is on, so the navigator can point at it. */
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const marks = useAnnotations(test.slug);
  const selectedQuestion = marks.pending
    ? test.questions.find((q) => q.id === marks.pending!.blockId)
    : undefined;

  /**
   * Jump to a question from the navigator: scroll it into view and put the
   * caret in it, so the student can type straight away instead of hunting for
   * the box they just asked for. Gap-fill carries the id on its input; a choice
   * question carries it on the wrapper, so focus its first radio instead.
   */
  const goToQuestion = (number: number) => {
    setActiveNumber(number);
    const target = document.getElementById(`question-${number}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const field =
      target instanceof HTMLInputElement
        ? target
        : target.querySelector<HTMLInputElement>("input");
    field?.focus({ preventScroll: true });
  };
  const onExam = session.status !== "instructions";

  /**
   * Hide the rest of the page while the exam is open (see `body.exam-mode` in
   * globals.css). The exam then scrolls as an ordinary document instead of as a
   * nested container, which is what makes the wheel, the keyboard and touch all
   * behave normally.
   */
  useEffect(() => {
    if (!onExam) return;
    document.body.classList.add("exam-mode");
    return () => document.body.classList.remove("exam-mode");
  }, [onExam]);

  // A new section starts at its first question, not wherever the last one ended.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [session.activeSection]);

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

  const isStarting = session.status === "starting";
  const isReview = session.status === "finished";
  const disabled = isReview || session.status === "submitting";

  /*
    Chỉ chặn khi bài đã bắt đầu và chưa nộp. Ở màn hướng dẫn thì chưa mất gì,
    còn sau khi nộp thì đây là màn xem đáp án.

    Thoát giữa chừng bên Listening đắt hơn Reading: băng chỉ phát một lần,
    quay lại là phải nghe lại từ đầu.
  */
  const exit = useExitGuard(onExam && !isReview);
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
        active: activeNumber === q.number,
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
  }, [current, session.answers, reviewByQuestion, activeNumber]);

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
            data-exam
            ref={session.audioRef}
            src={track.src}
            preload="auto"
            onCanPlayThrough={() => session.setAudioReady(true)}
            onPlaying={session.handleAudioPlaying}
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
          <h1 className="font-serif text-3xl font-bold text-center text-[#1A1A1A] mb-8">
            Hướng dẫn làm bài kiểm tra
          </h1>

          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-3">
            Lưu ý trước khi làm bài
          </h2>
          <p className="text-sm font-bold text-[#1A1A1A] mb-2">Bài nghe sẽ chạy như thi thật:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[#1A1A1A]/75 leading-relaxed">
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
            {/* A first-timer's two commonest worries, answered before they start. */}
            <li>
              Trong lúc làm bài bạn <strong>sửa lại đáp án thoải mái</strong> và quay về câu
              trước bất cứ lúc nào — bấm số câu ở thanh dưới cùng để nhảy tới.
            </li>
            <li>
              Nộp bài xong sẽ thấy <strong>điểm, band ước lượng và đáp án đúng</strong> của
              từng câu.
            </li>
          </ul>

          {session.canResume && (
            <div className="mt-6 flex items-start gap-2 bg-[#9FE870]/20 border border-[#14532D]/25 text-[#14532D] rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                Bạn có một bài đang làm dở. Bấm <strong>Tiếp tục</strong> để làm tiếp — đáp án,
                đồng hồ và bài nghe sẽ trở lại đúng chỗ bạn dừng.
              </span>
            </div>
          )}

          {test.note && (
            <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{test.note}</span>
            </div>
          )}

          {/*
            Whether the recording is ready is the one thing a student on a poor
            connection wants to know before committing to a play-once test.
          */}
          <p
            className={`mt-6 flex items-center gap-2 text-sm ${
              session.audioReady ? "text-[#14532D]" : "text-[#1A1A1A]/50"
            }`}
          >
            <Volume2 size={15} />
            {session.audioReady
              ? "Bài nghe đã tải xong, bấm bắt đầu là nghe được ngay."
              : "Đang tải bài nghe... Bạn vẫn bấm bắt đầu được, đồng hồ chỉ chạy khi có tiếng."}
          </p>

          <div className="border-t border-black/10 mt-8 pt-6 flex items-center justify-between">
            <Link
              href="/kiem-tra-kien-thuc/listening"
              className="text-sm text-[#1A1A1A]/50 hover:text-[#14532D] transition-colors"
            >
              ← Chọn đề khác
            </Link>
            <div className="flex items-center gap-3">
              {session.canResume && (
                <button
                  type="button"
                  onClick={session.resume}
                  className="px-6 py-3 rounded-xl bg-[#14532D] text-white hover:bg-[#052E16] font-bold text-sm transition-colors cursor-pointer"
                >
                  Tiếp tục bài đang làm dở
                </button>
              )}
              <button
                type="button"
                onClick={session.start}
                // Focused on arrival so a keyboard user does not Tab through the
                // whole marketing nav to reach the only button that matters.
                autoFocus
                className="px-8 py-3 rounded-xl border-2 border-[#14532D] text-[#14532D] hover:bg-[#14532D] hover:text-white font-bold text-sm transition-colors cursor-pointer"
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
    <div ref={examRef} data-exam className="min-h-screen bg-white pb-28">

      <header className="sticky top-0 z-30 bg-white border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
          <span className="shrink-0 h-10 w-10 rounded-full bg-[#14532D] text-[#9FE870] flex items-center justify-center font-mono text-2xs font-bold tracking-tight">
            IELTS
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#1A1A1A] truncate">{test.title}</p>
            <p className="flex items-center gap-3 text-xs text-[#1A1A1A]/60">
              <span className={session.remainingSeconds <= 180 && !isReview ? "text-red-600 font-bold" : ""}>
                {isReview ? `Đã nộp · ${formatClock(session.remainingSeconds)} còn lại` : minutesRemaining(session.remainingSeconds)}
              </span>
              {!isReview && (
                <span className="flex items-center gap-1.5">
                  <Volume2 size={13} className={session.audioPlaying ? "text-[#14532D]" : "text-[#1A1A1A]/35"} />
                  {session.audioPlaying
                    ? `Đang phát${track?.label ? ` · ${track.label}` : ""}`
                    : isStarting
                      ? "Đang tải bài nghe — đồng hồ chưa chạy"
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
          <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
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
              <h2 className="font-bold text-lg text-[#1A1A1A] tracking-tight">
                SECTION {current.section}
              </h2>
              <p className="text-sm text-[#1A1A1A]/70 mt-0.5">
                Nghe và trả lời câu {current.questions[0].number}–
                {current.questions[current.questions.length - 1].number}
              </p>
            </div>

            <div className="py-6 space-y-8" onMouseUp={marks.captureSelection}>
              {groups.map((group, gi) => (
                <section key={gi}>
                  {group.heading && (
                    <p className="text-sm text-[#1A1A1A]/80 leading-relaxed mb-4 font-medium border-l-2 border-[#14532D]/25 pl-3">
                      <HighlightableText
                        blockId={`g${gi}`}
                        text={group.heading}
                        highlights={highlightsFor(marks.annotations, `g${gi}`)}
                        onRemove={marks.selectExistingHighlight}
                      />
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
                            onFocus={setActiveNumber}
                          />
                        );
                      }

                      if (block.kind === "field") {
                        const q = block.question;
                        const review = block.review;
                        return (
                          <p key={block.key} className="text-base leading-[2.4] text-[#1A1A1A]">
                            <span className="font-bold mr-2">{q.number}</span>
                            {q.prompt}
                            <GapInput
                              field={{
                                number: q.number,
                                questionId: q.id,
                                value: session.answers[q.id] ?? "",
                                maxWords: "maxWords" in q ? q.maxWords : 2,
                                review,
                                active: activeNumber === q.number,
                              }}
                              disabled={disabled}
                              onChange={(value) => session.setAnswer(q.id, value)}
                              onFocus={setActiveNumber}
                            />
                          </p>
                        );
                      }

                      const q = block.question;
                      const review = block.review;
                      return (
                        <div
                          key={block.key}
                          id={`question-${q.number}`}
                          className={`scroll-mt-32 rounded-lg transition-colors ${
                            activeNumber === q.number && !review
                              ? "bg-[#FFFBEB] ring-1 ring-[#D97706]/40 -mx-2 px-2 py-1"
                              : ""
                          }`}
                        >
                          <p className="text-base text-[#1A1A1A] mb-2 flex items-start gap-2">
                            <span className="font-bold">{q.number}</span>
                            <HighlightableText
                              blockId={q.id}
                              text={q.prompt}
                              highlights={highlightsFor(marks.annotations, q.id)}
                              onRemove={marks.selectExistingHighlight}
                              className="flex-1"
                            />
                            <BookmarkToggle
                              number={q.number}
                              bookmarked={marks.annotations.bookmarks.includes(q.number)}
                              onToggle={() => marks.toggleQuestionBookmark(q.number)}
                            />
                          </p>
                          <div className="space-y-1.5 pl-6">
                            {q.options.map((option) => {
                              const chosen = session.answers[q.id] === option;
                              const isAnswer = review && !review.isCorrect && review.expected === option;
                              return (
                                <label
                                  key={option}
                                  className={`flex items-start gap-2.5 text-base rounded px-2 py-1 ${
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
                                    onFocus={() => setActiveNumber(q.number)}
                                    disabled={disabled}
                                    className="mt-1.5 accent-[#14532D]"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                          {isAnswerShown(review) && (
                            <p className="text-xs text-[#14532D] mt-1.5 pl-6 font-medium">
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

      {/*
        One minute left. The paper submits itself at zero, so this is the last
        chance to fill in a guess — worth interrupting for.
      */}
      {!isReview && session.remainingSeconds <= 60 && session.remainingSeconds > 0 && (
        <div
          role="alert"
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 bg-red-600 text-white rounded-full px-5 py-2 text-sm font-bold shadow-lg"
        >
          <AlertTriangle size={15} />
          Còn {session.remainingSeconds} giây — hết giờ bài sẽ tự nộp
        </div>
      )}

      {/*
        Question navigator, following the exam's own design: every button and
        every section label carries a 3px track above it — grey for untouched,
        filled as the student answers, recoloured by correctness once the paper
        is marked. The number itself stays an outlined box throughout, so
        "answered" and "currently editing" remain two separate signals.
      */}
      <nav className="fixed bottom-0 inset-x-0 z-[70] bg-[#FAF9F6] border-t border-black/10">
        {/*
          Full width, not the content column: the exam pins its submit panel to
          the very edge of the screen, and the section list centres itself in
          whatever space is left over.
        */}
        <div className="w-full pl-3 md:pl-6 flex items-stretch gap-3">
          {/*
            Only the section list scrolls. Keeping the actions outside it is what
            stops the submit button from being pushed off a phone screen behind
            ten question buttons — a student could not submit without knowing to
            swipe the bar sideways first.
          */}
          <div className="flex-1 min-w-0 flex items-center justify-center gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2">
            {session.sectionProgress.map((progress, index) => {
              const isCurrent = index === session.activeSection;
              const percent = progress.total
                ? Math.round((progress.answered / progress.total) * 100)
                : 0;

              return (
                <div key={progress.section} className="shrink-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => session.goToSection(index)}
                    className="relative flex items-center gap-2 pt-2 cursor-pointer group whitespace-nowrap"
                  >
                    <span className="absolute top-0 left-0 right-0 h-[3px] rounded bg-[#D7D7D7]" />
                    <span
                      className="absolute top-0 left-0 h-[3px] rounded bg-[#14532D] transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isCurrent ? "text-[#1A1A1A]" : "text-[#1A1A1A]/55 group-hover:text-[#14532D]"
                      }`}
                    >
                      SECTION {progress.section}
                    </span>
                    {/* The tally gives way to the numbers once the section is open. */}
                    {!isCurrent && (
                      <span className="text-xs text-[#1A1A1A]/45">
                        {progress.answered} of {progress.total}
                      </span>
                    )}
                  </button>

                  {isCurrent && (
                    <div className="flex gap-1">
                      {session.sections[index].questions.map((q) => {
                        const done = (session.answers[q.id] ?? "").trim().length > 0;
                        const review = reviewByQuestion?.get(q.id);
                        const trackFill = review
                          ? review.isCorrect
                            ? "bg-[#14532D]"
                            : done
                              ? "bg-[#DC2626]"
                              : "bg-[#9CA3AF]"
                          : "bg-[#14532D]";
                        const filled = review ? true : done;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => goToQuestion(q.number)}
                            className="relative pt-2 cursor-pointer"
                            aria-label={`Tới câu ${q.number}`}
                          >
                            <span className="absolute top-0 left-0 right-0 h-[3px] rounded bg-[#D7D7D7]" />
                            <span
                              className={`absolute top-0 left-0 h-[3px] rounded transition-all duration-300 ${trackFill}`}
                              style={{ width: filled ? "100%" : "0%" }}
                            />
                            {marks.annotations.bookmarks.includes(q.number) && (
                              <Bookmark
                                size={11}
                                aria-hidden
                                className="absolute -top-0.5 -right-1 z-10 text-[#FFC107] fill-[#FFC107] rotate-[25deg]"
                              />
                            )}
                            <span
                              data-exam-key
                              className={`flex h-[30px] min-w-[30px] px-1 items-center justify-center rounded border text-sm bg-white transition-colors ${
                                activeNumber === q.number
                                  ? "border-[#D97706] border-2 text-[#1A1A1A]"
                                  : "border-[#D8DCE3] text-[#333] hover:border-[#14532D]"
                              }`}
                            >
                              {q.number}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="shrink-0 flex items-center gap-2 py-2">
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
          </div>

          {/* Submit sits in its own panel at the far edge, as in the exam. */}
          {!isReview && (
            <button
              type="button"
              onClick={confirmSubmit}
              disabled={session.status === "submitting"}
              title="Nộp bài"
              aria-label="Nộp bài"
              className="shrink-0 px-5 md:px-8 bg-[#EFEFEF] hover:bg-[#14532D] hover:text-white text-[#1A1A1A] flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait cursor-pointer transition-colors"
            >
              <Check size={26} strokeWidth={2.5} />
              <span className="hidden md:inline font-bold text-xs">
                {session.status === "submitting" ? "Đang chấm..." : "Nộp bài"}
              </span>
            </button>
          )}
        </div>
      </nav>

      <SelectionPopup
        selection={marks.pending}
        onHighlight={marks.highlightSelection}
        onRemove={marks.removeHighlight}
        onRemoveAll={marks.removeAll}
        onBookmark={
          selectedQuestion
            ? () => {
                marks.toggleQuestionBookmark(selectedQuestion.number);
                marks.clearSelection();
              }
            : undefined
        }
        bookmarked={
          selectedQuestion ? marks.annotations.bookmarks.includes(selectedQuestion.number) : false
        }
      />

      <ExitWarningDialog
        open={exit.pending !== null}
        onStay={exit.stay}
        onLeave={exit.leave}
        detail="Băng đang chạy và chỉ phát một lần. Thoát bây giờ thì bài không được chấm, và muốn làm lại phải nghe lại từ đầu."
      />
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

/**
 * The flag a student sets on a question to come back to. Hidden until hovered
 * unless it is set, so an unmarked paper stays clean.
 */
function BookmarkToggle({
  number,
  bookmarked,
  onToggle,
}: {
  number: number;
  bookmarked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? `Bỏ đánh dấu câu ${number}` : `Đánh dấu câu ${number}`}
      title={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu để quay lại sau"}
      className={`shrink-0 cursor-pointer transition-opacity ${
        bookmarked ? "opacity-100" : "opacity-0 hover:opacity-100 focus:opacity-100"
      }`}
    >
      <Bookmark
        size={14}
        className={bookmarked ? "text-[#FFC107] fill-[#FFC107]" : "text-[#1A1A1A]/50"}
      />
    </button>
  );
}

/** Only worth printing the expected answer when the student got it wrong. */
function isAnswerShown(review?: GradedQuestion): boolean {
  return Boolean(review && !review.isCorrect);
}
