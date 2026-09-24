import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { questionById } from "../../../../../features/speaking/domain/bank";
import RecordDesk from "../../../../../features/speaking/ui/RecordDesk";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const q = questionById(slug);
  if (!q) return { title: "Không tìm thấy câu hỏi | HNT.IELTS" };
  return {
    title: `${q.prompt} | Luyện Speaking IELTS`,
    description: `Speaking Part ${q.part} · ${q.topic}. Thu âm câu trả lời, nghe lại và nộp cho giáo viên.`,
  };
}

/*
  Không bắt đăng nhập, cùng lý do với Writing: chưa có điểm gắn với học viên,
  file thu âm nằm trong trình duyệt. Khi nối bộ chấm và lưu file lên server
  thì thêm `requireStudentOrGuest` như Reading.
*/
export default async function SpeakingRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { slug } = await params;
  const q = questionById(slug);
  if (!q) notFound();

  /* Kết quả mẫu chỉ ở dev, để xem bảng điểm khi bộ chấm chưa nối. */
  const { demo } = await searchParams;
  const demoResult =
    process.env.NODE_ENV === "development" && demo === "1"
      ? {
          kind: "graded" as const,
          result: (
            await import("../../../../../features/speaking/infrastructure/demo")
          ).DEMO_RESULT,
        }
      : undefined;

  return (
    <main className="relative z-10 min-h-screen bg-white pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-2xs font-medium text-ink/40">
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
          <span className="text-brand">
            Part {q.part} · {q.topic}
          </span>
          <span className="ml-auto font-mono font-bold text-ink/50">
            Bộ đề {q.set}
          </span>
        </nav>
        <RecordDesk question={q} demoResult={demoResult} />
      </div>
    </main>
  );
}
