"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Quote,
  Award,
  ArrowRight,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar,
  Maximize2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ExtendedTestimonialItem } from "../data/testimonialsData";
import StudentPageHeader from "./StudentPageHeader";
import Reveal from "./Reveal";
import NavigationButtonLabel from "./NavigationButtonLabel";

interface TestimonialsProps {
  variant?: "preview" | "full";
}

// Preview: 18 thẻ điểm, chia thành hai dải chạy liên tục ở trang chủ.
const PREVIEW_COUNT = 18;
const BATCH = 9;
const PREVIEW_EXCLUDED_IDS = new Set(["student-hong-hanh-51"]);

function LazyProofImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-black/[0.04] via-black/[0.08] to-black/[0.04]"
        />
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs font-medium text-black/40">
          Ảnh hiện chưa tải được
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`h-full w-full object-contain transition-[opacity,transform] duration-500 group-hover/proof:scale-105 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

// Parse "dd/mm/yyyy" -> sortable number; unknown formats sort last.
function dateKey(date: string): number {
  const m = date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return 0;
  return Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]);
}

function yearOf(date: string): string | null {
  const m = date.match(/\/(\d{4})/);
  return m ? m[1] : null;
}

// Parse "8.5 IELTS" -> 8.5; unknown formats sort last.
function scoreKey(score: string): number {
  const m = score.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

export default function Testimonials({ variant = "full" }: TestimonialsProps) {
  const isPreview = variant === "preview";
  const shouldReduceMotion = useReducedMotion();

  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [cardImageIndex, setCardImageIndex] = useState<Record<string, number>>({});
  const [selectedProofImages, setSelectedProofImages] = useState<string[] | null>(null);
  const [selectedProofIndex, setSelectedProofIndex] = useState<number>(0);
  const [selectedProofName, setSelectedProofName] = useState<string>("");
  const [activeYear, setActiveYear] = useState<string>("all");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(BATCH);

  const [testimonials, setTestimonials] = useState<ExtendedTestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testimonials")
      .then((res) => {
        // fetch only rejects on network failure — an HTTP 500 still resolves,
        // and its {error} body parses as valid JSON. Without this check the
        // error object lands in state and crashes the sort/spread below.
        if (!res.ok) throw new Error(`/api/testimonials returned ${res.status}`);
        return res.json();
      })
      .then((data: ExtendedTestimonialItem[]) => {
        if (!cancelled) setTestimonials(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load testimonials:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sort newest-first by year/date
  const sorted = useMemo(
    () => [...testimonials].sort((a, b) => dateKey(b.date) - dateKey(a.date)),
    [testimonials],
  );

  // Distinct years (desc) for the full-page filter
  const years = useMemo(() => {
    const set = new Set<string>();
    sorted.forEach((t) => {
      const y = yearOf(t.date);
      if (y) set.add(y);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [sorted]);

  const filtered = useMemo(() => {
    if (isPreview || activeYear === "all") return sorted;
    return sorted.filter((t) => yearOf(t.date) === activeYear);
  }, [sorted, isPreview, activeYear]);

  // Highest band score first, for the homepage honor-roll preview
  const byScore = useMemo(
    () => [...testimonials].sort((a, b) => scoreKey(b.score) - scoreKey(a.score)),
    [testimonials],
  );

  // Ưu tiên 12 bạn từ 8.0 trở lên, nhưng lượt cuối vẫn có đại diện 7.5, 7.0
  // và 6.5 để khối thành tích phản ánh đa dạng mục tiêu học viên.
  const previewItems = useMemo(() => {
    const eligibleItems = byScore.filter((item) => !PREVIEW_EXCLUDED_IDS.has(item.id));
    const highScores = eligibleItems.filter((item) => scoreKey(item.score) >= 8).slice(0, 12);
    const selectedIds = new Set(highScores.map((item) => item.id));
    const remaining = eligibleItems.filter((item) => !selectedIds.has(item.id));
    const takeScore = (score: number, count: number) =>
      remaining.filter((item) => scoreKey(item.score) === score).slice(0, count);

    return [...highScores, ...takeScore(7.5, 3), ...takeScore(7, 2), ...takeScore(6.5, 1)].slice(
      0,
      PREVIEW_COUNT,
    );
  }, [byScore]);
  const previewRows = useMemo(
    () => [
      previewItems.filter((_, index) => index % 2 === 0),
      previewItems.filter((_, index) => index % 2 !== 0),
    ],
    [previewItems],
  );
  const highAchievers = useMemo(
    () => byScore.filter((item) => [8, 8.5].includes(scoreKey(item.score))),
    [byScore],
  );
  const showHighAchievers = !isPreview && activeYear === "all";
  const regularItems = showHighAchievers
    ? filtered.filter((item) => ![8, 8.5].includes(scoreKey(item.score)))
    : filtered;
  const shown = isPreview ? previewItems : regularItems.slice(0, visibleCount);

  const hasMore = !isPreview && regularItems.length > visibleCount;

  // Lazy-load more cards as the sentinel scrolls into view, instead of a manual "load more" click
  const loadMore = useCallback(() => {
    setVisibleCount((p) => p + BATCH);
  }, []);

  useEffect(() => {
    if (isPreview || !hasMore) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isPreview, hasMore, loadMore]);

  const toggleExpand = (id: string) => setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));

  const changeCardImage = (e: React.MouseEvent, id: string, delta: number, total: number) => {
    e.stopPropagation();
    setCardImageIndex((prev) => {
      const current = prev[id] || 0;
      return { ...prev, [id]: (current + delta + total) % total };
    });
  };

  const changeLightboxImage = (delta: number, total: number) =>
    setSelectedProofIndex((prev) => (prev + delta + total) % total);

  const renderCard = (test: ExtendedTestimonialItem) => {
    const isLongComment = (test.comment?.length ?? 0) > 180;
    const isExpanded = expandedReviews[test.id] || false;

    return (
      <div
        key={test.id}
        className={`testimonial-card bg-white border border-black/5 hover:border-brand/35 p-6 lg:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:shadow-xl relative group text-left ${isPreview ? "snap-start shrink-0 w-[300px] sm:w-[340px]" : ""}`}
        id={test.id}
      >
        <div className="absolute top-6 right-6 text-black/5 group-hover:text-brand/10 transition-colors pointer-events-none">
          <Quote size={40} />
        </div>

        {/* Proof image carousel */}
        {test.proofUrl &&
          test.proofUrl.length > 0 &&
          (() => {
            const images = test.proofUrl!;
            const currentIndex = cardImageIndex[test.id] || 0;
            const safeIndex = currentIndex < images.length ? currentIndex : 0;
            return (
              <div
                onClick={() => {
                  setSelectedProofImages(images);
                  setSelectedProofIndex(safeIndex);
                  setSelectedProofName(test.studentName);
                }}
                className="mb-5 relative rounded-2xl overflow-hidden border border-black/5 group/proof cursor-zoom-in bg-black/[0.03] shadow-sm h-80"
              >
                <LazyProofImage
                  key={images[safeIndex]}
                  src={images[safeIndex]}
                  alt={`Bảng điểm ${test.studentName}`}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/proof:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 ">
                  <Maximize2 size={14} />
                  Phóng to bảng điểm
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => changeCardImage(e, test.id, -1, images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-ink rounded-full shadow-sm transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={(e) => changeCardImage(e, test.id, 1, images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white text-ink rounded-full shadow-sm transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-full">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${i === safeIndex ? "w-3 bg-white" : "w-1.5 bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        <div>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h4 className="font-serif font-bold text-sm text-ink leading-tight">
                {test.studentName}
              </h4>
              <p className="text-2xs text-ink/50 mt-0.5 font-extrabold leading-none">
                {test.schoolOrJob}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand/10 border border-brand/20 text-brand text-2xs rounded-full font-medium shadow-sm shrink-0">
              <Award size={10} />
              {test.score}
            </span>
          </div>

          {/* Date tag */}
          <div className="flex flex-wrap gap-2 items-center mb-4 text-2xs text-black/40 font-medium ">
            <span className="inline-flex items-center gap-1">
              <Calendar size={10} />
              {test.date}
            </span>
          </div>

          {test.comment && (
            <div className="relative mb-5">
              <p
                className={`text-xs md:text-sm text-ink/80 leading-relaxed font-serif ${!isExpanded && isLongComment ? "line-clamp-4" : ""}`}
              >
                "{test.comment}"
              </p>
              {!isExpanded && isLongComment && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
              {isLongComment && (
                <button
                  onClick={() => toggleExpand(test.id)}
                  className="mt-2 text-2xs font-medium text-brand hover:text-brand-deep inline-flex items-center gap-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      Rút gọn <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      Xem thêm <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      id="testimonials"
      className={`${isPreview ? "py-16 md:py-20 bg-mist" : "pb-24 bg-white"} text-ink relative overflow-hidden border-t border-b border-black/5`}
    >
      {/* Decorative Grid Lines — chỉ trang đầy đủ; preview nền phẳng theo Figma */}
      {!isPreview && (
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(black_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
      )}

      {/* Full-page hero header */}
      {!isPreview && (
        <StudentPageHeader
          eyebrow="Kết Quả Học Viên"
          count={testimonials.length}
          heading="hành trình & mục tiêu được chinh phục"
          description="Mỗi điểm số là kết quả của một hành trình học tập nghiêm túc, từ việc xác định đúng vấn đề đến xây dựng lộ trình phù hợp và kiên trì cải thiện từng kỹ năng. Cùng nhìn lại những thành tích nổi bật của các học viên đã đồng hành cùng Thương Hồ's Class và đạt được mục tiêu IELTS của mình."
          avatars={[]}
          showAvatars={false}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Preview header — trái tiêu đề, phải nút outline theo Figma */}
        {isPreview && (
          <Reveal className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div className="text-left flex flex-col gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
                Thành tích học viên
              </span>
              <h2 className="font-serif text-3xl md:text-[40px] font-bold tracking-tight text-brand leading-[1.2]">
                100+ Học viên chinh phục thành công mục tiêu IELTS
              </h2>
            </div>
            <Link
              href="/ket-qua-hoc-vien"
              className="group shrink-0 inline-flex items-center gap-2 px-8 py-3.5 bg-brand hover:bg-brand-deep text-white text-sm font-semibold rounded-full transition-colors duration-300 shadow-md"
            >
              <NavigationButtonLabel>Xem tất cả thành tích học viên</NavigationButtonLabel>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        )}

        {/* Year filter — full page only */}
        {!isPreview && years.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => {
                setActiveYear("all");
                setVisibleCount(BATCH);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${activeYear === "all" ? "bg-brand text-white border-brand shadow-sm" : "bg-white border-black/10 text-ink/70 hover:bg-black/5"}`}
            >
              Tất cả
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setActiveYear(y);
                  setVisibleCount(BATCH);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${activeYear === y ? "bg-brand text-white border-brand shadow-sm" : "bg-white border-black/10 text-ink/70 hover:bg-black/5"}`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* Cards: hai dải điểm chạy ngược chiều ở trang chủ, grid đầy đủ ở trang riêng */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink/40 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-brand/40 animate-pulse" />
            Đang tải dữ liệu...
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink/50">
            Chưa có dữ liệu học viên.
          </div>
        ) : isPreview ? (
          <Reveal delay={0.1}>
            <div className="space-y-4 overflow-hidden py-2" aria-label="Thành tích học viên">
              {previewRows.map((row, rowIndex) => (
                <div key={rowIndex} className="overflow-hidden">
                  <div
                    className={`flex w-max gap-4 pr-4 will-change-transform md:gap-5 md:pr-5 ${
                      shouldReduceMotion
                        ? ""
                        : rowIndex === 0
                          ? "student-score-marquee-left"
                          : "student-score-marquee-right"
                    }`}
                  >
                    {[...row, ...row].map((test, copyIndex) => {
                      const images = test.proofUrl ?? [];
                      if (images.length === 0) return null;
                      return (
                        <button
                          key={`${test.id}-${copyIndex}`}
                          type="button"
                          onClick={() => {
                            setSelectedProofImages(images);
                            setSelectedProofIndex(0);
                            setSelectedProofName(test.studentName);
                          }}
                          className="testimonial-card group relative aspect-square w-[154px] shrink-0 overflow-hidden rounded-[22px] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-zoom-in sm:w-[184px] md:w-[205px]"
                          id={copyIndex < row.length ? test.id : undefined}
                        >
                          <img
                            src={images[0]}
                            alt={`Thành tích ${test.studentName}: ${test.score}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        ) : (
          <>
            {showHighAchievers && highAchievers.length > 0 && (
              <Reveal className="mb-8 md:mb-10">
                <div className="mb-7 flex flex-col gap-2 border-l-4 border-leaf pl-5">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand/60">
                    High Achievers
                  </span>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-brand md:text-4xl">
                    Học viên đạt 8.0 &amp; 8.5 IELTS
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {highAchievers.map((test) => renderCard(test))}
                </div>
              </Reveal>
            )}
            {showHighAchievers && highAchievers.length > 0 && (
              <div aria-hidden="true" className="mb-14 h-0.5 rounded-full bg-brand/45 md:mb-16" />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {shown.map((test) => renderCard(test))}
            </div>

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="mt-12 flex items-center justify-center gap-2 text-xs text-ink/40 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand/40 animate-pulse" />
                Đang tải thêm...
              </div>
            )}
          </>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {selectedProofImages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProofImages(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
              id="proof-lightbox-overlay"
            >
              <button
                onClick={() => setSelectedProofImages(null)}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>

              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-3xl w-full flex flex-col items-center"
              >
                <div className="relative w-full flex items-center justify-center">
                  {selectedProofImages.length > 1 && (
                    <button
                      onClick={() => changeLightboxImage(-1, selectedProofImages.length)}
                      className="absolute left-0 md:-left-14 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer z-10"
                    >
                      <ChevronLeft size={22} />
                    </button>
                  )}

                  <img
                    src={selectedProofImages[selectedProofIndex]}
                    alt="Bảng điểm IELTS"
                    className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
                  />

                  {selectedProofImages.length > 1 && (
                    <button
                      onClick={() => changeLightboxImage(1, selectedProofImages.length)}
                      className="absolute right-0 md:-right-14 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer z-10"
                    >
                      <ChevronRight size={22} />
                    </button>
                  )}
                </div>

                {selectedProofImages.length > 1 && (
                  <div className="flex items-center gap-2 mt-4">
                    {selectedProofImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedProofIndex(i)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${i === selectedProofIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                      />
                    ))}
                  </div>
                )}

                {/* Caption below the image */}
                <p className="mt-4 text-center text-white font-serif font-bold text-lg">
                  {selectedProofName}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
