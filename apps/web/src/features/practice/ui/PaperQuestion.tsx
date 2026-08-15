"use client";

import { Fragment } from "react";

import { Bookmark } from "lucide-react";

import type { Highlight } from "../domain/annotations";
import { isChoiceQuestion, type GradedQuestion, type Question } from "../domain/types";
import HighlightableText from "./HighlightableText";
import GapText, { GapInput, hasInlineGap } from "./GapText";

/**
 * Renders one reading question the way the paper does: a number, the text, and
 * the answer written into the line itself rather than into a card underneath.
 *
 * Three shapes cover every reading task we import:
 *
 *   - a blank inside a sentence  ->  "despite the [___] of 2001"
 *   - a question with no blank   ->  "Who visits stepwells? [___]"
 *   - a fixed set of choices     ->  the options listed under the statement
 *
 * The import flattened the source document's tables into sentences, so a table
 * task reads as one line per cell instead of a grid. Restoring the grid needs
 * the layout stored at import time, which it currently is not.
 */

/**
 * Two blank notations reach us from the importer. Most prompts keep the source
 * document's own marker — "6………………" — and a handful were rewritten with a run
 * of underscores. Both mean the same thing, so both must land an input in place
 * rather than tacking one on the end.
 */
const BLANK = /_{3,}/;

function AnswerLine({
  question,
  value,
  onChange,
  review,
  disabled,
  onFocus,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  review?: GradedQuestion;
  disabled: boolean;
  onFocus?: (number: number) => void;
}) {
  const field = {
    number: question.number,
    questionId: question.id,
    value,
    maxWords: "maxWords" in question ? question.maxWords : 2,
    review,
  };
  const input = (
    <GapInput field={field} disabled={disabled} onChange={onChange} onFocus={onFocus} variant="line" />
  );

  // "6………………" — same notation the listening paper uses, so reuse its renderer.
  if (hasInlineGap(question.prompt, question.number)) {
    return (
      <GapText
        text={question.prompt}
        fields={[field]}
        disabled={disabled}
        onChange={(_id, value) => onChange(value)}
        onFocus={onFocus}
        variant="line"
      />
    );
  }

  const match = question.prompt.match(BLANK);
  if (!match || match.index === undefined) {
    // No blank in the sentence: the answer goes after the question, as on paper.
    return (
      <p className="text-[15px] leading-[2.1] text-[#1A1A1A]">
        {question.prompt}
        {input}
      </p>
    );
  }

  return (
    <p className="text-[15px] leading-[2.1] text-[#1A1A1A]">
      <Fragment>{question.prompt.slice(0, match.index)}</Fragment>
      {input}
      <Fragment>{question.prompt.slice(match.index + match[0].length)}</Fragment>
    </p>
  );
}

export default function PaperQuestion({
  question,
  value,
  onChange,
  review,
  disabled,
  active,
  onFocus,
  highlights = [],
  onRemoveHighlight,
  bookmarked = false,
  onToggleBookmark,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  review?: GradedQuestion;
  disabled: boolean;
  active?: boolean;
  onFocus?: (number: number) => void;
  highlights?: Highlight[];
  onRemoveHighlight?: (blockId: string, offset: number, rect: DOMRect) => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
}) {
  const wrong = review && !review.isCorrect;

  return (
    <div
      // Only the choice questions carry the id: a gap-fill puts it on its input
      // instead, and two elements sharing one id is invalid HTML that makes
      // getElementById return whichever came first.
      id={isChoiceQuestion(question) ? `question-${question.number}` : undefined}
      className={`group/q scroll-mt-32 rounded-lg px-2 -mx-2 py-1 transition-colors ${
        active && !review
          ? "bg-[#FFFBEB] ring-1 ring-[#D97706]/40"
          : bookmarked
            ? "bg-[#FFC107]/[0.07]"
            : ""
      }`}
    >
      <div className="flex gap-3">
        <span className="shrink-0 flex items-start gap-1 pt-1">
          <span className="font-bold text-[15px] text-[#1A1A1A] w-6">{question.number}</span>
          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              title={bookmarked ? "Bỏ đánh dấu câu này" : "Đánh dấu để quay lại sau"}
              aria-label={bookmarked ? `Bỏ đánh dấu câu ${question.number}` : `Đánh dấu câu ${question.number}`}
              aria-pressed={bookmarked}
              // Only shows on hover until it is set, so an unmarked paper stays
              // clean — the exam site hides it the same way.
              className={`cursor-pointer transition-opacity ${
                bookmarked ? "opacity-100" : "opacity-0 group-hover/q:opacity-60 hover:!opacity-100"
              }`}
            >
              <Bookmark
                size={14}
                className={bookmarked ? "text-[#FFC107] fill-[#FFC107]" : "text-[#1A1A1A]/50"}
              />
            </button>
          )}
        </span>

        <div className="min-w-0 flex-1">
          {isChoiceQuestion(question) ? (
            <>
              <p className="text-[15px] leading-relaxed text-[#1A1A1A]">
                <HighlightableText
                  blockId={question.id}
                  text={question.prompt}
                  highlights={highlights}
                  onRemove={onRemoveHighlight}
                />
              </p>
              <div className="mt-1.5 space-y-1">
                {question.options.map((option) => {
                  const chosen = value === option;
                  const isAnswer = wrong && review!.expected === option;
                  return (
                    <label
                      key={option}
                      className={`flex items-start gap-2.5 text-[15px] rounded px-2 py-0.5 ${
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
                        name={question.id}
                        checked={chosen}
                        onChange={() => onChange(option)}
                        onFocus={() => onFocus?.(question.number)}
                        disabled={disabled}
                        className="mt-1.5 accent-[#14532D]"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              {wrong && (
                <p className="text-[12px] text-[#14532D] mt-1 font-medium">
                  Đáp án: {review!.expected}
                </p>
              )}
            </>
          ) : (
            <AnswerLine
              question={question}
              value={value}
              onChange={onChange}
              review={review}
              disabled={disabled}
              onFocus={onFocus}
            />
          )}

          {review?.explanation && (
            <p className="mt-2 text-[13px] leading-relaxed text-[#1A1A1A]/65 bg-[#FAF9F6] border-l-2 border-[#9FE870] pl-3 py-2 rounded-r-lg whitespace-pre-line">
              {review.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
