import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

import { formatAttempts } from "../../../../features/practice/domain/catalog";
import { listReadingTests } from "../../../../features/practice/server/readingRepository";
import ReadingCatalog from "../../../../features/practice/ui/ReadingCatalog";

export const metadata: Metadata = {
  title: "Luyện Reading IELTS | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Bộ đề luyện Reading IELTS miễn phí theo từng dạng câu hỏi: True/False/Not Given, Matching Headings, điền từ. Chấm điểm tự động kèm giải thích.",
};

// The catalog is fetched on the server so the list is in the HTML (SEO) and the
// browser never waits on a round-trip before seeing content.
export const dynamic = "force-dynamic";

export default async function ReadingCatalogPage() {
  const tests = await listReadingTests();
  const totalAttempts = tests.reduce((sum, test) => sum + test.attemptCount, 0);

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-[#FAF9F6] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/40 mb-6">
          <Link href="/kiem-tra-kien-thuc" className="hover:text-[#14532D] transition-colors">
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#14532D]">Reading</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="font-mono text-xs tracking-[0.25em] text-[#14532D] uppercase mb-3 font-bold flex items-center gap-1.5">
              <BookOpen size={15} />
              Kỹ năng Đọc
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-black tracking-tight text-[#1A1A1A] leading-[1.05]">
              Luyện Reading <br className="hidden md:block" />
              Theo Từng Dạng Bài
            </h1>
            <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed mt-5">
              Mỗi đề là một bài đọc hoàn chỉnh kèm bộ câu hỏi thuộc các dạng ra thi nhiều nhất.
              Bấm giờ 20 phút, nộp bài xem đáp án và giải thích ngay.
            </p>
          </div>

          <div className="flex gap-8 shrink-0">
            <div>
              <span className="font-serif text-3xl font-black text-[#14532D] block leading-none">
                {tests.length}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/45 font-bold mt-1.5 block">
                Đề đang mở
              </span>
            </div>
            <div>
              <span className="font-serif text-3xl font-black text-[#14532D] block leading-none">
                {formatAttempts(totalAttempts)}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/45 font-bold mt-1.5 block">
                Lượt làm bài
              </span>
            </div>
          </div>
        </div>

        <ReadingCatalog tests={tests} />
      </div>
    </main>
  );
}
