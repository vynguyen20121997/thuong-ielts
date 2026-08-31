"use client";

import { useRef, useEffect, useCallback, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

interface CarouselProps {
  children: ReactNode;
  ariaLabel?: string;
  autoPlayInterval?: number;
}

export default function Carousel({ children, ariaLabel = "Carousel", autoPlayInterval = 3500 }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const reduce = useReducedMotion();

  const scroll = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    // Bấm next/prev ở mép thì quay vòng, cho cảm giác vô hạn như autoplay
    if (dir > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir < 0 && el.scrollLeft <= 4) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const advance = useCallback(() => {
    const el = trackRef.current;
    if (!el || pausedRef.current) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: el.clientWidth * 0.85, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(advance, autoPlayInterval);
    return () => clearInterval(id);
  }, [advance, autoPlayInterval, reduce]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <div
      className="relative"
      aria-label={ariaLabel}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 -mx-1 px-1"
      >
        {children}
      </div>

      {/* Arrow controls (desktop) */}
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Trước"
        className="hidden md:flex items-center justify-center absolute -left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white border border-black/10 text-[#14532D] shadow-lg hover:bg-[#9FE870] hover:border-[#9FE870] transition-colors cursor-pointer z-10"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Sau"
        className="hidden md:flex items-center justify-center absolute -right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white border border-black/10 text-[#14532D] shadow-lg hover:bg-[#9FE870] hover:border-[#9FE870] transition-colors cursor-pointer z-10"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
