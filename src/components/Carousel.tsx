import { useRef, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  children: ReactNode;
  ariaLabel?: string;
}

export default function Carousel({ children, ariaLabel = "Carousel" }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative" aria-label={ariaLabel}>
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
