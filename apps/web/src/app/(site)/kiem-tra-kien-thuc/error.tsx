"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Error boundary for the whole practice section.
 *
 * Exam content lives only in Postgres — there is no bundled fallback copy on
 * purpose. So when a read fails, the student sees an honest "we could not load
 * this" instead of silently stale exercises, and the real error reaches the
 * server log rather than a raw Next.js crash page.
 */
export default function PracticeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Practice section failed to render:", error);
  }, [error]);

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-[#FAF9F6] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 md:px-12 text-center">
        <span className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={24} className="text-red-500" />
        </span>

        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
          Không tải được đề luyện tập
        </h1>
        <p className="text-[#1A1A1A]/65 text-sm md:text-base leading-relaxed mt-4">
          Kết nối tới kho đề đang gặp sự cố nên tạm thời chưa hiển thị được danh sách. Bạn thử tải
          lại sau ít phút nhé — bài làm đã nộp trước đó không bị ảnh hưởng.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={reset}
            className="group px-6 py-3 bg-[#14532D] hover:bg-[#052E16] text-white font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase inline-flex items-center gap-2"
          >
            <RotateCcw
              size={14}
              className="transition-transform duration-500 group-hover:-rotate-180"
            />
            Thử lại
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-black/15 hover:border-[#14532D]/50 text-[#1A1A1A]/70 hover:text-[#14532D] font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase"
          >
            Về trang chủ
          </Link>
        </div>

        {error.digest && (
          <span className="text-2xs text-[#1A1A1A]/30 font-medium block mt-8">
            Mã lỗi: {error.digest}
          </span>
        )}
      </div>
    </main>
  );
}
