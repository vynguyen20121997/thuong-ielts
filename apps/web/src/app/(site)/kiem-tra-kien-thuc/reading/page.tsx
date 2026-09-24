import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

import { listReadingTests } from "../../../../features/practice/server/readingRepository";
import { listCompletedTargets } from "../../../../features/practice/server/attemptRepository";
import { auth } from "../../../../auth";
import ReadingCatalog from "../../../../features/practice/ui/ReadingCatalog";

import PageArch from "../../../../components/PageArch";

export const metadata: Metadata = {
  title: "Luyện đề IELTS Reading | ThuongHo.Class",
  description:
    "Bộ đề luyện Reading IELTS miễn phí theo từng dạng câu hỏi: True/False/Not Given, Matching Headings, điền từ. Chấm điểm tự động kèm giải thích.",
};

// The catalog is fetched on the server so the list is in the HTML (SEO) and the
// browser never waits on a round-trip before seeing content.
export const dynamic = "force-dynamic";

export default async function ReadingCatalogPage() {
  const [tests, session] = await Promise.all([listReadingTests(), auth()]);
  const studentId = session?.user?.id;
  const completed = new Set(studentId ? await listCompletedTargets(studentId, "reading") : []);
  const catalogTests = tests.map((test) => ({ ...test, completed: completed.has(test.slug) }));

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <PageArch />
      <div className="relative z-10 max-w-7xl mx-auto gutter">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-2xs font-medium text-ink/40 mb-6">
          <Link href="/phong-luyen-tap" className="hover:text-brand transition-colors">
            Phòng luyện tập
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Reading</span>
        </nav>

        <div className="mb-9">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-brand flex items-center gap-2">
              <BookOpen size={42} strokeWidth={1.8} />
              Luyện đề IELTS Reading
            </h1>
          </div>
        </div>

        <ReadingCatalog tests={catalogTests} />
      </div>
    </main>
  );
}
