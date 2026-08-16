"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_CATALOG_QUERY,
  collectionsOf,
  groupByTest,
  queryCatalogGroups,
  topicsOf,
  type CatalogQuery,
} from "../domain/catalog";
import type { ReadingLevel, ReadingTestSummary } from "../domain/types";

/**
 * Holds the filter/sort state for the catalog grid and delegates the actual
 * filtering to the pure `queryCatalog`. The hook owns *when* things change;
 * the domain owns *what* the result is.
 *
 * The list itself is passed in (server-rendered on first paint) rather than
 * fetched here — the catalog is SEO-relevant, so it must exist in the HTML.
 */
export function useReadingCatalog(tests: ReadingTestSummary[]) {
  const [query, setQuery] = useState<CatalogQuery>(DEFAULT_CATALOG_QUERY);

  const collections = useMemo(() => collectionsOf(tests), [tests]);
  // Số test của mỗi bộ đề, đếm trước khi lọc — cột lọc bày sẵn con số này để
  // học sinh biết bấm vào sẽ còn lại bao nhiêu, khỏi bấm thử từng cái.
  const collectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groupByTest(tests)) {
      counts.set(group.collection, (counts.get(group.collection) ?? 0) + 1);
    }
    return counts;
  }, [tests]);
  const topics = useMemo(() => topicsOf(tests), [tests]);
  // Đơn vị hiển thị là test, không phải passage — xem `groupByTest`.
  const groups = useMemo(() => queryCatalogGroups(tests, query), [tests, query]);
  const totalGroups = useMemo(() => groupByTest(tests).length, [tests]);

  const setCollection = useCallback(
    (collection: string) => setQuery((q) => ({ ...q, collection })),
    [],
  );
  const setLevel = useCallback(
    (level: ReadingLevel | null) => setQuery((q) => ({ ...q, level })),
    [],
  );
  const setTopic = useCallback((topic: string) => setQuery((q) => ({ ...q, topic })), []);
  const setSearch = useCallback((search: string) => setQuery((q) => ({ ...q, search })), []);
  const setSort = useCallback(
    (sort: CatalogQuery["sort"]) => setQuery((q) => ({ ...q, sort })),
    [],
  );
  const reset = useCallback(() => setQuery(DEFAULT_CATALOG_QUERY), []);

  return {
    query,
    collections,
    collectionCounts,
    topics,
    groups,
    totalGroups,
    /** Số passage đang khớp bộ lọc — dùng cho dòng tóm tắt. */
    visibleCount: groups.reduce((sum, group) => sum + group.passages.length, 0),
    total: tests.length,
    setCollection,
    setLevel,
    setTopic,
    setSearch,
    setSort,
    reset,
  };
}
