import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

import { formatAttempts, groupByTest } from "../../../../features/practice/domain/catalog";
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
  // Danh sách hiển thị theo test, nên con số ở đầu trang cũng phải đếm test.
  const testCount = groupByTest(tests).length;

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-2xs font-medium text-ink/40 mb-6">
          <Link href="/kiem-tra-kien-thuc" className="hover:text-brand transition-colors">
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Reading</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="text-xs text-brand mb-3 font-medium flex items-center gap-1.5">
              <BookOpen size={15} />
              Kỹ năng Đọc
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
              Luyện Reading <br className="hidden md:block" />
              Theo Từng Dạng Bài
            </h1>
            <p className="text-ink/70 text-sm md:text-base leading-relaxed mt-5">
              Mỗi test gồm 3 passage, mỗi passage là một bài đọc hoàn chỉnh kèm bộ câu hỏi thuộc các
              dạng ra thi nhiều nhất. Bấm giờ 20 phút, nộp bài xem đáp án và giải thích ngay.
            </p>
          </div>

          <div className="flex gap-8 shrink-0">
            <div>
              <span className="font-serif text-3xl font-bold text-brand block leading-none">
                {testCount}
              </span>
              <span className="text-2xs text-ink/45 font-medium mt-1.5 block">
                Test đang mở
              </span>
              <span className="text-2xs text-ink/30 font-medium mt-0.5 block">
                {tests.length} passage
              </span>
            </div>
            <div>
              <span className="font-serif text-3xl font-bold text-brand block leading-none">
                {formatAttempts(totalAttempts)}
              </span>
              <span className="text-2xs text-ink/45 font-medium mt-1.5 block">
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
