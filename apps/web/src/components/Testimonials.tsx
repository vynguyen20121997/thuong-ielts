"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Quote,
  Award,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar,
  Maximize2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ExtendedTestimonialItem } from "../data/testimonialsData";
import StudentPageHeader, { HeaderAvatar } from "./StudentPageHeader";
import Carousel from "./Carousel";

function firstLetter(name: string): string {
  const t = name.trim();
  return t ? t[0].toUpperCase() : "?";
}

interface TestimonialsProps {
  variant?: "preview" | "full";
}

// Preview theo sheet portfolio: carousel 6–8 thành tích nổi bật, tự động chạy
const PREVIEW_COUNT = 8;
const BATCH = 9;

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

  const shown = isPreview ? byScore.slice(0, PREVIEW_COUNT) : filtered.slice(0, visibleCount);

  const hasMore = !isPreview && filtered.length > visibleCount;

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

  const headerAvatars: HeaderAvatar[] = useMemo(
    () => sorted.slice(0, 14).map((t) => ({ label: firstLetter(t.studentName) })),
    [sorted],
  );

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
          avatars={headerAvatars}
          overflow={Math.max(0, testimonials.length - 14)}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Preview header — trái tiêu đề, phải nút outline theo Figma */}
        {isPreview && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div className="text-left flex flex-col gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
                Góc Vinh Danh Học Viên
              </span>
              <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-brand leading-[1.2]">
                120+ Học Viên Thành Công <br />
                Chinh Phục Mục Tiêu IELTS
              </h2>
            </div>
            <Link
              href="/ket-qua-hoc-vien"
              className="shrink-0 inline-flex items-center px-8 py-3.5 bg-brand hover:bg-brand-deep text-white text-sm font-semibold rounded-full transition-colors duration-300 shadow-md"
            >
              Xem tất cả thành tích học viên
            </Link>
          </div>
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

        {/* Cards: carousel on homepage preview, grid on full page */}
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
          /* Carousel tự chạy theo sheet portfolio. Ảnh vinh danh trong DB đã là
             thẻ thiết kế sẵn (khung đỏ, tên, band, LRWS) — hiển thị nguyên bản,
             không vẽ lại khung/tên kẻo lặp thông tin. Bấm mở lightbox. */
          <Carousel ariaLabel="Thành tích học viên">
            {shown.map((test, i) => {
              const images = test.proofUrl ?? [];
              if (images.length === 0) return null;
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => {
                    setSelectedProofImages(images);
                    setSelectedProofIndex(0);
                    setSelectedProofName(test.studentName);
                  }}
                  className="testimonial-card group relative snap-start shrink-0 w-[280px] sm:w-[320px] rounded-[28px] overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-zoom-in"
                  id={test.id}
                >
                  {i === 0 && (
                    <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#B3130B] text-white text-2xs font-bold uppercase tracking-wider rounded-full shadow">
                      Hot
                    </span>
                  )}
                  <img
                    src={images[0]}
                    alt={`Thành tích ${test.studentName}: ${test.score}`}
                    loading="lazy"
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </button>
              );
            })}
          </Carousel>
        ) : (
          <>
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
