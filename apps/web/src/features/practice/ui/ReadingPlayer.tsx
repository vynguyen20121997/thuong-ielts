"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, ListChecks, Timer } from "lucide-react";

import { formatClock, useReadingSession } from "../application/useReadingSession";
import { LEVEL_LABELS } from "../domain/catalog";
import { questionRangeOf } from "../domain/paper";
import { countAnswered } from "../domain/scoring";
import type { ReadingPaper } from "../domain/types";
import { useAnnotations } from "../application/useAnnotations";
import { highlightsFor } from "../domain/annotations";
import HighlightableText from "./HighlightableText";
import PaperQuestion from "./PaperQuestion";
import SelectionPopup from "./SelectionPopup";
import ReadingResultPanel from "./ReadingResultPanel";

/**
 * The exam screen. It owns layout and nothing else: every piece of behaviour —
 * answers, clock, submission, grading result — comes from `useReadingSession`.
 * Swapping this for a different layout (mobile, print, embedded) requires no
 * change to the rules.
 *
 * Một passage lẻ và cả test ba passage dùng chung màn này: chỉ khác số phần
 * trong `paper.sections`. Đồng hồ, phiếu trả lời và lần chấm là một, đúng như
 * phòng thi thật — chuyển passage không phải là bắt đầu bài mới.
 */
export default function ReadingPlayer({ paper }: { paper: ReadingPaper }) {
  const session = useReadingSession(paper);
  // Mobile only: the two panes do not fit side by side under `md`.
  const [mobilePane, setMobilePane] = useState<"passage" | "questions">("passage");
  /** Which question the student is typing in, so it can be highlighted. */
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  /** Passage đang mở. Chỉ có ý nghĩa khi thi cả test. */
  const [sectionIndex, setSectionIndex] = useState(0);

  const section = paper.sections[sectionIndex] ?? paper.sections[0];
  const multi = paper.sections.length > 1;

  // Tô màu và ghi chú lưu theo từng passage, nên khoá là slug của passage đang
  // mở — chuyển tab là đổi luôn tập chú thích.
  const marks = useAnnotations(section.slug);

  /** The question a selection belongs to, so the popup can offer a bookmark. */
  const selectedQuestion = marks.pending
    ? section.questions.find((q) => q.id === marks.pending!.blockId)
    : undefined;

  const reviewByQuestion = useMemo(() => {
    if (!session.result) return null;
    return new Map(session.result.items.map((item) => [item.questionId, item]));
  }, [session.result]);

  // Cambridge papers keep their original numbering when a full test is split by
  // passage (14-26, 27-40), so the heading follows the data, not a 1-based count.
  const questionRange = questionRangeOf(section.questions);

  const isReview = session.status === "finished";
  const lowTime = session.remainingSeconds <= 120 && !isReview;
  const progress = session.totalQuestions
    ? Math.round((session.answeredCount / session.totalQuestions) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
      {/* Sticky exam bar */}
      <div className="sticky top-16 md:top-20 z-30 -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12 py-3 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            href="/kiem-tra-kien-thuc/reading"
            className="shrink-0 h-9 w-9 rounded-full border border-black/10 bg-white flex items-center justify-center text-[#1A1A1A]/60 hover:text-[#14532D] hover:border-[#14532D]/40 transition-colors"
            aria-label="Quay lại danh sách đề"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="min-w-0 hidden sm:block">
            <span className="text-2xs text-[#14532D] font-medium block">
              {paper.collection} · {LEVEL_LABELS[paper.level]}
              {multi && ` · ${paper.sections.length} passage`}
            </span>
            <h1 className="font-serif text-sm md:text-base font-bold text-[#1A1A1A] truncate">
              {paper.title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-2xs text-[#1A1A1A]/45 font-medium">
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
              className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-full tabular-nums ${isReview ? "bg-black/[0.05] text-[#1A1A1A]/50" : lowTime ? "bg-red-50 text-red-600 border border-red-200" : "bg-white border border-black/10 text-[#14532D]"}`}
            >
              <Timer size={14} />
              {formatClock(session.remainingSeconds)}
            </span>

            {!isReview && (
              <button
                type="button"
                onClick={session.submit}
                disabled={session.status === "submitting"}
                className="px-4 md:px-6 py-2.5 bg-[#14532D] hover:bg-[#052E16] disabled:opacity-60 disabled:cursor-wait text-white font-bold text-2xs rounded-full transition-colors cursor-pointer tracking-wider uppercase whitespace-nowrap"
              >
                {session.status === "submitting" ? "Đang chấm..." : "Nộp bài"}
              </button>
            )}
          </div>
        </div>

        {/*
          Chuyển passage khi thi cả test. Không phải điều hướng: đồng hồ vẫn
          chạy, câu đã điền vẫn giữ — nên đây là nút, không phải link.
        */}
        {multi && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar -mx-1 px-1">
            {paper.sections.map((item, index) => {
              const done = countAnswered(item.questions, session.answers);
              const active = index === sectionIndex;

              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSectionIndex(index)}
                  aria-current={active ? "true" : undefined}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border text-2xs font-medium transition-colors cursor-pointer ${active ? "bg-[#14532D] text-white border-[#14532D]" : "bg-white text-[#1A1A1A]/55 border-black/10 hover:border-[#14532D]/40 hover:text-[#14532D]"}`}
                >
                  Passage {index + 1}
                  <span
                    className={`tabular-nums ${
                      active
                        ? "text-white/70"
                        : done === item.questions.length
                          ? "text-[#14532D]"
                          : "text-[#1A1A1A]/35"
                    }`}
                  >
                    {done}/{item.questions.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile pane switch */}
        <div className="flex md:hidden gap-2 mt-3">
          {(["passage", "questions"] as const).map((pane) => (
            <button
              key={pane}
              type="button"
              onClick={() => setMobilePane(pane)}
              className={`flex-1 py-2 rounded-full text-2xs font-medium border transition-colors ${mobilePane === pane ? "bg-[#14532D] text-white border-[#14532D]" : "bg-white text-[#1A1A1A]/55 border-black/10"}`}
            >
              {pane === "passage" ? "Bài đọc" : `Câu hỏi (${section.questions.length})`}
            </button>
          ))}
        </div>
      </div>

      {session.error && (
        <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{session.error}</span>
        </div>
      )}

      {/*
        One listener for the whole paper: a selection is only meaningful once
        the mouse comes back up, and the handler works out for itself which
        block it landed in.
      */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-10 py-8" onMouseUp={marks.captureSelection}>
        {/* Passage */}
        <div className={`${mobilePane === "passage" ? "block" : "hidden"} md:block`}>
          <div
            data-lenis-prevent
            className="md:sticky md:top-40 bg-white border border-black/5 rounded-2xl p-6 md:p-8 shadow-sm md:max-h-[calc(100vh-12rem)] md:overflow-y-auto"
          >
            <span className="text-2xs text-[#14532D] font-medium flex items-center gap-1.5 mb-3">
              <BookOpen size={12} />
              {multi ? `Reading Passage ${sectionIndex + 1}` : "Reading Passage"}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
              {section.passage.title}
            </h2>
            {section.passage.intro && (
              <p className="font-sans italic text-sm text-[#1A1A1A]/55 mt-3 border-l-2 border-[#9FE870] pl-3">
                {section.passage.intro}
              </p>
            )}

            <div className="mt-6 space-y-5">
              {section.passage.paragraphs.map((paragraph, index) => (
                // Bài đọc để ở serif: Literata vẽ để đọc dài, và đề Cambridge
                // trên giấy cũng là serif. Câu hỏi bên cạnh vẫn sans, nên hai
                // cột phân biệt được bằng chữ chứ không cần thêm đường kẻ.
                <p key={index} className="font-serif text-base leading-[1.8] text-[#1A1A1A]/85">
                  {paragraph.label && (
                    <span className="font-serif font-bold text-[#14532D] mr-2">
                      {paragraph.label}
                    </span>
                  )}
                  <HighlightableText
                    blockId={`p${index}`}
                    text={paragraph.text}
                    highlights={highlightsFor(marks.annotations, `p${index}`)}
                    onRemove={marks.selectExistingHighlight}
                  />
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className={`${mobilePane === "questions" ? "block" : "hidden"} md:block`}>
          {isReview && session.result && (
            <div className="mb-6">
              <ReadingResultPanel
                result={session.result}
                timedOut={session.timedOut}
                onRestart={session.restart}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-4">
            <ListChecks size={13} className="text-[#14532D]" />
            <span className="text-2xs text-[#14532D] font-medium">
              {isReview ? `Đáp án & giải thích · câu ${questionRange}` : `Câu hỏi ${questionRange}`}
            </span>
          </div>

          {/*
            One continuous paper rather than a stack of cards: the instructions
            head their block exactly as printed, and each answer is written into
            the line it belongs to.
          */}
          <div className="bg-white border border-black/5 rounded-2xl p-6 md:p-8 shadow-sm space-y-1">
            {section.questions.map((question) => (
              <div key={question.id}>
                {question.group && (
                  <p className="text-sm leading-relaxed text-[#1A1A1A]/80 font-medium border-l-2 border-[#14532D]/25 pl-3 mt-7 first:mt-0 mb-4 whitespace-pre-line">
                    {question.group}
                  </p>
                )}
                <PaperQuestion
                  highlights={highlightsFor(marks.annotations, question.id)}
                  onRemoveHighlight={marks.removeHighlight}
                  bookmarked={marks.annotations.bookmarks.includes(question.number)}
                  onToggleBookmark={() => marks.toggleQuestionBookmark(question.number)}
                  question={question}
                  value={session.answers[question.id] ?? ""}
                  onChange={(value) => session.setAnswer(question.id, value)}
                  review={reviewByQuestion?.get(question.id)}
                  disabled={isReview || session.status === "submitting"}
                  active={activeNumber === question.number}
                  onFocus={setActiveNumber}
                />
              </div>
            ))}
          </div>

          {/*
            Còn passage phía sau thì nút dưới cùng đưa sang passage kế, không
            nộp bài — nộp sớm là mất luôn hai passage chưa làm. Nút "Nộp bài"
            trên thanh trên cùng vẫn ở đó cho ai muốn nộp sớm thật.
          */}
          {!isReview &&
            (multi && sectionIndex < paper.sections.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setSectionIndex(sectionIndex + 1);
                  setMobilePane("passage");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full mt-8 py-4 bg-[#14532D] hover:bg-[#052E16] text-white font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase"
              >
                Sang passage {sectionIndex + 2} ({session.answeredCount}/{session.totalQuestions}{" "}
                câu đã làm)
              </button>
            ) : (
              <button
                type="button"
                onClick={session.submit}
                disabled={session.status === "submitting"}
                className="w-full mt-8 py-4 bg-[#9FE870] hover:bg-[#86D65A] disabled:opacity-60 disabled:cursor-wait text-[#14532D] font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase"
              >
                {session.status === "submitting"
                  ? "Đang chấm bài..."
                  : `Nộp bài (${session.answeredCount}/${session.totalQuestions} câu)`}
              </button>
            ))}
        </div>
      </div>

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
    </div>
  );
}
