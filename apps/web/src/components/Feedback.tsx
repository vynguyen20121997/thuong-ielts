"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Quote, X, Maximize2, ArrowRight } from "lucide-react";
import { FeedbackItem } from "../data/feedbackData";
import StudentPageHeader, { HeaderAvatar } from "./StudentPageHeader";
import NavigationButtonLabel from "./NavigationButtonLabel";
import Reveal from "./Reveal";

function firstLetter(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() : "?";
}

interface FeedbackProps {
  variant?: "preview" | "full";
}

// Preview: 11 thẻ để masonry ba cột kín hơn ở trang chủ.
const PREVIEW_COUNT = 11;
const BATCH = 12;
const PREVIEW_EXCLUDED_IDS = new Set([
  "fb-sr487-2024-3",
  "fb-di-hoc-me-chiu-sao-noi-4",
  "fb-ke-chien-thang-ielts-reading-9-0-97",
]);

export default function Feedback({ variant = "full" }: FeedbackProps) {
  const isPreview = variant === "preview";
  const reduce = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState<number>(BATCH);
  const [lightbox, setLightbox] = useState<{ url: string; subject: string } | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feedbacks")
      .then((res) => {
        if (!res.ok) throw new Error(`/api/feedbacks returned ${res.status}`);
        return res.json();
      })
      .then((data: FeedbackItem[]) => {
        if (!cancelled) setFeedbackItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load feedbacks:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewItems = feedbackItems.filter((item) => !PREVIEW_EXCLUDED_IDS.has(item.id));
  const visible = isPreview ? previewItems.slice(0, PREVIEW_COUNT) : feedbackItems.slice(0, visibleCount);
  const previewColumns = [
    visible.filter((_, index) => index % 2 === 0),
    visible.filter((_, index) => index % 2 !== 0),
  ];

  const hasMore = !isPreview && visibleCount < feedbackItems.length;

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

  const headerAvatars: HeaderAvatar[] = feedbackItems
    .slice(0, 14)
    .map((f) => ({ label: firstLetter(f.subject) }));

  return (
    <section
      id="feedback"
      className={`${isPreview ? "py-16 md:py-20 bg-white" : "pb-24 bg-white"} relative overflow-hidden border-b border-black/5`}
    >
      {/* Nền preview phẳng theo Figma; glow chỉ giữ cho trang đầy đủ */}
      {!isPreview && (
        <>
          <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-leaf/20 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-brand/[0.04] blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Full-page hero header */}
      {!isPreview && (
        <StudentPageHeader
          eyebrow="Cảm Nhận Học Viên"
          count={feedbackItems.length}
          heading="câu chuyện thật về những trải nghiệm học tập đáng nhớ"
          description="Mỗi học viên đều có một trải nghiệm và hành trình học tập riêng. Cùng lắng nghe những chia sẻ chân thành từ các bạn đã và đang đồng hành cùng Thương Hồ's Class trên hành trình chinh phục IELTS."
          avatars={headerAvatars}
          overflow={Math.max(0, feedbackItems.length - 14)}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Preview header — căn giữa theo Figma, tiêu đề sans đậm thay vì serif */}
        {isPreview && (
          <Reveal className="text-center mb-12 flex flex-col items-center gap-4">
            <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
              Học Viên Nói Gì Về Cô Thương
            </span>
            <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-brand leading-[1.2]">
              150+ Đánh Giá Tích Cực <br />
              Từ Học Viên
            </h2>
          </Reveal>
        )}

        {/* Cards: hai cột feedback chạy ngược chiều ở trang chủ, masonry ở trang riêng */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink/40 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-brand/40 animate-pulse" />
            Đang tải dữ liệu...
          </div>
        ) : feedbackItems.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink/50">
            Chưa có dữ liệu cảm nhận.
          </div>
        ) : isPreview ? (
          <>
            <Reveal delay={0.1}>
              <div className="grid h-[590px] grid-cols-2 gap-4 overflow-hidden md:h-[720px] md:gap-5">
                {previewColumns.map((column, columnIndex) => (
                  <div key={columnIndex} className="overflow-hidden">
                    <div
                      className={`feedback-marquee-track flex w-full flex-col gap-4 pb-4 md:gap-5 md:pb-5 ${
                        reduce
                          ? ""
                          : columnIndex === 0
                            ? "feedback-marquee-down"
                            : "feedback-marquee-up"
                      }`}
                    >
                      {[...column, ...column].map((item, copyIndex) => (
                        <button
                          key={`${item.id}-${copyIndex}`}
                          type="button"
                          onClick={() => setLightbox({ url: item.imageUrl, subject: item.subject })}
                          className="feedback-card group w-full shrink-0 overflow-hidden rounded-[20px] border border-black/5 bg-white p-3 text-left shadow-sm transition-all duration-300 hover:shadow-xl cursor-zoom-in md:rounded-[24px] md:p-5"
                        >
                          <span className="mb-3 flex items-center gap-2 md:mb-4">
                            <Quote size={15} className="shrink-0 fill-brand-deep text-brand-deep" />
                            <span className="text-xs font-bold leading-tight tracking-wide text-brand-deep">
                              {item.subject}
                            </span>
                          </span>
                          <div className="relative max-h-[420px] overflow-hidden rounded-xl">
                            <img
                              src={item.imageUrl}
                              alt={`Cảm nhận học viên: ${item.subject}`}
                              loading="lazy"
                              className="h-auto w-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                              <Maximize2 size={14} />
                              Phóng to để đọc rõ hơn
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="mt-12 text-center">
              <Link
                href="/cam-nhan-hoc-vien"
                className="group inline-flex items-center gap-2 px-8 py-3.5 bg-brand hover:bg-brand-deep text-white text-sm font-semibold rounded-full transition-colors duration-300 shadow-md"
              >
                <NavigationButtonLabel>Xem Thêm Cảm Nhận</NavigationButtonLabel>
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Masonry wall */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
              {visible.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setLightbox({ url: item.imageUrl, subject: item.subject })}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: (i % BATCH) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="feedback-card group mb-5 block w-full break-inside-avoid text-left bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-brand/30 transition-all duration-300 cursor-zoom-in"
                >
                  <div className="px-5 pt-5 pb-3">
                    <Quote size={18} className="text-leaf mb-2" />
                    <p className="text-sm md:text-base font-bold text-ink leading-snug">
                      {item.subject}
                    </p>
                    {item.date && (
                      <span className="text-2xs text-ink/40 font-medium mt-2 block">
                        {item.date}
                      </span>
                    )}
                  </div>
                  <div className="relative bg-black/[0.03] border-t border-black/5">
                    <img
                      src={item.imageUrl}
                      alt={`Cảm nhận học viên: ${item.subject}`}
                      loading="lazy"
                      className="w-full h-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 ">
                      <Maximize2 size={14} />
                      Phóng to
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="mt-12 flex items-center justify-center gap-2 text-xs text-ink/40 font-medium"
                id="feedback-load-more"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand/40 animate-pulse" />
                Đang tải thêm...
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
            id="feedback-lightbox"
          >
            <button
              onClick={() => setLightbox(null)}
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
              <img
                src={lightbox.url}
                alt={`Cảm nhận học viên: ${lightbox.subject}`}
                className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
              />
              <p className="mt-4 text-center text-white font-bold text-base max-w-lg">
                {lightbox.subject}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
