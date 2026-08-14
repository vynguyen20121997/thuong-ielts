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
    correct: "border-[#9FE870]",
    wrong: "border-red-300",
  }[state];

  return (
    <div
      id={`question-${question.number}`}
      className={`bg-white border ${borderByState} rounded-2xl p-5 scroll-mt-28 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center font-mono text-[11px] font-black ${
            state === "correct"
              ? "bg-[#9FE870] text-[#14532D]"
              : state === "wrong"
                ? "bg-red-100 text-red-600"
                : value.trim()
                  ? "bg-[#14532D] text-white"
                  : "bg-black/[0.06] text-[#1A1A1A]/50"
          }`}
        >
          {state === "correct" ? (
            <Check size={14} />
          ) : state === "wrong" ? (
            <X size={14} />
          ) : (
            question.number
          )}
        </span>

        <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium pt-0.5">
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
                  className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-[13px] leading-snug transition-colors ${
                    disabled ? "cursor-default" : "cursor-pointer"
                  } ${
                    review && isExpected
                      ? "border-[#14532D]/40 bg-[#9FE870]/20 text-[#14532D] font-semibold"
                      : selected
                        ? review
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-[#14532D] bg-[#14532D]/[0.06] text-[#14532D] font-semibold"
                        : "border-black/[0.08] text-[#1A1A1A]/75 hover:border-[#14532D]/30"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => onChange(option)}
                    className="mt-[3px] accent-[#14532D]"
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
              className={`w-full max-w-sm bg-white border rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none transition-colors ${
                state === "correct"
                  ? "border-[#9FE870]"
                  : state === "wrong"
                    ? "border-red-300 bg-red-50"
                    : "border-black/10 focus:border-[#14532D]/50"
              } disabled:cursor-default`}
            />
            {/* Wording stays skill-neutral: this field serves reading and listening. */}
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/35 font-bold block mt-2">
              Viết không quá {question.maxWords} từ
            </span>
          </div>
        )}

        {review && !review.isCorrect && (
          <p className="mt-3 text-[13px] text-[#1A1A1A]/70">
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-[#14532D] block mb-1">
              Đáp án đúng
            </span>
            {review.expected}
          </p>
        )}

        {review?.explanation && (
          <p className="mt-3 text-[13px] leading-relaxed text-[#1A1A1A]/65 bg-[#FAF9F6] border-l-2 border-[#9FE870] pl-3 py-2 rounded-r-lg">
            {review.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
