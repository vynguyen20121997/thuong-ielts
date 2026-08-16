import { passageLabelFromTitle, passageNumberFromTitle, testLabelFromTitle } from "./paper";
import type { ReadingLevel, ReadingTestSummary } from "./types";

/**
 * Catalog querying rules — pure, so the "which tests show up" logic can be
 * unit-tested and reused (e.g. by a future server-rendered filtered URL)
 * without dragging React state along.
 */

export type CatalogSort = "default" | "newest" | "popular";

export interface CatalogQuery {
  /** "" means every collection. */
  collection: string;
  /** null means every level. */
  level: ReadingLevel | null;
  /** "" means every topic. Khớp theo kiểu "chứa" — xem `topicsOf`. */
  topic: string;
  search: string;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  collection: "",
  level: null,
  topic: "",
  search: "",
  sort: "default",
};

export const LEVEL_LABELS: Record<ReadingLevel, string> = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
};

/** Distinct collections in publication order, for the filter chips. */
export function collectionsOf(tests: ReadingTestSummary[]): string[] {
  return Array.from(new Set(tests.map((t) => t.collection).filter(Boolean)));
}

/* ------------------------------------------------------------------ *
 * Chủ đề
 *
 * Cột `topic` là chuỗi ghép tay: "Khảo cổ - Lịch sử", "Sinh học tiến hoá".
 * Đo trên cả 99 dòng: 85 chuỗi khác nhau — lọc theo nguyên chuỗi thì mỗi
 * nhãn gần như chỉ ra một đề, vô dụng. Nên tách theo dấu "-" (dấu ngăn duy
 * nhất có trong dữ liệu) rồi đếm theo kiểu "chứa": đề mang chủ đề
 * "Sinh học tiến hoá" cũng nằm dưới nhãn "Sinh học".
 *
 * Ngưỡng 3 lần trở lên cho 22 nhãn, phủ 89/99 passage. Mười đề còn lại mang
 * chủ đề quá lẻ (Âm nhạc - Não bộ, Quản trị nhân sự…) — tìm bằng ô tìm kiếm,
 * không đáng thêm một nhãn chỉ dùng một lần vào cột lọc.
 * ------------------------------------------------------------------ */

const MIN_TOPIC_USES = 3;

/** Bỏ dấu hoa/thường và chuẩn hoá tổ hợp dấu, để so khớp tiếng Việt cho chắc. */
function normalizeTopic(value: string): string {
  return value.toLowerCase().normalize("NFC").trim();
}

/** Đề có mang nhãn chủ đề này không. */
export function hasTopic(test: ReadingTestSummary, label: string): boolean {
  return normalizeTopic(test.topic).includes(normalizeTopic(label));
}

export interface TopicFacet {
  label: string;
  /** Số passage mang nhãn này, đếm trước khi lọc. */
  count: number;
}

export function topicsOf(tests: ReadingTestSummary[]): TopicFacet[] {
  const candidates = new Set<string>();
  for (const test of tests) {
    for (const part of test.topic.split("-")) {
      const label = part.trim();
      if (label) candidates.add(label);
    }
  }

  const counted = Array.from(candidates, (label) => ({
    label,
    count: tests.filter((test) => hasTopic(test, label)).length,
  })).filter((facet) => facet.count >= MIN_TOPIC_USES);

  // "Sinh học tiến hoá" thừa khi "Sinh học" đã có mặt: nhãn hẹp hơn không thêm
  // đề nào mà chỉ làm dài danh sách.
  return counted
    .filter(
      (facet) =>
        !counted.some(
          (other) =>
            other.label !== facet.label &&
            normalizeTopic(facet.label).includes(normalizeTopic(other.label)),
        ),
    )
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
}

/**
 * Ô tìm kiếm tra cùng ba trường ở cả Reading lẫn Listening, nên luật ở chung
 * một chỗ — sửa một bên mà quên bên kia là kiểu lỗi im lặng khó thấy nhất.
 */
export function matchesText(
  test: { title: string; topic: string; collection: string },
  search: string,
): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return (
    test.title.toLowerCase().includes(term) ||
    test.topic.toLowerCase().includes(term) ||
    test.collection.toLowerCase().includes(term)
  );
}

function matches(test: ReadingTestSummary, query: CatalogQuery): boolean {
  if (query.collection && test.collection !== query.collection) return false;
  if (query.level && test.level !== query.level) return false;
  if (query.topic && !hasTopic(test, query.topic)) return false;

  return matchesText(test, query.search);
}

/** Dùng chung cho cả hai danh mục — chỉ đụng tới field cả hai đều có. */
export const SHARED_SORTERS: Record<
  CatalogSort,
  (
    a: { publishedAt: string; attemptCount: number },
    b: { publishedAt: string; attemptCount: number },
  ) => number
> = {
  // "Mặc định" keeps whatever order the repository returned (sort_order).
  default: () => 0,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  popular: (a, b) => b.attemptCount - a.attemptCount,
};

const SORTERS = SHARED_SORTERS;

export function queryCatalog(
  tests: ReadingTestSummary[],
  query: CatalogQuery,
): ReadingTestSummary[] {
  return tests.filter((test) => matches(test, query)).sort(SORTERS[query.sort]);
}

/* ------------------------------------------------------------------ *
 * Gom passage thành test
 *
 * DB lưu mỗi passage một dòng (99 dòng = 33 test × 3 passage), nhưng học
 * sinh nghĩ theo đơn vị "Cam 10 · Test 1". Quan hệ test↔passage không có
 * trong schema, nên phải suy ra từ slug — đây là chỗ duy nhất làm việc đó.
 *
 * Slug nào không khớp `cam<số>-test<số>-` thì thành một nhóm một passage,
 * vẫn hiện ra bình thường. Thà thừa một thẻ còn hơn nuốt mất một đề.
 * ------------------------------------------------------------------ */

const TEST_SLUG = /^(cam\d+)-(test\d+)-/i;

export interface TestGroup {
  /** "cam10-test1", hoặc "single:<slug>" khi slug không theo quy ước. */
  id: string;
  /** "Cam 10 · Test 1" */
  label: string;
  collection: string;
  /** Đã sắp theo số passage. */
  passages: ReadingTestSummary[];
  /** Số passage của test khi chưa lọc — để biết thẻ đang hiện thiếu hay đủ. */
  fullPassageCount: number;
  /** Cộng dồn từ các passage đang hiện — không phải từ cả test trong DB. */
  questionCount: number;
  durationSeconds: number;
  attemptCount: number;
  /** Các mức độ có mặt, theo thứ tự dễ → khó. */
  levels: ReadingLevel[];
  isFree: boolean;
  /** Vị trí xuất hiện đầu tiên, giữ cho sort "Mặc định". */
  order: number;
  /** Ngày đăng muộn nhất trong nhóm. */
  publishedAt: string;
}

function testKeyOf(test: ReadingTestSummary): string | null {
  const match = TEST_SLUG.exec(test.slug);
  return match ? `${match[1].toLowerCase()}-${match[2].toLowerCase()}` : null;
}

function groupLabelOf(test: ReadingTestSummary, key: string): string {
  const fromTitle = testLabelFromTitle(test.title);
  if (fromTitle !== test.title) return fromTitle;

  const parts = /^cam(\d+)-test(\d+)$/.exec(key);
  return parts ? `Cam ${parts[1]} · Test ${parts[2]}` : test.title;
}

export function passageLabelOf(test: ReadingTestSummary): string {
  return passageLabelFromTitle(test.title);
}

const LEVEL_ORDER: ReadingLevel[] = ["easy", "medium", "hard"];

export function groupByTest(tests: ReadingTestSummary[]): TestGroup[] {
  const groups = new Map<string, ReadingTestSummary[]>();
  const order = new Map<string, number>();

  tests.forEach((test, index) => {
    const key = testKeyOf(test) ?? `single:${test.slug}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(test);
    } else {
      groups.set(key, [test]);
      order.set(key, index);
    }
  });

  return Array.from(groups, ([id, bucket]) => {
    const passages = [...bucket].sort(
      (a, b) => passageNumberFromTitle(a.title) - passageNumberFromTitle(b.title),
    );
    const first = passages[0];

    return {
      id,
      label: groupLabelOf(first, id),
      collection: first.collection,
      passages,
      fullPassageCount: passages.length,
      questionCount: passages.reduce((sum, p) => sum + p.questionCount, 0),
      durationSeconds: passages.reduce((sum, p) => sum + p.durationSeconds, 0),
      attemptCount: passages.reduce((sum, p) => sum + p.attemptCount, 0),
      levels: LEVEL_ORDER.filter((level) => passages.some((p) => p.level === level)),
      isFree: passages.every((p) => p.isFree),
      order: order.get(id) ?? 0,
      publishedAt: passages.reduce(
        (latest, p) => (p.publishedAt > latest ? p.publishedAt : latest),
        "",
      ),
    };
  });
}

const GROUP_SORTERS: Record<CatalogSort, (a: TestGroup, b: TestGroup) => number> = {
  default: (a, b) => a.order - b.order,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  popular: (a, b) => b.attemptCount - a.attemptCount,
};

/**
 * Lọc theo passage rồi mới gom: một test bị lọc mất hai passage vẫn hiện,
 * nhưng chỉ hiện passage còn khớp — và các con số trên thẻ cộng lại từ đúng
 * những passage đó, không phải từ cả test.
 */
export function queryCatalogGroups(tests: ReadingTestSummary[], query: CatalogQuery): TestGroup[] {
  // Kích thước thật của mỗi test, đo trước khi lọc — nhờ vậy thẻ biết mình
  // đang hiện đủ ba passage hay chỉ còn phần khớp bộ lọc.
  const fullSize = new Map(groupByTest(tests).map((group) => [group.id, group.passages.length]));

  return groupByTest(queryCatalog(tests, query))
    .map((group) => ({
      ...group,
      fullPassageCount: fullSize.get(group.id) ?? group.passages.length,
    }))
    .sort(GROUP_SORTERS[query.sort]);
}

/** 12480 -> "12.480" (Vietnamese thousands separator). */
export function formatAttempts(count: number): string {
  return new Intl.NumberFormat("vi-VN").format(count);
}
