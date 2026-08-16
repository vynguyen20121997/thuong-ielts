"use client";

import { useCallback, useMemo, useState } from "react";

import { collectionsOf } from "../domain/catalog";
import {
  DEFAULT_LISTENING_QUERY,
  groupByBook,
  isFullTest,
  queryListeningGroups,
  type ListeningQuery,
} from "../domain/listeningCatalog";
import type { ListeningTestSummary } from "../domain/types";

/**
 * Song song với `useReadingCatalog`: hook giữ *khi nào* trạng thái đổi, domain
 * giữ *kết quả là gì*. Danh sách vẫn do server truyền xuống (SEO), không fetch.
 */
export function useListeningCatalog(tests: ListeningTestSummary[]) {
  const [query, setQuery] = useState<ListeningQuery>(DEFAULT_LISTENING_QUERY);

  const collections = useMemo(() => collectionsOf(tests), [tests]);
  const collectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const test of tests) {
      counts.set(test.collection, (counts.get(test.collection) ?? 0) + 1);
    }
    return counts;
  }, [tests]);

  /** Bao nhiêu đề đủ 4 phần, bao nhiêu đề thiếu — đếm trước khi lọc. */
  const coverageCounts = useMemo(() => {
    const full = tests.filter(isFullTest).length;
    return { all: tests.length, full, partial: tests.length - full };
  }, [tests]);

  // Đơn vị hiển thị là bộ đề, không phải từng test — xem `groupByBook`.
  const groups = useMemo(() => queryListeningGroups(tests, query), [tests, query]);
  const totalBooks = useMemo(() => groupByBook(tests).length, [tests]);

  const setCollection = useCallback(
    (collection: string) => setQuery((q) => ({ ...q, collection })),
    [],
  );
  const setCoverage = useCallback(
    (coverage: ListeningQuery["coverage"]) => setQuery((q) => ({ ...q, coverage })),
    [],
  );
  const setSearch = useCallback((search: string) => setQuery((q) => ({ ...q, search })), []);
  const setSort = useCallback(
    (sort: ListeningQuery["sort"]) => setQuery((q) => ({ ...q, sort })),
    [],
  );
  const reset = useCallback(() => setQuery(DEFAULT_LISTENING_QUERY), []);

  return {
    query,
    collections,
    collectionCounts,
    coverageCounts,
    groups,
    totalBooks,
    /** Số đề đang khớp bộ lọc, cộng qua các bộ. */
    visibleCount: groups.reduce((sum, group) => sum + group.tests.length, 0),
    total: tests.length,
    setCollection,
    setCoverage,
    setSearch,
    setSort,
    reset,
  };
}
