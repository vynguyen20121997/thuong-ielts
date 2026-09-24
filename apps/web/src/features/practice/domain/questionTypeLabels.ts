import type { QuestionType } from "./types";

const LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Multiple Choice",
  "multiple-choice-many": "Multiple Choice (Many Answers)",
  "true-false-not-given": "True - False - Not Given",
  "yes-no-not-given": "Yes - No - Not Given",
  "matching-headings": "Matching Headings",
  "matching-endings": "Matching Endings",
  "matching-information": "Matching Information",
  "matching-features": "Matching Features",
  "summary-completion": "Summary Completion",
  "map-diagram-label": "Map / Diagram Label",
  "gap-fill": "Gap Filling",
};

export function questionTypeLabel(type: QuestionType): string {
  return LABELS[type];
}
