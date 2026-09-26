"use client";

import { useMemo, useState } from "react";

import {
  cleanGroupInstruction,
  multiAnswerLimit,
  questionRangeLabel,
} from "../domain/readingQuestionType";
import { isChoiceQuestion, type GradedQuestion, type Question, type ReadingAnswers } from "../domain/types";
import GapText, { hasInlineGap } from "./GapText";
import PaperQuestion from "./PaperQuestion";

interface Props {
  questions: Question[];
  answers: ReadingAnswers;
  onChange: (questionId: string, value: string) => void;
  reviewByQuestion: Map<string, GradedQuestion> | null;
  disabled: boolean;
  activeNumber: number | null;
  onFocus: (number: number) => void;
  selectedHeading?: string | null;
  onSelectHeading?: (option: string | null) => void;
}

const CONSTRAINT = /(ONE WORD ONLY|NO MORE THAN (?:ONE|TWO|THREE) WORDS?|Choose (?:TWO|THREE|FOUR|FIVE)|A[–-][A-Z]|TRUE|FALSE|NOT GIVEN|YES|NO)/gi;

function Instruction({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(CONSTRAINT);
  return (
    <div className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink/75">
      {parts.map((part, index) => /^(?:ONE WORD ONLY|NO MORE THAN (?:ONE|TWO|THREE) WORDS?|Choose (?:TWO|THREE|FOUR|FIVE)|A[–-][A-Z]|TRUE|FALSE|NOT GIVEN|YES|NO)$/i.test(part) ? <strong key={index} className="font-bold text-ink">{part}</strong> : part)}
    </div>
  );
}

function withoutHeadingBank(text: string) {
  const marker = text.search(/^List of Headings\s*$/im);
  return marker >= 0 ? text.slice(0, marker).trim() : text;
}

function HeadingBank({ questions, disabled, selectedHeading, onSelectHeading }: Props) {
  const options = isChoiceQuestion(questions[0]) ? questions[0].options : [];
  return <div className="mt-7">
    <h4 className="text-lg font-bold text-ink">List of Headings</h4>
    <p className="mt-1 text-sm leading-6 text-ink/55">💡 Kéo đáp án thả vào ô trống, hoặc bấm chọn đáp án rồi bấm vào ô trống để điền.</p>
    <div className="mt-12 flex flex-col items-start gap-3">
      {options.map((option) => <button key={option} type="button" draggable={!disabled} disabled={disabled}
        aria-pressed={selectedHeading === option}
        onDragStart={(event) => { event.dataTransfer.setData("text/plain", option); event.dataTransfer.effectAllowed = "copy"; }}
        onClick={() => onSelectHeading?.(selectedHeading === option ? null : option)}
        className={`max-w-full rounded-lg border px-3 py-2 text-left text-base font-bold leading-6 transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default ${selectedHeading === option ? "border-brand bg-leaf/20" : "border-black/25 bg-white hover:border-brand/60"} ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}>{option}</button>)}
    </div>
  </div>;
}

function ChoiceRow({ question, value, onChange, disabled, checkbox = false }: {
  question: Question; value: string; onChange: (value: string) => void; disabled: boolean; checkbox?: boolean;
}) {
  if (!isChoiceQuestion(question)) return null;
  return (
    <div className="mt-3 space-y-2">
      {question.options.map((option) => (
        <label key={option} className={`flex items-start gap-3 rounded-lg px-3 py-2 text-[15px] leading-6 transition-colors ${disabled ? "cursor-default" : "cursor-pointer hover:bg-cream"} ${value === option ? "bg-leaf/25 ring-1 ring-brand/20" : ""}`}>
          <input type={checkbox ? "checkbox" : "radio"} name={question.id} checked={value === option} disabled={disabled} onChange={() => onChange(option)} className="mt-1.5 size-4 accent-brand" />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function JudgementGroup({ questions, answers, onChange, disabled }: Omit<Props, "reviewByQuestion" | "activeNumber" | "onFocus">) {
  return <div className="mt-6 space-y-7">{questions.map((question) => (
    <div key={question.id} id={`question-${question.number}`} className="scroll-mt-32">
      <p className="text-[15px] leading-7"><strong className="mr-2">{question.number}</strong>{question.prompt}</p>
      <ChoiceRow question={question} value={answers[question.id] ?? ""} onChange={(value) => onChange(question.id, value)} disabled={disabled} />
    </div>
  ))}</div>;
}

function SingleChoiceGroup({ questions, answers, onChange, disabled }: Omit<Props, "reviewByQuestion" | "activeNumber" | "onFocus">) {
  return <div className="mt-6 space-y-8">{questions.map((question) => (
    <div key={question.id} id={`question-${question.number}`} className="scroll-mt-32">
      <p className="text-[15px] leading-7"><strong className="mr-2">{question.number}</strong>{question.prompt}</p>
      <ChoiceRow question={question} value={answers[question.id] ?? ""} onChange={(value) => onChange(question.id, value)} disabled={disabled} />
    </div>
  ))}</div>;
}

function SharedBankGroup({ questions, answers, onChange, disabled, title = "List of options", showTargets = true }: Omit<Props, "reviewByQuestion" | "activeNumber" | "onFocus"> & { title?: string; showTargets?: boolean }) {
  const [armed, setArmed] = useState<string | null>(null);
  const options = useMemo(() => isChoiceQuestion(questions[0]) ? questions[0].options : [], [questions]);
  const assign = (question: Question, option: string) => { onChange(question.id, option); setArmed(null); };
  return (
    <div className="mt-6 space-y-6">
      {showTargets && <div className="space-y-3">
        {questions.map((question) => {
          const value = answers[question.id] ?? "";
          return <button key={question.id} id={`question-${question.number}`} type="button" disabled={disabled} onClick={() => armed && assign(question, armed)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => assign(question, event.dataTransfer.getData("text/plain"))} className="flex w-full items-center gap-3 text-left scroll-mt-32">
            <span className={`min-h-11 min-w-24 rounded-lg border-2 border-dashed px-3 py-2 text-sm ${value ? "border-brand/40 bg-leaf/20" : armed ? "border-brand bg-leaf/10" : "border-black/20"}`}><strong>{question.number}</strong>{value && <span className="ml-2">{value}</span>}</span>
            <span className="text-[15px] leading-6">{question.prompt}</span>
          </button>;
        })}
      </div>}
      <div>
        <h4 className="text-base font-bold">{title}</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map((option) => <button key={option} type="button" draggable={!disabled} disabled={disabled} onDragStart={(event) => event.dataTransfer.setData("text/plain", option)} onClick={() => setArmed(armed === option ? null : option)} className={`rounded-lg border px-3 py-2 text-left text-sm leading-6 transition-colors ${armed === option ? "border-brand bg-leaf/25" : "border-black/15 bg-white hover:border-brand/40"}`}>{option}</button>)}
        </div>
        <p className="mt-2 text-xs text-ink/65">Kéo thả, hoặc chọn một đáp án rồi chọn ô câu hỏi.</p>
      </div>
    </div>
  );
}

function MatchingMatrix({ questions, answers, onChange, disabled }: Omit<Props, "reviewByQuestion" | "activeNumber" | "onFocus">) {
  const options = isChoiceQuestion(questions[0]) ? questions[0].options : [];
  return <div className="mt-6 overflow-x-auto"><table className="min-w-full border-separate border-spacing-0 text-sm"><thead><tr><th className="sticky left-0 z-10 min-w-72 border-b bg-white p-3 text-left">Statement</th>{options.map((option) => <th key={option} className="min-w-12 border-b p-3 text-center font-bold">{option}</th>)}</tr></thead><tbody>{questions.map((question) => <tr key={question.id}><td className="sticky left-0 border-b bg-white p-3 leading-6"><strong className="mr-2">{question.number}</strong>{question.prompt}</td>{options.map((option) => <td key={option} className="border-b p-3 text-center"><input aria-label={`Câu ${question.number}: ${option}`} type="radio" name={question.id} checked={(answers[question.id] ?? "") === option} disabled={disabled} onChange={() => onChange(question.id, option)} className="size-4 accent-brand" /></td>)}</tr>)}</tbody></table></div>;
}

function ManyChoiceGroup({ questions, answers, onChange, disabled }: Omit<Props, "reviewByQuestion" | "activeNumber" | "onFocus">) {
  const options = isChoiceQuestion(questions[0]) ? questions[0].options : [];
  const limit = Math.min(multiAnswerLimit(questions), questions.length);
  const selected = questions.map((q) => answers[q.id]).filter(Boolean);
  const toggle = (option: string) => {
    const at = selected.indexOf(option);
    if (at >= 0) {
      const id = questions.find((q) => answers[q.id] === option)?.id;
      if (id) onChange(id, "");
      return;
    }
    const empty = questions.find((q) => !answers[q.id]);
    if (empty && selected.length < limit) onChange(empty.id, option);
  };
  return <div className="mt-6"><p className="text-[15px] leading-7"><strong className="mr-2">{questions.map((q) => q.number).join("–")}</strong>{questions[0].prompt}</p><div className="mt-3 space-y-2">{options.map((option) => { const checked = selected.includes(option); const full = selected.length >= limit && !checked; return <label key={option} className={`flex items-start gap-3 rounded-lg px-3 py-2 text-[15px] ${disabled || full ? "opacity-55" : "cursor-pointer hover:bg-cream"}`}><input type="checkbox" checked={checked} disabled={disabled || full} onChange={() => toggle(option)} className="mt-1 size-4 accent-brand"/><span>{option}</span></label>; })}</div><p className="mt-2 text-xs text-ink/65">Đã chọn {selected.length}/{limit}</p></div>;
}

function CompletionGroup(props: Props) {
  const table = props.questions.find((question) => question.tableLayout)?.tableLayout;
  if (table) return <div className="mt-6 overflow-x-auto"><table className="w-full border-collapse text-base"><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => {
    const Tag = rowIndex === 0 ? "th" : "td";
    return <Tag key={cellIndex} colSpan={cell.colSpan} rowSpan={cell.rowSpan} className="border border-ink/60 px-3 py-4 text-left align-top min-w-28">
      <GapText text={cell.text} fields={props.questions.map((q) => ({ number: q.number, questionId: q.id, value: props.answers[q.id] ?? "", maxWords: "maxWords" in q ? q.maxWords : 2, review: props.reviewByQuestion?.get(q.id) }))} disabled={props.disabled} onChange={props.onChange} onFocus={props.onFocus} />
    </Tag>;
  })}</tr>)}</tbody></table></div>;
  const uniquePrompts = [...new Set(props.questions.map((question) => question.prompt))];
  const canCombine = uniquePrompts.some((prompt) => props.questions.filter((q) => hasInlineGap(prompt, q.number)).length > 1);
  if (!canCombine) return <div className="mt-5 space-y-3">{props.questions.map((question) => <PaperQuestion key={question.id} question={question} value={props.answers[question.id] ?? ""} onChange={(value) => props.onChange(question.id, value)} review={props.reviewByQuestion?.get(question.id)} disabled={props.disabled} active={props.activeNumber === question.number} onFocus={props.onFocus} />)}</div>;
  return <div className="mt-5 space-y-5">{uniquePrompts.map((prompt) => { const matching = props.questions.filter((q) => hasInlineGap(prompt, q.number)); if (!matching.length) return null; return <GapText key={prompt} text={prompt} fields={matching.map((q) => ({ number: q.number, questionId: q.id, value: props.answers[q.id] ?? "", maxWords: "maxWords" in q ? q.maxWords : 2, review: props.reviewByQuestion?.get(q.id), active: props.activeNumber === q.number }))} disabled={props.disabled} onChange={props.onChange} onFocus={props.onFocus} variant="box"/>; })}</div>;
}

export default function ReadingQuestionGroup(props: Props) {
  const type = props.questions[0]?.type;
  let instruction = cleanGroupInstruction(props.questions[0]?.group, props.questions);
  const table = props.questions.find((q) => q.tableLayout)?.tableLayout;
  if (table) {
    const firstCell = table.rows[0]?.[0]?.text.trim();
    const start = firstCell ? instruction.indexOf(firstCell) : -1;
    if (start >= 0) instruction = instruction.slice(0, start).trim();
  }
  return <section className="border-b border-black/10 py-8 first:pt-0 last:border-0 last:pb-0">
    <h3 className="text-lg font-bold text-ink">{questionRangeLabel(props.questions)}</h3>
    <Instruction text={type === "matching-headings" ? withoutHeadingBank(instruction) : instruction} />
    {type === "true-false-not-given" || type === "yes-no-not-given" ? <JudgementGroup {...props} />
      : type === "multiple-choice" ? <SingleChoiceGroup {...props} />
      : type === "multiple-choice-many" ? <ManyChoiceGroup {...props} />
      : type === "matching-information" ? <MatchingMatrix {...props} />
      : type === "matching-headings" ? <HeadingBank {...props} />
      : type === "matching-features" || type === "matching-endings" || (type === "summary-completion" && isChoiceQuestion(props.questions[0])) ? <SharedBankGroup {...props} />
      : type === "gap-fill" || type === "map-diagram-label" ? <CompletionGroup {...props} />
      : <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Nhóm câu hỏi này cần được kiểm tra lại trước khi hiển thị.</p>}
  </section>;
}
