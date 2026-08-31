import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";

import SkillGrid from "./SkillGrid";

/**
 * Homepage block for "Kiểm tra kiến thức IELTS".
 * Server component — nothing here is interactive, so nothing here ships JS.
 */
export default function PracticeSection() {
  return (
    <section
      id="practice"
      className="py-24 md:py-28 bg-white relative overflow-hidden border-b border-black/5"
    >
      {/* Soft brand glows, matching the other homepage sections */}
      <div className="absolute top-1/4 left-0 w-[420px] h-[420px] rounded-full bg-leaf/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand/[0.05] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs text-brand mb-3 font-medium flex items-center gap-1.5">
              <GraduationCap size={15} />
              Kiểm Tra Kiến Thức IELTS
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              Làm Thử Một Bài, <br />
              Biết Ngay Mình Đang Ở Đâu
            </h2>
            <p className="text-ink/70 text-sm md:text-base leading-relaxed mt-5">
              Bộ đề luyện tập miễn phí do cô Thương biên soạn. Bấm giờ như thi thật, nộp bài là có
              điểm, band ước lượng và giải thích cho từng câu.
            </p>
          </div>

          <Link
            href="/kiem-tra-kien-thuc"
            className="group shrink-0 px-7 py-3.5 bg-brand hover:bg-brand-deep text-white font-bold text-xs rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer tracking-wider uppercase inline-flex items-center gap-2"
          >
            Vào Phòng Luyện Tập
            <ChevronRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <SkillGrid compact />
      </div>
    </section>
  );
}
