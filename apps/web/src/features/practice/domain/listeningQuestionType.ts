import type { Question, QuestionType } from "./types";

export interface ListeningDetection {
  type: QuestionType;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const combinedText = (question: Question) => `${question.group ?? ""}\n${question.prompt}`.replace(/\s+/g, " ").trim();

export function detectListeningQuestionType(question: Question): ListeningDetection {
  const text = combinedText(question);
  const options = "options" in question && Array.isArray(question.options) ? question.options : [];

  if (/(?:label|complete)\s+(?:the\s+)?(?:map|plan|diagram)|(?:map|plan|diagram)\s+below/i.test(text) && options.length > 0)
    return { type: "map-diagram-label", confidence: "high", reason: "map/plan/diagram with fixed letter bank" };
  if (/move it into the gap|match each|matching|list of options|which .* (?:person|speaker|place|feature)|complete (?:the )?(?:flow-?chart|notes?|table|form).*(?:answers from|from the box)/i.test(text) && options.length > 0)
    return { type: "matching-information", confidence: "high", reason: "shared option bank matching" };
  if (question.type === "summary-completion" && options.length > 0)
    return { type: "matching-information", confidence: "medium", reason: "summary completion with shared option bank" };
  if (/choose\s+(?:the\s+)?(?:two|three|four|five|2|3|4|5)\b|which\s+(?:two|three|four|five)\b/i.test(text))
    return { type: "multiple-choice-many", confidence: "high", reason: "explicit multi-answer limit" };
  if (/complete (?:the )?(?:notes?|form|table|sentences?|flow-?chart)|write (?:no more than|one|two|three).*?(?:word|number)/i.test(text) && options.length === 0)
    return { type: "gap-fill", confidence: "high", reason: "typed completion without option bank" };
  if (question.type === "gap-fill" && options.length === 0)
    return { type: "gap-fill", confidence: "medium", reason: "stored free-text structure" };
  if (question.type === "matching-information" || question.type === "matching-features" || question.type === "matching-headings" || question.type === "matching-endings")
    return { type: "matching-information", confidence: "medium", reason: "stored shared matching structure" };
  if (options.length >= 2 && /choose|correct (?:letter|answer)|which|what|why|how/i.test(text))
    return { type: "multiple-choice", confidence: "medium", reason: "single-answer option structure" };
  if (options.length >= 2)
    return { type: "multiple-choice", confidence: "low", reason: "options exist but instruction is not decisive" };
  return { type: question.type, confidence: "low", reason: "insufficient semantic and structural evidence" };
}

export function normalizeListeningQuestion(question: Question): Question {
  const detected = detectListeningQuestionType(question);
  return { ...question, type: detected.type, needsReview: detected.confidence === "low" || undefined } as Question;
}

export function listeningQuestionRange(questions: Question[]): string {
  const first = questions[0]?.number;
  const last = questions.at(-1)?.number;
  return first === last ? `Question ${first}` : `Questions ${first}–${last}`;
}

export function cleanListeningInstruction(group: string | undefined, questions: Question[]): string {
  if (!group) return "";
  const prompts = new Set(questions.map((question) => question.prompt.trim()));
  const seen = new Set<string>();
  return group.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    .filter((line) => !/^Questions?\s+\d+/i.test(line))
    .filter((line) => !prompts.has(line))
    .filter((line) => { const key = line.toLowerCase().replace(/[.\s]+$/g, ""); if (seen.has(key)) return false; seen.add(key); return true; })
    .join("\n");
}

export function groupListeningQuestions(questions: Question[]): Question[][] {
  const groups: Question[][] = [];
  for (const question of questions.map(normalizeListeningQuestion)) {
    const range = (question.group ?? "").match(/Questions?\s+(\d+)\s*(?:[–-]|and|&)\s*(\d+)/i)?.[0] ?? "";
    const previous = groups.at(-1);
    const previousQuestion = previous?.[0];
    const previousRange = (previousQuestion?.group ?? "").match(/Questions?\s+(\d+)\s*(?:[–-]|and|&)\s*(\d+)/i)?.[0] ?? "";
    if (previous && previousQuestion && previousQuestion.type === question.type && range && range === previousRange) previous.push(question);
    else groups.push([question]);
  }
  return groups;
}

export function listeningSelectionLimit(questions: Question[]): number {
  const text = questions.map(combinedText).join(" ");
  const token = text.match(/(?:choose|which)\s+(?:the\s+)?(two|three|four|five|2|3|4|5)\b/i)?.[1]?.toLowerCase();
  const value = ({ two: 2, three: 3, four: 4, five: 5 } as Record<string, number>)[token ?? ""] ?? Number(token);
  return value || questions.length;
}
