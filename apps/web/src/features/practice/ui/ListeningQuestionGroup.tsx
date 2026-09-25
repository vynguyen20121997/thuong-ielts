"use client";

import { useMemo, useState } from "react";

import {
  cleanListeningInstruction,
  listeningQuestionRange,
  listeningSelectionLimit,
} from "../domain/listeningQuestionType";
import { isChoiceQuestion, type GradedQuestion, type Question, type ReadingAnswers } from "../domain/types";
import GapText, { GapInput, hasInlineGap } from "./GapText";

interface Props {
  questions: Question[];
  answers: ReadingAnswers;
  onChange: (questionId: string, value: string) => void;
  reviewByQuestion: Map<string, GradedQuestion> | null;
  disabled: boolean;
  activeNumber: number | null;
  onFocus: (number: number) => void;
}

const EMPHASIS = /^(?:ONE WORD AND\/OR A NUMBER|ONE WORD ONLY|NO MORE THAN (?:ONE|TWO|THREE) WORDS?(?: AND\/OR A NUMBER)?|TWO|THREE|FOUR|FIVE|A[–-][A-Z])$/i;
const SPLIT_EMPHASIS = /(ONE WORD AND\/OR A NUMBER|ONE WORD ONLY|NO MORE THAN (?:ONE|TWO|THREE) WORDS?(?: AND\/OR A NUMBER)?|\bTWO\b|\bTHREE\b|\bFOUR\b|\bFIVE\b|A[–-][A-Z])/gi;

function Instructions({ value }: { value: string }) {
  if (!value) return null;
  return <p className="mt-2 whitespace-pre-line text-base leading-7 text-ink/75">{value.split(SPLIT_EMPHASIS).map((part, index) => EMPHASIS.test(part) ? <strong key={index} className="font-bold text-ink">{part}</strong> : part)}</p>;
}

function SingleChoice({ questions, answers, onChange, disabled, onFocus }: Props) {
  return <div className="mt-6 space-y-8">{questions.map((question) => !isChoiceQuestion(question) ? null : <div key={question.id} id={`question-${question.number}`} className="scroll-mt-32"><p className="text-base leading-7"><strong className="mr-2">{question.number}</strong>{question.prompt}</p><div className="mt-3 space-y-2">{question.options.map((option) => <label key={option} className={`flex items-start gap-3 rounded-lg px-3 py-2 text-base leading-7 ${disabled ? "cursor-default" : "cursor-pointer hover:bg-cream"} ${answers[question.id] === option ? "bg-leaf/25" : ""}`}><input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => onChange(question.id, option)} onFocus={() => onFocus(question.number)} disabled={disabled} className="mt-1.5 size-4 accent-brand"/><span>{option}</span></label>)}</div></div>)}</div>;
}

function MultipleChoiceMany({ questions, answers, onChange, disabled }: Props) {
  const options = isChoiceQuestion(questions[0]) ? questions[0].options : [];
  const limit = Math.min(listeningSelectionLimit(questions), questions.length);
  const selected = questions.map((question) => answers[question.id]).filter(Boolean);
  const toggle = (option: string) => {
    const existing = questions.find((question) => answers[question.id] === option);
    if (existing) return onChange(existing.id, "");
    const empty = questions.find((question) => !answers[question.id]);
    if (empty && selected.length < limit) onChange(empty.id, option);
  };
  return <div className="mt-6"><p className="text-base leading-7"><strong className="mr-2">{questions.map((question) => question.number).join("–")}</strong>{questions[0].prompt}</p><div className="mt-3 space-y-2">{options.map((option) => { const checked = selected.includes(option); const locked = selected.length >= limit && !checked; return <label key={option} className={`flex items-start gap-3 rounded-lg px-3 py-2 text-base leading-7 ${disabled || locked ? "opacity-50" : "cursor-pointer hover:bg-cream"}`}><input type="checkbox" checked={checked} disabled={disabled || locked} onChange={() => toggle(option)} className="mt-1.5 size-4 accent-brand"/><span>{option}</span></label>; })}</div><p className="mt-2 text-sm text-ink/65">Đã chọn {selected.length}/{limit}</p></div>;
}

function MatchingInformation({ questions, answers, onChange, disabled }: Props) {
  const [armed, setArmed] = useState<string | null>(null);
  const options = isChoiceQuestion(questions[0]) ? questions[0].options : [];
  const assign = (question: Question, option: string) => { if (!option) return; onChange(question.id, option); setArmed(null); };
  return <div className="mt-6 grid gap-8 lg:grid-cols-2"><div className="space-y-3">{questions.map((question) => <button key={question.id} id={`question-${question.number}`} type="button" disabled={disabled} onClick={() => armed && assign(question, armed)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => assign(question, event.dataTransfer.getData("text/plain"))} className="flex w-full items-center gap-3 text-left scroll-mt-32"><span className={`min-h-12 min-w-28 rounded-lg border-2 border-dashed px-3 py-2 text-sm ${answers[question.id] ? "border-brand/40 bg-leaf/20" : armed ? "border-brand" : "border-black/20"}`}><strong>{question.number}</strong>{answers[question.id] && <span className="ml-2">{answers[question.id]}</span>}</span><span className="text-base leading-7">{question.prompt}</span></button>)}</div><div><h4 className="text-lg font-bold">List of options</h4><p className="mt-1 text-sm text-ink/65">Kéo đáp án vào ô hoặc chọn đáp án rồi chọn ô câu hỏi.</p><div className="mt-3 space-y-2">{options.map((option) => <button key={option} type="button" draggable={!disabled} disabled={disabled} onDragStart={(event) => event.dataTransfer.setData("text/plain", option)} onClick={() => setArmed(armed === option ? null : option)} className={`w-full rounded-lg border px-3 py-2 text-left text-base leading-7 ${armed === option ? "border-brand bg-leaf/25" : "border-black/15 hover:border-brand/40"}`}>{option}</button>)}</div></div></div>;
}

function GapFilling(props: Props) {
  const prompts = [...new Set(props.questions.map((question) => question.prompt))];
  return <div className="mt-6 space-y-5">{prompts.map((prompt) => {
    const matching = props.questions.filter((question) => hasInlineGap(prompt, question.number));
    if (matching.length) return <GapText key={prompt} text={prompt} fields={matching.map((question) => ({ number: question.number, questionId: question.id, value: props.answers[question.id] ?? "", maxWords: "maxWords" in question ? question.maxWords : 2, review: props.reviewByQuestion?.get(question.id), active: props.activeNumber === question.number }))} disabled={props.disabled} onChange={props.onChange} onFocus={props.onFocus}/>;
    const question = props.questions.find((item) => item.prompt === prompt)!;
    return <p key={question.id} className="whitespace-pre-line text-base leading-9"><strong className="mr-2">{question.number}</strong>{prompt}<GapInput field={{ number: question.number, questionId: question.id, value: props.answers[question.id] ?? "", maxWords: "maxWords" in question ? question.maxWords : 2, review: props.reviewByQuestion?.get(question.id), active: props.activeNumber === question.number }} disabled={props.disabled} onChange={(value) => props.onChange(question.id, value)} onFocus={props.onFocus}/></p>;
  })}</div>;
}

function MapDiagram({ questions, answers, onChange, disabled }: Props) {
  const options = isChoiceQuestion(questions[0]) ? questions[0].options : [];
  const imageUrl = questions.find((question) => question.imageUrl)?.imageUrl;
  return <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">{imageUrl ? <img src={imageUrl} alt="Listening map or diagram" className="h-auto w-full rounded-lg border border-black/10 object-contain"/> : <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-black/20 bg-cream p-6 text-center text-sm text-ink/65">Bản đồ/sơ đồ gốc chưa có URL hình ảnh trong dữ liệu. Các ký hiệu lựa chọn vẫn được giữ ở bảng bên cạnh.</div>}<div className="overflow-x-auto"><table className="min-w-full border-collapse text-sm"><thead><tr><th className="min-w-56 border border-black/15 p-3 text-left">Location</th>{options.map((option) => <th key={option} className="border border-black/15 p-3 font-bold">{option}</th>)}</tr></thead><tbody>{questions.map((question) => <tr key={question.id}><td className="border border-black/15 p-3 text-base"><strong className="mr-2">{question.number}</strong>{question.prompt}</td>{options.map((option) => <td key={option} className="border border-black/15 p-3 text-center"><input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => onChange(question.id, option)} disabled={disabled} aria-label={`Câu ${question.number}: ${option}`} className="size-4 accent-brand"/></td>)}</tr>)}</tbody></table></div></div>;
}

export default function ListeningQuestionGroup(props: Props) {
  const type = props.questions[0]?.type;
  const instruction = cleanListeningInstruction(props.questions[0]?.group, props.questions);
  return <section className="border-b border-black/10 py-8 first:pt-0 last:border-0"><h3 className="text-xl font-bold">{listeningQuestionRange(props.questions)}</h3><Instructions value={instruction}/>{props.questions.some((question) => question.needsReview) ? <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Nhóm câu hỏi này cần kiểm tra lại cách phân loại trước khi hiển thị.</p> : type === "gap-fill" ? <GapFilling {...props}/> : type === "map-diagram-label" ? <MapDiagram {...props}/> : type === "multiple-choice-many" ? <MultipleChoiceMany {...props}/> : type === "matching-information" ? <MatchingInformation {...props}/> : <SingleChoice {...props}/>}</section>;
}
