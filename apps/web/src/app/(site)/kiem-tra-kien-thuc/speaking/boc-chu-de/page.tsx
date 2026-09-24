import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import TopicDraw from "../../../../../features/speaking/ui/TopicDraw";

export const metadata: Metadata = {
  title: "Bốc chủ đề Speaking ngẫu nhiên | HNT.IELTS",
  description:
    "Bốc một chủ đề Speaking, đọc kiến thức nền và từ vựng trong 5–10 phút theo part, rồi trả lời khi bảng đã ẩn đi.",
};

export default function TopicDrawPage() {
  return (
    <main className="relative z-10 min-h-screen bg-white pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-2xs font-medium text-ink/40">
          <Link
            href="/kiem-tra-kien-thuc"
            className="transition-colors hover:text-brand"
          >
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <Link
            href="/kiem-tra-kien-thuc/speaking"
            className="transition-colors hover:text-brand"
          >
            Speaking
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Bốc chủ đề</span>
        </nav>
        <TopicDraw />
      </div>
    </main>
  );
}
