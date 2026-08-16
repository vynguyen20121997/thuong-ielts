"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { useReadingCatalog } from "../application/useReadingCatalog";
import { LEVEL_LABELS, type CatalogSort } from "../domain/catalog";
import type { ReadingLevel, ReadingTestSummary } from "../domain/types";
import ReadingTestGroupCard from "./ReadingTestGroupCard";

/**
 * The interactive shell around the catalog grid. All state lives in
 * `useReadingCatalog`; this component only maps that state onto controls.
 *
 * Bộ lọc nằm thành cột dọc chạy song song với lưới kết quả: 9 bộ đề xếp hàng
 * ngang thì tràn ra ngoài màn hình, cái thứ 6 trở đi phải cuộn mới thấy. Xếp
 * dọc thì thấy hết cùng lúc, và kết quả đổi ngay bên cạnh chỗ vừa bấm.
 *
 * Dưới `lg` không đủ chỗ cho hai cột, nên cột lọc thu lại sau một nút bật/tắt.
 */

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "default", label: "Mặc định" },
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Nhiều lượt làm" },
];

const LEVELS: ReadingLevel[] = ["easy", "medium", "hard"];

export default function ReadingCatalog({ tests }: { tests: ReadingTestSummary[] }) {
  const {
    query,
    collections,
    collectionCounts,
    topics,
    groups,
    totalGroups,
    visibleCount,
    total,
    setCollection,
    setLevel,
    setTopic,
    setSearch,
    setSort,
    reset,
  } = useReadingCatalog(tests);

  /** Chỉ có tác dụng dưới `lg`; từ `lg` trở lên cột lọc luôn hiện. */
  const [openOnMobile, setOpenOnMobile] = useState(false);
  /** 22 chủ đề bày hết thì cột lọc dài hơn cả lưới đề. */
  const [allTopics, setAllTopics] = useState(false);

  const filtered = Boolean(query.collection || query.level || query.topic || query.search);

  const TOPICS_SHOWN = 10;
  // Chủ đề đang chọn luôn phải thấy được, kể cả khi nó nằm trong phần bị giấu.
  const visibleTopics =
    allTopics || topics.length <= TOPICS_SHOWN
      ? topics
      : topics
          .slice(0, TOPICS_SHOWN)
          .concat(topics.slice(TOPICS_SHOWN).filter((topic) => topic.label === query.topic));

  /** Một dòng trong cột lọc: chiếm hết bề ngang, số đếm đẩy về cuối dòng. */
  const rowClass = (active: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-2xs font-medium text-left transition-colors cursor-pointer ${active ? "bg-[#14532D] text-white" : "text-[#1A1A1A]/60 hover:bg-[#14532D]/[0.06] hover:text-[#14532D]"}`;

  const sectionLabel = "text-2xs text-[#1A1A1A]/35 font-medium";

  return (
    <div className="grid lg:grid-cols-[248px_1fr] gap-6 lg:gap-8 items-start">
      {/* Cột lọc */}
      <aside className="lg:sticky lg:top-28">
        <div className="flex items-center gap-3 lg:hidden mb-3">
          <button
            type="button"
            onClick={() => setOpenOnMobile((value) => !value)}
            aria-expanded={openOnMobile}
            aria-controls="catalog-filters"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/10 bg-white text-2xs font-medium text-[#1A1A1A]/70 cursor-pointer"
          >
            <SlidersHorizontal size={13} />
            Bộ lọc
            {filtered && <span className="h-1.5 w-1.5 rounded-full bg-[#14532D]" />}
          </button>
          <span className="text-2xs text-[#1A1A1A]/40 font-medium">
            {groups.length}/{totalGroups} test
          </span>
        </div>

        {/*
          Tiêu đề cột lọc. Ngoài việc gọi tên cột, nó chiếm đúng chiều cao của
          dòng đếm bên phải (cùng cỡ chữ, cùng `mb-4`), nên mép trên của khung
          lọc và mép trên của thẻ đầu tiên nằm trên một đường.
        */}
        <div className="hidden lg:flex items-center gap-2 h-5 mb-4">
          <SlidersHorizontal size={13} className="text-[#1A1A1A]/35" />
          <span className="text-2xs font-medium text-[#1A1A1A]/40">Bộ lọc</span>
        </div>

        {/*
          `data-lenis-prevent`: con lăn khi đang trỏ vào cột lọc phải cuộn cột
          lọc, không phải cuộn trang. Không có nó thì Lenis nuốt sự kiện wheel
          và cuộn trang, còn cột lọc — dài 22 chủ đề — thì không xuống được.
          Xem thêm luật ghi đè `overflow` trong globals.css.
        */}
        <div
          data-lenis-prevent
          id="catalog-filters"
          className={`${openOnMobile ? "block" : "hidden"} lg:block bg-white border border-black/5 rounded-2xl shadow-sm p-4 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto`}
        >
          {/* Tìm kiếm */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/35 pointer-events-none"
            />
            <input
              type="search"
              value={query.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên đề, chủ đề..."
              aria-label="Tìm đề đọc"
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-full pl-9 pr-3 py-2.5 text-xs text-[#1A1A1A] placeholder:text-[#1A1A1A]/35 focus:outline-none focus:border-[#14532D]/50 transition-colors"
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
                <span className="tabular-nums opacity-60">{totalGroups}</span>
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

          {/* Chủ đề */}
          <div className="mt-5 pt-5 border-t border-black/5">
            <span className={sectionLabel}>Chủ đề</span>
            <div className="mt-2 flex flex-col gap-0.5">
              <button type="button" onClick={() => setTopic("")} className={rowClass(!query.topic)}>
                Tất cả
              </button>
              {visibleTopics.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => setTopic(query.topic === topic.label ? "" : topic.label)}
                  className={rowClass(query.topic === topic.label)}
                >
                  <span className="flex-1 truncate">{topic.label}</span>
                  <span className="tabular-nums opacity-60">{topic.count}</span>
                </button>
              ))}
            </div>

            {topics.length > TOPICS_SHOWN && (
              <button
                type="button"
                onClick={() => setAllTopics((value) => !value)}
                className="mt-1.5 px-3 text-2xs font-medium text-[#14532D]/70 hover:text-[#14532D] cursor-pointer transition-colors"
              >
                {allTopics ? "Thu gọn" : `Thêm ${topics.length - TOPICS_SHOWN} chủ đề`}
              </button>
            )}
          </div>

          {/* Độ khó */}
          <div className="mt-5 pt-5 border-t border-black/5">
            <span className={sectionLabel}>Độ khó</span>
            <div className="mt-2 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setLevel(null)}
                className={rowClass(query.level === null)}
              >
                Tất cả
              </button>
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevel(level)}
                  className={rowClass(query.level === level)}
                >
                  {LEVEL_LABELS[level]}
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
              className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-black/10 text-2xs font-medium text-[#1A1A1A]/55 hover:border-[#14532D]/40 hover:text-[#14532D] cursor-pointer transition-colors"
            >
              <X size={12} />
              Xoá bộ lọc
            </button>
          )}
        </div>
      </aside>

      {/* Kết quả */}
      <div>
        <div className="hidden lg:flex items-center gap-2 h-5 mb-4">
          <span className="text-2xs text-[#1A1A1A]/40 font-medium">
            {groups.length}/{totalGroups} test · {visibleCount}/{total} passage
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-black/10 rounded-2xl">
            <p className="text-sm text-[#1A1A1A]/55">Không tìm thấy đề nào khớp bộ lọc.</p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 text-2xs font-medium text-[#14532D] hover:underline cursor-pointer"
            >
              Xoá bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {groups.map((group, index) => (
              <ReadingTestGroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
