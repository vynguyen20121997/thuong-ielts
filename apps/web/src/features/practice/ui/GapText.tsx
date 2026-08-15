"use client";

import { Fragment } from "react";

import type { GradedQuestion } from "../domain/types";

/**
 * Renders a prompt with its blanks turned into input boxes, the way the real
 * computer-delivered test does: "activities end by [ 7 ] p.m." rather than the
 * sentence and a separate field underneath.
 *
 * The imported prompt keeps the source document's own marker — a question
 * number followed by a run of ellipsis characters ("7……………"). That marker is
 * what tells us where the blank sits, so it is matched rather than stripped.
 *
 * One prompt can carry several blanks (a table row or note line often does), so
 * `numbers` is a list: every question whose blank lives in this sentence.
 */

/**
 * "7…………", "7 .....", "10 £ ……" — the question number, an optional currency or
 * percent sign, then the dotted run. The symbol is captured rather than eaten
 * because it belongs to the sentence: the paper reads "cost: £ ___", not
 * "cost: ___". Must stay in step with `sentenceForGap` in the importer, which
 * tolerates the same symbols when it looks for the gap.
 */
const GAP = /(\d{1,2})\s*([£$%€])?\s*[….]{2,}/g;

export interface GapField {
  number: number;
  questionId: string;
  value: string;
  maxWords: number;
  review?: GradedQuestion;
  /** The question the navigator is pointing at — drawn to match its button. */
  active?: boolean;
}

/**
 * Exported so a caller that already has its own paragraph can drop a box into
 * it. GapText renders a <p>; nesting that inside another <p> is invalid HTML
 * and React reports it as a hydration error.
 */
export function GapInput({
  field,
  disabled,
  onChange,
  onFocus,
  compact = false,
}: {
  field: GapField;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Lets the navigator mark which question is being edited. */
  onFocus?: (number: number) => void;
  /** Narrower box, for the reading paper's single-column layout. */
  compact?: boolean;
}) {
  const review = field.review;
  const state = review ? (review.isCorrect ? "correct" : "wrong") : "idle";

  return (
    <span className="inline-flex flex-col align-middle mx-1">
      <span className="inline-flex items-stretch">
        <span
          className={`inline-flex items-center px-2 font-mono text-[11px] font-bold border border-r-0 rounded-l ${
            state === "correct"
              ? "bg-[#9FE870] text-[#14532D] border-[#14532D]/30"
              : state === "wrong"
                ? "bg-red-100 text-red-700 border-red-300"
                : field.active
                  ? "bg-[#FEF3C7] text-[#92400E] border-[#D97706]"
                  : "bg-[#F3F2EE] text-[#1A1A1A]/60 border-black/25"
          }`}
        >
          {field.number}
        </span>
        <input
          id={`question-${field.number}`}
          data-exam-field
          type="text"
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => onFocus?.(field.number)}
          disabled={disabled}
          aria-label={`Câu ${field.number}`}
          title={`Tối đa ${field.maxWords} từ`}
          // No `bg-white` in the base: it and the active tint are the same kind
          // of utility, so whichever Tailwind happens to emit last would win.
          className={`${compact ? "w-24" : "w-40"} border rounded-r px-2 py-1 text-[15px] leading-normal scroll-mt-32 focus:outline-none focus:ring-2 focus:ring-[#14532D]/25 disabled:bg-[#FAF9F6] disabled:cursor-default ${
            state === "correct"
              ? "bg-white border-[#14532D]/30"
              : state === "wrong"
                ? "bg-white border-red-300 text-red-700"
                : field.active
                  ? "bg-[#FFFBEB] border-[#D97706]"
                  : "bg-white border-black/25 focus:border-[#14532D]"
          }`}
        />
      </span>
      {review && !review.isCorrect && (
        <span className="text-[11px] text-[#14532D] mt-1 font-medium">
          Đáp án: {review.expected}
        </span>
      )}
    </span>
  );
}

export default function GapText({
  text,
  fields,
  disabled,
  onChange,
  onFocus,
}: {
  text: string;
  fields: GapField[];
  disabled: boolean;
  onChange: (questionId: string, value: string) => void;
  onFocus?: (number: number) => void;
}) {
  const byNumber = new Map(fields.map((f) => [f.number, f]));
  const parts: React.ReactNode[] = [];

  let cursor = 0;
  let key = 0;
  for (const match of text.matchAll(GAP)) {
    const field = byNumber.get(Number(match[1]));
    // A number that belongs to another question's blank stays as plain text —
    // replacing it would put an input where this student has nothing to answer.
    if (!field) continue;

    parts.push(
      <Fragment key={key++}>
        {text.slice(cursor, match.index)}
        {match[2] ? `${match[2]} ` : ""}
      </Fragment>
    );
    parts.push(
      <GapInput
        key={key++}
        field={field}
        disabled={disabled}
        onChange={(value) => onChange(field.questionId, value)}
        onFocus={onFocus}
      />
    );
    cursor = match.index + match[0].length;
  }
  parts.push(<Fragment key={key++}>{text.slice(cursor)}</Fragment>);

  return <p className="text-[15px] leading-[2.4] text-[#1A1A1A]">{parts}</p>;
}

/** True when this prompt has a blank we can render inline for `number`. */
export function hasInlineGap(text: string, number: number): boolean {
  return new RegExp(`\\b${number}\\s*[£$%€]?\\s*[….]{2,}`).test(text);
}
