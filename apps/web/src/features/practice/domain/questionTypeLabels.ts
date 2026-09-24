import type { QuestionType } from "./types";

const LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Multiple Choice",
  "true-false-not-given": "True - False - Not Given",
  "yes-no-not-given": "Yes - No - Not Given",
  "matching-headings": "Matching Headings",
  "matching-endings": "Matching Endings",
  "matching-information": "Matching Information",
  "matching-features": "Matching Features",
  "summary-completion": "Summary Completion",
  "gap-fill": "Gap Filling",
};

export function questionTypeLabel(type: QuestionType): string {
  return LABELS[type];
}
