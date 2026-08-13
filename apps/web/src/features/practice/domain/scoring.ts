import { bandFromScore } from "./bandScore";
import type {
  AnswerKeyEntry,
  GradedQuestion,
  Question,
  ReadingAnswers,
  ReadingResult,
} from "./types";

/**
 * Grading rules. Pure functions — same input, same output, no I/O.
 * This is the one place that decides whether an answer is right, which is why
 * it lives in `domain/` and is called from the API route rather than the other
 * way around.
 */

/**
 * IELTS marking is generous about surface form and strict about content:
 * case, surrounding punctuation and doubled spaces are ignored, and a leading
 * article is dropped ("a museum" === "museum"), because the answer sheet only
 * cares about the content word.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.,;:!?"'`’“”()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the)\s+/, "");
}

export function isAnswerCorrect(entry: AnswerKeyEntry, given: string): boolean {
  if (!given || !given.trim()) return false;
  const candidate = normalizeAnswer(given);
  if (!candidate) return false;
  const accepted = [entry.answer, ...(entry.acceptable ?? [])].map(normalizeAnswer);
  return accepted.includes(candidate);
}

/**
 * Grades a whole attempt.
 *
 * `questions` is passed in only to recover the display number and to guarantee
 * we grade exactly the questions the student was shown — an answer submitted
 * for a question that is not on the paper is ignored rather than counted.
 */
export function gradeReading(
  questions: Question[],
  key: AnswerKeyEntry[],
  answers: ReadingAnswers,
  elapsedSeconds: number
): ReadingResult {
  const keyById = new Map(key.map((entry) => [entry.questionId, entry]));

  const items: GradedQuestion[] = questions.map((question) => {
    const entry = keyById.get(question.id);
    const given = (answers[question.id] ?? "").trim();

    // A question with no key entry is a data bug, not a student mistake — we
    // surface it as incorrect-with-empty-expected instead of crashing the POST.
    if (!entry) {
      return {
        questionId: question.id,
        number: question.number,
        given,
        expected: "",
        isCorrect: false,
      };
    }

    return {
      questionId: question.id,
      number: question.number,
      given,
      expected: entry.answer,
      isCorrect: isAnswerCorrect(entry, given),
      explanation: entry.explanation,
    };
  });

  const total = items.length;
  const correct = items.filter((item) => item.isCorrect).length;

  return {
    total,
    correct,
    accuracy: total === 0 ? 0 : correct / total,
    band: bandFromScore(correct, total),
    elapsedSeconds: Math.max(0, Math.round(elapsedSeconds)),
    items,
  };
}

/** Number of questions the student has actually filled in. */
export function countAnswered(questions: Question[], answers: ReadingAnswers): number {
  return questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
}
