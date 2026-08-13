"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { useReadingCatalog } from "../application/useReadingCatalog";
import { LEVEL_LABELS, type CatalogSort } from "../domain/catalog";
import type { ReadingLevel, ReadingTestSummary } from "../domain/types";
import ReadingTestCard from "./ReadingTestCard";

/**
 * The interactive shell around the catalog grid. All state lives in
 * `useReadingCatalog`; this component only maps that state onto controls.
 */

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "default", label: "Mặc định" },
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Nhiều lượt làm" },
];

const LEVELS: ReadingLevel[] = ["easy", "medium", "hard"];

export default function ReadingCatalog({ tests }: { tests: ReadingTestSummary[] }) {
  const { query, collections, visible, total, setCollection, setLevel, setSearch, setSort, reset } =
    useReadingCatalog(tests);

  const chipClass = (active: boolean) =>
    `px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest font-bold border transition-colors cursor-pointer whitespace-nowrap ${
      active
        ? "bg-[#14532D] text-white border-[#14532D]"
        : "bg-white text-[#1A1A1A]/60 border-black/10 hover:border-[#14532D]/40 hover:text-[#14532D]"
    }`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
          <button type="button" onClick={() => setCollection("")} className={chipClass(!query.collection)}>
            Tất cả
          </button>
          {collections.map((collection) => (
            <button
              key={collection}
              type="button"
              onClick={() => setCollection(collection)}
              className={chipClass(query.collection === collection)}
            >
              {collection}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 lg:ml-auto">
          <div className="relative flex-1 lg:flex-none lg:w-56">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/35 pointer-events-none"
            />
            <input
              type="search"
              value={query.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên đề, chủ đề..."
              aria-label="Tìm đề đọc"
              className="w-full bg-white border border-black/10 rounded-full pl-9 pr-4 py-2.5 text-xs text-[#1A1A1A] placeholder:text-[#1A1A1A]/35 focus:outline-none focus:border-[#14532D]/50 transition-colors"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={13}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/35 pointer-events-none"
            />
            <select
              value={query.sort}
              onChange={(e) => setSort(e.target.value as CatalogSort)}
              aria-label="Sắp xếp"
              className="appearance-none bg-white border border-black/10 rounded-full pl-9 pr-8 py-2.5 font-mono text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/70 focus:outline-none focus:border-[#14532D]/50 cursor-pointer transition-colors"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Level filter + count */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 font-bold mr-1">
          Độ khó
        </span>
        <button type="button" onClick={() => setLevel(null)} className={chipClass(query.level === null)}>
          Tất cả
        </button>
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setLevel(level)}
            className={chipClass(query.level === level)}
          >
            {LEVEL_LABELS[level]}
          </button>
        ))}

        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 font-bold">
          {visible.length}/{total} đề
        </span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/10 rounded-2xl">
          <p className="text-sm text-[#1A1A1A]/55">Không tìm thấy đề nào khớp bộ lọc.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 font-mono text-[10px] uppercase tracking-widest font-bold text-[#14532D] hover:underline cursor-pointer"
          >
            Xoá bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((test, index) => (
            <ReadingTestCard key={test.id} test={test} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
