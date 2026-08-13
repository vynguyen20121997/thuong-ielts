/**
 * Practice / "Kiểm tra kiến thức IELTS" — domain layer.
 *
 * Pure types only: no React, no fetch, no `pg`. Everything else in the feature
 * (server repository, API routes, hooks, UI) depends on this file; this file
 * depends on nothing. That is the whole point of the layering — the rules of
 * the exam never change because the storage or the screen changed.
 *
 * Key design decision — the answer key is a SEPARATE type from the test.
 * `ReadingTest` is what we are willing to send to a browser. `ReadingAnswerKey`
 * never leaves the server. Because they are different types stored in different
 * columns, leaking answers requires deliberately writing a new query, rather
 * than merely forgetting to `delete question.answer` somewhere.
 */

export type SkillId = "reading" | "listening" | "writing" | "speaking";

export type SkillStatus = "available" | "coming-soon";

export interface PracticeSkill {
  id: SkillId;
  name: string;
  /** Vietnamese label shown to students. */
  label: string;
  description: string;
  href: string;
  status: SkillStatus;
  /** Rough number of published exercises, for the card subtitle. */
  hint: string;
}

export type ReadingLevel = "easy" | "medium" | "hard";

export type QuestionType =
  | "multiple-choice"
  | "true-false-not-given"
  | "yes-no-not-given"
  | "matching-headings"
  /** "Complete each sentence with the correct ending, A-G." */
  | "matching-endings"
  /** "Which paragraph contains the following information?" — answer is a paragraph letter. */
  | "matching-information"
  /** "Match each statement with the correct person, A-E." */
  | "matching-features"
  /** "Complete the summary using the list of words, A-L, below." */
  | "summary-completion"
  | "gap-fill";

interface QuestionBase {
  id: string;
  /** 1-based position shown to the student ("Question 7"). */
  number: number;
  type: QuestionType;
  prompt: string;
  /** Optional group heading rendered above the first question of a block. */
  group?: string;
}

/** Any question answered by picking one of a fixed list of options. */
export interface ChoiceQuestion extends QuestionBase {
  type: Exclude<QuestionType, "gap-fill">;
  options: string[];
}

/** Free-text question ("NO MORE THAN TWO WORDS FROM THE PASSAGE"). */
export interface GapFillQuestion extends QuestionBase {
  type: "gap-fill";
  maxWords: number;
}

export type Question = ChoiceQuestion | GapFillQuestion;

export function isChoiceQuestion(q: Question): q is ChoiceQuestion {
  return q.type !== "gap-fill";
}

export interface PassageParagraph {
  /** Paragraph marker used by matching-headings tasks ("A", "B", ...). */
  label?: string;
  text: string;
}

export interface ReadingPassage {
  title: string;
  /** Short italic lead-in printed above the passage, as in the real exam. */
  intro?: string;
  paragraphs: PassageParagraph[];
}

/** Row shown in the catalog grid. Deliberately excludes passage + questions. */
export interface ReadingTestSummary {
  id: string;
  slug: string;
  title: string;
  /** Source collection, e.g. "Cambridge Style Vol 1" — drives the filter chips. */
  collection: string;
  topic: string;
  level: ReadingLevel;
  durationSeconds: number;
  questionCount: number;
  attemptCount: number;
  isFree: boolean;
  coverImageUrl?: string;
  /** ISO date string; used only for the "Mới nhất" sort. */
  publishedAt: string;
}

/** Everything the player needs — and nothing more. No answers here. */
export interface ReadingTest extends ReadingTestSummary {
  passage: ReadingPassage;
  questions: Question[];
}

/** Server-only. Stored in its own column and never selected by public queries. */
export interface AnswerKeyEntry {
  questionId: string;
  answer: string;
  /** Alternative spellings/forms accepted as correct. */
  acceptable?: string[];
  explanation?: string;
}

export type ReadingAnswerKey = AnswerKeyEntry[];

/** questionId -> raw student input. */
export type ReadingAnswers = Record<string, string>;

export interface GradedQuestion {
  questionId: string;
  number: number;
  given: string;
  expected: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ReadingResult {
  total: number;
  correct: number;
  /** 0..1 */
  accuracy: number;
  /** Estimated IELTS band, scaled to the 40-question academic table. */
  band: number;
  /** Seconds actually spent, as reported by the client. */
  elapsedSeconds: number;
  items: GradedQuestion[];
}
