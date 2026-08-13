"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_CATALOG_QUERY,
  collectionsOf,
  queryCatalog,
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
  const visible = useMemo(() => queryCatalog(tests, query), [tests, query]);

  const setCollection = useCallback(
    (collection: string) => setQuery((q) => ({ ...q, collection })),
    []
  );
  const setLevel = useCallback(
    (level: ReadingLevel | null) => setQuery((q) => ({ ...q, level })),
    []
  );
  const setSearch = useCallback((search: string) => setQuery((q) => ({ ...q, search })), []);
  const setSort = useCallback(
    (sort: CatalogQuery["sort"]) => setQuery((q) => ({ ...q, sort })),
    []
  );
  const reset = useCallback(() => setQuery(DEFAULT_CATALOG_QUERY), []);

  return {
    query,
    collections,
    visible,
    total: tests.length,
    setCollection,
    setLevel,
    setSearch,
    setSort,
    reset,
  };
}
