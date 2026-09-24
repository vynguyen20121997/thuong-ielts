import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Headphones } from "lucide-react";

import { listListeningTests } from "../../../../features/practice/server/listeningRepository";
import { listCompletedTargets } from "../../../../features/practice/server/attemptRepository";
import { auth } from "../../../../auth";
import ListeningCatalog from "../../../../features/practice/ui/ListeningCatalog";

import PageArch from "../../../../components/PageArch";

export const metadata: Metadata = {
  title: "Luyện đề IELTS Listening | ThuongHo.Class",
  description:
    "Bộ đề luyện Listening IELTS miễn phí có file nghe, bấm giờ 30 phút, chấm điểm tự động và quy đổi band.",
};

export const dynamic = "force-dynamic";

export default async function ListeningCatalogPage() {
  const [tests, session] = await Promise.all([listListeningTests(), auth()]);
  const studentId = session?.user?.id;
  const completed = new Set(
    studentId ? await listCompletedTargets(studentId, "listening") : [],
  );
  const catalogTests = tests.map((test) => ({
    ...test,
    completed: completed.has(test.slug),
  }));

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <PageArch />
      <div className="relative z-10 max-w-7xl mx-auto gutter">
        <nav className="flex items-center gap-1.5 text-2xs font-medium text-ink/65 mb-6">
          <Link
            href="/phong-luyen-tap"
            className="hover:text-brand transition-colors"
          >
            Phòng luyện tập
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Listening</span>
        </nav>

        <div className="mb-9">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-brand flex items-center gap-2">
              <Headphones size={42} strokeWidth={1.8} />
              Luyện đề IELTS Listening
            </h1>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-black/10 rounded-2xl">
            <p className="text-sm text-ink/65">Chưa có đề nghe nào được mở.</p>
          </div>
        ) : (
          <ListeningCatalog tests={catalogTests} />
        )}
      </div>
    </main>
  );
}
