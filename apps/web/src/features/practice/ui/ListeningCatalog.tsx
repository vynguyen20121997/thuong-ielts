"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { useListeningCatalog } from "../application/useListeningCatalog";
import type { CatalogSort } from "../domain/catalog";
import { COVERAGE_LABELS, type ListeningQuery } from "../domain/listeningCatalog";
import type { ListeningTestSummary } from "../domain/types";
import ListeningBookCard from "./ListeningBookCard";

/**
 * Vỏ tương tác của danh mục đề nghe — cùng bố cục hai cột với Reading.
 *
 * Khác Reading ở hai mục lọc, và cả hai khác biệt đều do dữ liệu chứ không do
 * ý thích: không có "Độ khó" (cả 31 đề đều `medium`) và không có "Chủ đề"
 * (cột `topic` bên Listening là tên nội dung 4 phần, gần như mỗi đề một
 * chuỗi). Thay vào đó là "Số phần", thứ Reading không cần.
 */

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "default", label: "Mặc định" },
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Nhiều lượt làm" },
];

const COVERAGES: ListeningQuery["coverage"][] = ["all", "full", "partial"];

export default function ListeningCatalog({ tests }: { tests: ListeningTestSummary[] }) {
  const {
    query,
    collections,
    collectionCounts,
    coverageCounts,
    groups,
    totalBooks,
    visibleCount,
    total,
    setCollection,
    setCoverage,
    setSearch,
    setSort,
    reset,
  } = useListeningCatalog(tests);

  const [openOnMobile, setOpenOnMobile] = useState(false);

  const filtered = Boolean(query.collection || query.coverage !== "all" || query.search);

  const rowClass = (active: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-2xs font-medium text-left transition-colors cursor-pointer ${active ? "bg-brand text-white" : "text-ink/60 hover:bg-brand/[0.06] hover:text-brand"}`;

  const sectionLabel = "text-2xs text-ink/35 font-medium";

  return (
    <div className="grid lg:grid-cols-[248px_1fr] gap-6 lg:gap-8 items-start">
      <aside className="lg:sticky lg:top-28">
        <div className="flex items-center gap-3 lg:hidden mb-3">
          <button
            type="button"
            onClick={() => setOpenOnMobile((value) => !value)}
            aria-expanded={openOnMobile}
            aria-controls="listening-filters"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/10 bg-white text-2xs font-medium text-ink/70 cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            Bộ lọc
            {filtered && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
          </button>
          <span className="text-2xs text-ink/40 font-medium">
            {groups.length}/{totalBooks} bộ
          </span>
        </div>

        {/*
          Tiêu đề cột lọc. Ngoài việc gọi tên cột, nó chiếm đúng chiều cao của
          dòng đếm bên phải (cùng cỡ chữ, cùng `mb-4`), nên mép trên của khung
          lọc và mép trên của thẻ đầu tiên nằm trên một đường.
        */}
        <div className="hidden lg:flex items-center gap-2 h-5 mb-4">
          <SlidersHorizontal size={13} className="text-ink/35" />
          <span className="text-2xs font-medium text-ink/40">Bộ lọc</span>
        </div>

        <div
          id="listening-filters"
          className={`${openOnMobile ? "block" : "hidden"} lg:block bg-white border border-black/5 rounded-2xl shadow-sm p-4`}
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 pointer-events-none"
            />
            <input
              type="search"
              value={query.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên đề, nội dung..."
              aria-label="Tìm đề nghe"
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-full pl-9 pr-3 py-2.5 text-xs text-ink placeholder:text-ink/35 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>

          {/* Bộ đề */}
          <div className="mt-5">
            <span className={sectionLabel}>Bộ đề</span>
            <div className="mt-2 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setCollection("")}
                className={rowClass(!query.collection)}
              >
                <span className="flex-1">Tất cả</span>
                <span className="tabular-nums opacity-60">{total}</span>
              </button>
              {collections.map((collection) => (
                <button
                  key={collection}
                  type="button"
                  onClick={() => setCollection(collection)}
                  className={rowClass(query.collection === collection)}
                >
                  <span className="flex-1 truncate">{collection}</span>
                  <span className="tabular-nums opacity-60">
                    {collectionCounts.get(collection) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Số phần — thay cho "Độ khó" bên Reading */}
          <div className="mt-5 pt-5 border-t border-black/5">
            <span className={sectionLabel}>Số phần</span>
            <div className="mt-2 flex flex-col gap-0.5">
              {COVERAGES.map((coverage) => (
                <button
                  key={coverage}
                  type="button"
                  onClick={() => setCoverage(coverage)}
                  className={rowClass(query.coverage === coverage)}
                >
                  <span className="flex-1">{COVERAGE_LABELS[coverage]}</span>
                  <span className="tabular-nums opacity-60">{coverageCounts[coverage]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="mt-5 pt-5 border-t border-black/5">
            <span className={sectionLabel}>Sắp xếp</span>
            <div className="mt-2 flex flex-col gap-0.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSort(option.value)}
                  className={rowClass(query.sort === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {filtered && (
            <button
              type="button"
              onClick={reset}
              className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-black/10 text-2xs font-medium text-ink/55 hover:border-brand/40 hover:text-brand cursor-pointer transition-colors"
            >
              <X size={12} />
              Xoá bộ lọc
            </button>
          )}
        </div>
      </aside>

      <div>
        <div className="hidden lg:flex items-center gap-2 h-5 mb-4">
          <span className="text-2xs text-ink/40 font-medium">
            {groups.length}/{totalBooks} bộ đề · {visibleCount}/{total} đề nghe
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-black/10 rounded-2xl">
            <p className="text-sm text-ink/55">Không tìm thấy đề nào khớp bộ lọc.</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 text-2xs font-medium text-brand hover:underline cursor-pointer"
            >
              Xoá bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {groups.map((group, index) => (
              <ListeningBookCard key={group.id} group={group} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
