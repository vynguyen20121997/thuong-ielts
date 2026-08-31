"use client";

import { Check, X } from "lucide-react";

import { isChoiceQuestion, type GradedQuestion, type Question } from "../domain/types";

/**
 * Renders one question in either of its two states: answerable, or reviewed.
 * It never decides whether an answer is right — `review` is handed down from
 * the server-graded result.
 */
export default function QuestionField({
  question,
  value,
  onChange,
  review,
  disabled,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  review?: GradedQuestion;
  disabled: boolean;
}) {
  const state = review ? (review.isCorrect ? "correct" : "wrong") : "idle";

  const borderByState = {
    idle: "border-black/5",
    correct: "border-leaf",
    wrong: "border-red-300",
  }[state];

  return (
    <div
      id={`question-${question.number}`}
      className={`bg-white border ${borderByState} rounded-2xl p-5 scroll-mt-28 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center font-mono text-2xs font-bold ${state === "correct" ? "bg-leaf text-brand" : state === "wrong" ? "bg-red-100 text-red-600" : value.trim() ? "bg-brand text-white" : "bg-black/[0.06] text-ink/50"}`}
        >
          {state === "correct" ? (
            <Check size={14} />
          ) : state === "wrong" ? (
            <X size={14} />
          ) : (
            question.number
          )}
        </span>

        <p className="text-sm text-ink leading-relaxed font-medium pt-0.5">
          {question.prompt}
        </p>
      </div>

      <div className="mt-4 pl-10">
        {isChoiceQuestion(question) ? (
          <div className="flex flex-col gap-2">
            {question.options.map((option) => {
              const selected = value === option;
              const isExpected = review?.expected === option;

              return (
                <label
                  key={option}
                  className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm leading-snug transition-colors ${disabled ? "cursor-default" : "cursor-pointer"} ${review && isExpected ? "border-brand/40 bg-leaf/20 text-brand font-semibold" : selected ? (review ? "border-red-300 bg-red-50 text-red-700" : "border-brand bg-brand/[0.06] text-brand font-semibold") : "border-black/[0.08] text-ink/75 hover:border-brand/30"}`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => onChange(option)}
                    className="mt-[3px] accent-brand"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Tối đa ${question.maxWords} từ`}
              className={`w-full max-w-sm bg-white border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors ${state === "correct" ? "border-leaf" : state === "wrong" ? "border-red-300 bg-red-50" : "border-black/10 focus:border-brand/50"} disabled:cursor-default`}
            />
            {/* Wording stays skill-neutral: this field serves reading and listening. */}
            <span className="text-2xs text-ink/35 font-medium block mt-2">
              Viết không quá {question.maxWords} từ
            </span>
          </div>
        )}

        {review && !review.isCorrect && (
          <p className="mt-3 text-sm text-ink/70">
            <span className="text-2xs font-medium text-brand block mb-1">Đáp án đúng</span>
            {review.expected}
          </p>
        )}

        {review?.explanation && (
          <p className="mt-3 text-sm leading-relaxed text-ink/65 bg-cream border-l-2 border-leaf pl-3 py-2 rounded-r-lg">
            {review.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
