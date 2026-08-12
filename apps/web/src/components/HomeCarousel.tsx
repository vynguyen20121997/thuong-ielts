"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Testimonials from "./Testimonials";
import Feedback from "./Feedback";

const SLIDES = [
  { key: "results", label: "Kết quả học viên" },
  { key: "feedback", label: "Cảm nhận học viên" },
];

export default function HomeCarousel() {
  const [index, setIndex] = useState(0);

  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Slide track */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          <div className="w-full shrink-0">
            <Testimonials variant="preview" />
          </div>
          <div className="w-full shrink-0">
            <Feedback variant="preview" />
          </div>
        </div>

        {/* Slide arrows (switch between the 2 promo panels) */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Slide trước"
          className="hidden md:flex items-center justify-center absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 border border-black/10 text-[#14532D] shadow-lg hover:bg-[#9FE870] hover:border-[#9FE870] transition-colors cursor-pointer z-20 backdrop-blur"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Slide sau"
          className="hidden md:flex items-center justify-center absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 border border-black/10 text-[#14532D] shadow-lg hover:bg-[#9FE870] hover:border-[#9FE870] transition-colors cursor-pointer z-20 backdrop-blur"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Slide dots */}
      <div className="flex items-center justify-center gap-3 py-8 bg-[#FAF9F6] border-b border-black/5">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={s.label}
            className={`flex items-center gap-2 transition-all cursor-pointer ${
              i === index ? "" : "opacity-60 hover:opacity-100"
            }`}
          >
            <span
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-8 bg-[#14532D]" : "w-2.5 bg-[#14532D]/30"
              }`}
            />
            <span
              className={`font-mono text-[10px] uppercase tracking-widest font-bold hidden sm:inline ${
                i === index ? "text-[#14532D]" : "text-[#1A1A1A]/40"
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
