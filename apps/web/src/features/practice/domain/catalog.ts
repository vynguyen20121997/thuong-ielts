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
  search: string;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  collection: "",
  level: null,
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

function matches(test: ReadingTestSummary, query: CatalogQuery): boolean {
  if (query.collection && test.collection !== query.collection) return false;
  if (query.level && test.level !== query.level) return false;

  const term = query.search.trim().toLowerCase();
  if (!term) return true;

  return (
    test.title.toLowerCase().includes(term) ||
    test.topic.toLowerCase().includes(term) ||
    test.collection.toLowerCase().includes(term)
  );
}

const SORTERS: Record<CatalogSort, (a: ReadingTestSummary, b: ReadingTestSummary) => number> = {
  // "Mặc định" keeps whatever order the repository returned (sort_order).
  default: () => 0,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  popular: (a, b) => b.attemptCount - a.attemptCount,
};

export function queryCatalog(
  tests: ReadingTestSummary[],
  query: CatalogQuery
): ReadingTestSummary[] {
  return tests.filter((test) => matches(test, query)).sort(SORTERS[query.sort]);
}

/** 12480 -> "12.480" (Vietnamese thousands separator). */
export function formatAttempts(count: number): string {
  return new Intl.NumberFormat("vi-VN").format(count);
}
