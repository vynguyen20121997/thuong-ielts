"use client";

import { ArrowLeft, ArrowRight, Bookmark, Check } from "lucide-react";

export type ExamNavigatorQuestion = {
  id: string;
  number: string | number;
  answered: boolean;
  bookmarked?: boolean;
  active?: boolean;
  stateClassName?: string;
};

export type ExamNavigatorSection = {
  id: string;
  label: string;
  answered: number;
  total: number;
  questions: ExamNavigatorQuestion[];
};

type Props = {
  sections: ExamNavigatorSection[];
  activeIndex: number;
  onSelectSection: (index: number) => void;
  onSelectQuestion: (question: ExamNavigatorQuestion) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitting?: boolean;
  className?: string;
};

/** Shared bottom question bar for all computer-delivered test screens. */
export default function ExamQuestionNavigator({
  sections,
  activeIndex,
  onSelectSection,
  onSelectQuestion,
  onPrevious,
  onNext,
  onSubmit,
  submitDisabled = false,
  submitting = false,
  className = "",
}: Props) {
  return (
    <nav className={className} aria-label="Điều hướng câu hỏi">
      <div className="w-full pl-3 md:pl-6 flex items-stretch gap-3">
        <div className="flex-1 min-w-0 flex items-center justify-center gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2">
          {sections.map((section, index) => {
            const isCurrent = index === activeIndex;
            const percent = section.total
              ? Math.round((section.answered / section.total) * 100)
              : 0;

            return (
              <div
                key={section.id}
                className="shrink-0 flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => onSelectSection(index)}
                  className="relative flex items-center gap-2 pt-2 cursor-pointer group whitespace-nowrap"
                >
                  <span className="absolute top-0 left-0 right-0 h-[3px] rounded bg-[#D7D7D7]" />
                  <span
                    className="absolute top-0 left-0 h-[3px] rounded bg-brand transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isCurrent
                        ? "text-ink"
                        : "text-ink/55 group-hover:text-brand"
                    }`}
                  >
                    SECTION {index + 1}
                  </span>
                  {!isCurrent && (
                    <span className="text-xs text-ink/45">
                      {section.answered} of {section.total}
                    </span>
                  )}
                </button>

                {isCurrent && (
                  <div className="flex gap-1">
                    {section.questions.map((question) => {
                      const filled = question.answered;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => onSelectQuestion(question)}
                          className="relative pt-2 cursor-pointer"
                          aria-label={`Tới câu ${question.number}`}
                          aria-current={question.active ? "true" : undefined}
                        >
                          <span className="absolute top-0 left-0 right-0 h-[3px] rounded bg-[#D7D7D7]" />
                          <span
                            className={`absolute top-0 left-0 h-[3px] rounded transition-all duration-300 ${
                              question.stateClassName ?? "bg-brand"
                            }`}
                            style={{ width: filled ? "100%" : "0%" }}
                          />
                          {question.bookmarked && (
                            <Bookmark
                              size={11}
                              aria-hidden
                              className="absolute -top-0.5 -right-1 z-10 text-[#FFC107] fill-[#FFC107] rotate-[25deg]"
                            />
                          )}
                          <span
                            data-exam-key
                            className={`flex h-[30px] min-w-[30px] px-1 items-center justify-center rounded border text-sm bg-white transition-colors ${
                              question.active
                                ? "border-[#D97706] border-2 text-ink"
                                : "border-[#D8DCE3] text-[#333] hover:border-brand"
                            }`}
                          >
                            {question.number}
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
            onClick={onPrevious}
            disabled={activeIndex === 0}
            className="hidden sm:flex h-9 w-9 rounded bg-ink/10 text-ink/70 items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Phần trước"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= sections.length - 1}
            className="hidden sm:flex h-9 w-9 rounded bg-ink text-white items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Phần sau"
          >
            <ArrowRight size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          title="Nộp bài"
          aria-label="Nộp bài"
          className="shrink-0 px-5 md:px-8 bg-[#EFEFEF] hover:bg-brand hover:text-white text-ink flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait cursor-pointer transition-colors"
        >
          <Check size={26} strokeWidth={2.5} />
          <span className="hidden md:inline font-bold text-xs">
            {submitting ? "Đang chấm..." : "Nộp bài"}
          </span>
        </button>
      </div>
    </nav>
  );
}
