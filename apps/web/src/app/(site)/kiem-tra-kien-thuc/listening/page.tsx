import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Headphones } from "lucide-react";

import { formatAttempts } from "../../../../features/practice/domain/catalog";
import { listListeningTests } from "../../../../features/practice/server/listeningRepository";
import ListeningCatalog from "../../../../features/practice/ui/ListeningCatalog";

export const metadata: Metadata = {
  title: "Luyện Listening IELTS | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Bộ đề luyện Listening IELTS miễn phí có file nghe, bấm giờ 30 phút, chấm điểm tự động và quy đổi band.",
};

export const dynamic = "force-dynamic";

export default async function ListeningCatalogPage() {
  const tests = await listListeningTests();
  const totalAttempts = tests.reduce((sum, t) => sum + t.attemptCount, 0);

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-[#FAF9F6] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <nav className="flex items-center gap-1.5 text-2xs font-medium text-[#1A1A1A]/40 mb-6">
          <Link href="/kiem-tra-kien-thuc" className="hover:text-[#14532D] transition-colors">
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#14532D]">Listening</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="text-xs text-[#14532D] mb-3 font-medium flex items-center gap-1.5">
              <Headphones size={15} />
              Kỹ năng Nghe
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-[1.05]">
              Luyện Listening <br className="hidden md:block" />
              Có File Nghe Thật
            </h1>
            <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed mt-5">
              Mỗi đề gồm 4 section như thi thật, nghe trực tiếp trên trang. Được tua và nghe lại
              thoải mái — đây là luyện tập, sai ở đâu phải nghe lại chỗ đó mới tiến bộ.
            </p>
          </div>

          <div className="flex gap-8 shrink-0">
            <div>
              <span className="font-serif text-3xl font-bold text-[#14532D] block leading-none">
                {tests.length}
              </span>
              <span className="text-2xs text-[#1A1A1A]/45 font-medium mt-1.5 block">
                Đề đang mở
              </span>
            </div>
            <div>
              <span className="font-serif text-3xl font-bold text-[#14532D] block leading-none">
                {formatAttempts(totalAttempts)}
              </span>
              <span className="text-2xs text-[#1A1A1A]/45 font-medium mt-1.5 block">
                Lượt làm bài
              </span>
            </div>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-black/10 rounded-2xl">
            <p className="text-sm text-[#1A1A1A]/55">Chưa có đề nghe nào được mở.</p>
          </div>
        ) : (
          <ListeningCatalog tests={tests} />
        )}
      </div>
    </main>
  );
}
