import { type CatalogSort, SHARED_SORTERS, matchesText } from "./catalog";
import type { ListeningTestSummary } from "./types";

/**
 * Quy tắc lọc danh mục đề nghe. Tách khỏi `catalog.ts` của Reading vì hai bên
 * lọc theo những thứ khác nhau — và sự khác nhau đó đến từ dữ liệu thật:
 *
 * - **Không lọc theo độ khó.** Cả 31 đề nghe đều là `medium`. Một bộ lọc chỉ
 *   có một lựa chọn thì chỉ tổ chiếm chỗ.
 * - **Không lọc theo chủ đề.** Cột `topic` bên Listening không phải chủ đề mà
 *   là tên nội dung bốn phần ("Self-drive tours · Leisure club · …"), gần như
 *   mỗi đề một chuỗi riêng. Nó vẫn tra được bằng ô tìm kiếm.
 * - **Có lọc theo số phần**, thứ Reading không có: 7 đề chỉ có một phần vì
 *   nguồn thiếu audio, và học sinh cần biết trước.
 */

const FULL_TEST_SECTIONS = 4;

export interface ListeningQuery {
  /** "" là mọi bộ đề. */
  collection: string;
  /** "all" | "full" (đủ 4 phần) | "partial" (thiếu phần). */
  coverage: "all" | "full" | "partial";
  search: string;
  sort: CatalogSort;
}

export const DEFAULT_LISTENING_QUERY: ListeningQuery = {
  collection: "",
  coverage: "all",
  search: "",
  sort: "default",
};

export const COVERAGE_LABELS: Record<ListeningQuery["coverage"], string> = {
  all: "Tất cả",
  full: "Đủ 4 phần",
  partial: "Thiếu phần",
};

/** Đề có đủ bốn phần câu hỏi hay không. */
export function isFullTest(test: ListeningTestSummary): boolean {
  return test.sections.length >= FULL_TEST_SECTIONS;
}

/**
 * Câu cảnh báo hiện trên thẻ và ở màn chờ — một nguồn duy nhất, để hai chỗ
 * không nói khác nhau.
 *
 * Ưu tiên `note` do người nhập viết (nói rõ thiếu vì sao), nhưng không tin nó
 * một mình: 2/31 đề thiếu phần mà cột `note` để trống, nên khi thiếu phần thì
 * vẫn phải nói, dù nguồn không ghi gì.
 */
export function coverageNoteOf(test: ListeningTestSummary): string | undefined {
  if (test.note) return test.note;
  if (isFullTest(test)) return undefined;
  return `Đề này chỉ có phần ${test.sections.join(", ")} — nguồn thiếu audio.`;
}

/**
 * "Self-drive tours · Leisure club · …" -> từng nội dung một.
 *
 * Cố ý KHÔNG ghép nội dung thứ i với phần thứ i: đo trên cả 31 đề thì có một
 * đề (`cam18-listening-test2`) ghi 4 nội dung nhưng chỉ có câu hỏi ở phần
 * 1, 3, 4 — ghép theo thứ tự sẽ gán nhầm tên cho phần 3 và 4.
 */
export function subjectsOf(topic: string): string[] {
  return topic
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
}

function matches(test: ListeningTestSummary, query: ListeningQuery): boolean {
  if (query.collection && test.collection !== query.collection) return false;
  if (query.coverage === "full" && !isFullTest(test)) return false;
  if (query.coverage === "partial" && isFullTest(test)) return false;

  return matchesText(test, query.search);
}

export function queryListeningCatalog(
  tests: ListeningTestSummary[],
  query: ListeningQuery,
): ListeningTestSummary[] {
  return tests.filter((test) => matches(test, query)).sort(SHARED_SORTERS[query.sort]);
}

/* ------------------------------------------------------------------ *
 * Gom test thành bộ đề
 *
 * Cùng ý với `groupByTest` bên Reading, nhưng lệch một tầng — và lệch vì
 * dữ liệu chứ không phải vì tuỳ hứng:
 *
 *   Reading:   bộ đề > test > **passage**  (DB lưu mỗi passage một dòng,
 *              nên phải gộp 3 dòng lại thành một test)
 *   Listening: bộ đề > **test**            (DB đã lưu cả test một dòng,
 *              nên tầng cần gộp là 4 test thành một bộ Cam)
 *
 * Kết quả: cả hai danh mục đều bày một lưới thẻ "cha", mở ra chọn "con".
 * ------------------------------------------------------------------ */

export interface ListeningBookGroup {
  /** Khoá gom, lấy theo cột `collection`: "Cambridge IELTS 12". */
  id: string;
  /** Chữ in trên bìa thẻ, lấy từ tiêu đề đề: "Cam 12". */
  label: string;
  /** Tên đầy đủ của bộ, in nhỏ ở trên: "Cambridge IELTS 12". */
  collection: string;
  /** Đã sắp theo số test. */
  tests: ListeningTestSummary[];
  /** Số test của bộ khi chưa lọc — để biết thẻ đang hiện đủ hay thiếu. */
  fullTestCount: number;
  questionCount: number;
  durationSeconds: number;
  attemptCount: number;
  /** Số đề trong bộ không đủ 4 phần. */
  partialCount: number;
  order: number;
  publishedAt: string;
}

/** "cam12-listening-test3" -> 3; không đọc được thì xếp cuối. */
function testNumberOf(test: ListeningTestSummary): number {
  const match = /test(\d+)/i.exec(test.slug);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

/** "Cam 12 · Listening Test 1" -> "Cam 12"; -> "Listening Test 1" */
export function bookLabelFromTitle(title: string): string {
  const cut = title.indexOf(" · ");
  return cut > 0 ? title.slice(0, cut).trim() : title;
}

export function testLabelFromTitle(title: string): string {
  const cut = title.indexOf(" · ");
  return cut === -1 ? title : title.slice(cut + 3).trim();
}

export function groupByBook(tests: ListeningTestSummary[]): ListeningBookGroup[] {
  const buckets = new Map<string, ListeningTestSummary[]>();
  const order = new Map<string, number>();

  tests.forEach((test, index) => {
    const key = test.collection || "Khác";
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(test);
    } else {
      buckets.set(key, [test]);
      order.set(key, index);
    }
  });

  return Array.from(buckets, ([id, bucket]) => {
    const sorted = [...bucket].sort((a, b) => testNumberOf(a) - testNumberOf(b));
    return {
      id,
      label: bookLabelFromTitle(sorted[0].title),
      collection: sorted[0].collection,
      tests: sorted,
      fullTestCount: sorted.length,
      questionCount: sorted.reduce((sum, t) => sum + t.questionCount, 0),
      durationSeconds: sorted.reduce((sum, t) => sum + t.durationSeconds, 0),
      attemptCount: sorted.reduce((sum, t) => sum + t.attemptCount, 0),
      partialCount: sorted.filter((t) => !isFullTest(t)).length,
      order: order.get(id) ?? 0,
      publishedAt: sorted.reduce((latest, t) => (t.publishedAt > latest ? t.publishedAt : latest), ""),
    };
  });
}

const GROUP_SORTERS: Record<
  CatalogSort,
  (a: ListeningBookGroup, b: ListeningBookGroup) => number
> = {
  default: (a, b) => a.order - b.order,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  popular: (a, b) => b.attemptCount - a.attemptCount,
};

/** Lọc theo từng đề rồi mới gom: bộ nào còn đề khớp thì bộ đó còn hiện. */
export function queryListeningGroups(
  tests: ListeningTestSummary[],
  query: ListeningQuery,
): ListeningBookGroup[] {
  const fullSize = new Map(groupByBook(tests).map((group) => [group.id, group.tests.length]));

  return groupByBook(queryListeningCatalog(tests, query))
    .map((group) => ({ ...group, fullTestCount: fullSize.get(group.id) ?? group.tests.length }))
    .sort(GROUP_SORTERS[query.sort]);
}
