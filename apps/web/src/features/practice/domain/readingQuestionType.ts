import type { Question, QuestionType } from "./types";

export interface DetectionResult {
  type: QuestionType;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const textOf = (question: Question) => `${question.group ?? ""}\n${question.prompt}`.replace(/\s+/g, " ").trim();

export function detectReadingQuestionType(question: Question): DetectionResult {
  const text = textOf(question);
  const options = "options" in question ? question.options ?? [] : [];
  const normalizedOptions = options.map((option) => option.replace(/[.\s]/g, "").toUpperCase());

  if (normalizedOptions.length === 3 && normalizedOptions.includes("TRUE") && normalizedOptions.includes("FALSE") && normalizedOptions.includes("NOTGIVEN"))
    return { type: "true-false-not-given", confidence: "high", reason: "TRUE/FALSE/NOT GIVEN option structure" };
  if (normalizedOptions.length === 3 && normalizedOptions.includes("YES") && normalizedOptions.includes("NO") && normalizedOptions.includes("NOTGIVEN"))
    return { type: "yes-no-not-given", confidence: "high", reason: "YES/NO/NOT GIVEN option structure" };

  if (/agree with the (views|claims)|YES\s*(?:\/|,|\bor\b)\s*NO/i.test(text))
    return { type: "yes-no-not-given", confidence: "high", reason: "writer views/claims judgement" };
  if (/agree with the information|TRUE\s*(?:\/|,|\bor\b)\s*FALSE/i.test(text))
    return { type: "true-false-not-given", confidence: "high", reason: "factual judgement" };
  if (/correct heading|list of headings/i.test(text))
    return { type: "matching-headings", confidence: "high", reason: "shared heading bank" };
  if (/which (?:paragraph|section).*contains|contains the following information/i.test(text))
    return { type: "matching-information", confidence: "high", reason: "paragraph/section lookup" };
  if (/complete each sentence.*(?:ending|list)|sentence endings/i.test(text))
    return { type: "matching-endings", confidence: "high", reason: "shared sentence-ending bank" };
  if (/complete the summary.*(?:list|box)|summary.*(?:A[–-][A-Z]|list of)/i.test(text))
    return { type: "summary-completion", confidence: "high", reason: "summary with option bank" };
  if (/(?:label|complete)\s+(?:the\s+)?(?:map|plan|diagram|flow-?chart)|(?:map|plan|diagram|flow-?chart)\s+below/i.test(text))
    return { type: "map-diagram-label", confidence: "medium", reason: "visual labelling wording" };
  if (/choose\s+(?:the\s+)?(?:two|three|four|five|2|3|4|5)\b|which\s+(?:two|three|four|five)\b/i.test(text))
    return { type: "multiple-choice-many", confidence: "high", reason: "explicit multi-answer limit" };
  if (/classify the following|match each|list of (?:people|researchers|organisations|organizations|options)|according to whether/i.test(text) && options.length > 0)
    return { type: "matching-features", confidence: "high", reason: "shared feature/category bank" };
  if (/complete (?:the )?(?:notes|table|sentences|flow-?chart)|write (?:no more than|one|two|three) word/i.test(text) && options.length === 0)
    return { type: "gap-fill", confidence: "high", reason: "free-text completion" };
  if (question.type === "summary-completion" || question.type === "matching-features" || question.type === "matching-information" || question.type === "matching-endings" || question.type === "matching-headings")
    return { type: question.type, confidence: "medium", reason: "stored structured matching type" };
  if (question.type === "gap-fill" || options.length === 0)
    return { type: "gap-fill", confidence: "medium", reason: "free-text structure" };
  if (options.length >= 2)
    return { type: "multiple-choice", confidence: "medium", reason: "single fixed option set" };

  return { type: question.type, confidence: "low", reason: "insufficient semantic/structural evidence" };
}

export function normalizeReadingQuestion(question: Question): Question {
  const detected = detectReadingQuestionType(question);
  return {
    ...question,
    type: detected.type,
    needsReview: detected.confidence === "low" || undefined,
  } as Question;
}

export function questionRangeLabel(questions: Question[]): string {
  const numbers = questions.map((q) => q.number);
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `Question ${first}` : `Questions ${first}–${last}`;
}

export function groupReadingQuestions(questions: Question[]): Question[][] {
  const groups: Question[][] = [];
  let activeInstruction: string | undefined;
  let activeRange: { from: number; to: number } | undefined;
  let activeType: QuestionType | undefined;

  for (const question of questions.map(normalizeReadingQuestion)) {
    const detected = detectReadingQuestionType(question);
    const rangeMatch = (question.group ?? "").match(/Questions?\s+(\d+)\s*(?:[–-]|and|&)\s*(\d+)/i);
    if (rangeMatch) {
      activeInstruction = question.group;
      activeRange = { from: Number(rangeMatch[1]), to: Number(rangeMatch[2]) };
      activeType = detected.type;
    }

    const previous = groups.at(-1);
    const prevQuestion = previous?.[0];
    const isContinuation =
      !rangeMatch &&
      previous &&
      prevQuestion &&
      activeInstruction &&
      activeRange &&
      activeType === detected.type &&
      question.number >= activeRange.from &&
      question.number <= activeRange.to;

    if (isContinuation) previous.push({ ...question, group: activeInstruction });
    else groups.push([question]);
  }
  return groups;
}

export function cleanGroupInstruction(group: string | undefined, questions: Question[]): string {
  if (!group) return "";
  const questionPrompts = new Set(questions.map((q) => q.prompt.trim()));
  const seen = new Set<string>();
  return group
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Questions?\s+\d+/i.test(line))
    .filter((line) => !questionPrompts.has(line))
    .filter((line) => {
      const key = line.toLowerCase().replace(/[.\s]+$/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

export function multiAnswerLimit(questions: Question[]): number {
  const text = questions.map(textOf).join(" ");
  const word = text.match(/(?:choose|which)\s+(?:the\s+)?(two|three|four|five|2|3|4|5)\b/i)?.[1]?.toLowerCase();
  const parsed = ({ two: 2, three: 3, four: 4, five: 5 } as Record<string, number>)[word ?? ""] ?? Number(word);
  return parsed || questions.length;
}
