import type { Question, ReadingPaper, ReadingTest } from "./types";

/**
 * Quy tắc của một lượt thi, tách khỏi React và khỏi SQL.
 *
 * Chỉ có một chỗ trong cả feature biết cách nối tiêu đề "Cam 10 · Test 1 ·
 * Passage 1: Stepwells" lại và cắt ra: ở đây. Importer sinh tiêu đề theo mẫu
 * đó, catalog và màn thi đều đọc lại từ đây, nên đổi mẫu chỉ phải sửa một nơi.
 */

const PASSAGE_IN_TITLE = " · Passage";

/** "Cam 10 · Test 1 · Passage 1: Stepwells" -> "Cam 10 · Test 1" */
export function testLabelFromTitle(title: string): string {
  const cut = title.indexOf(PASSAGE_IN_TITLE);
  return cut > 0 ? title.slice(0, cut).trim() : title;
}

/** "Cam 10 · Test 1 · Passage 1: Stepwells" -> "Passage 1: Stepwells" */
export function passageLabelFromTitle(title: string): string {
  const cut = title.indexOf(PASSAGE_IN_TITLE);
  return cut === -1 ? title : title.slice(cut + 3).trim();
}

/** Số passage đọc từ tiêu đề; không có thì coi như đứng cuối. */
export function passageNumberFromTitle(title: string): number {
  const match = /Passage\s+(\d+)/i.exec(title);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

/** Một passage lẻ cũng là một lượt thi — chỉ là lượt thi có đúng một phần. */
export function paperFromTest(test: ReadingTest): ReadingPaper {
  return {
    id: test.slug,
    mode: "passage",
    title: test.title,
    collection: test.collection,
    level: test.level,
    durationSeconds: test.durationSeconds,
    sections: [
      {
        slug: test.slug,
        label: passageLabelFromTitle(test.title),
        passage: test.passage,
        questions: test.questions,
      },
    ],
  };
}

/** Toàn bộ câu hỏi của lượt thi, đúng thứ tự làm bài. */
export function allQuestionsOf(paper: ReadingPaper): Question[] {
  return paper.sections.flatMap((section) => section.questions);
}

/**
 * "1–40". Đề Cambridge giữ nguyên số câu gốc khi tách theo passage (14–26,
 * 27–40), nên khoảng số phải đọc từ dữ liệu chứ không đếm từ 1.
 */
export function questionRangeOf(questions: Question[]): string {
  if (questions.length === 0) return "";
  return `${questions[0].number}-${questions[questions.length - 1].number}`;
}
