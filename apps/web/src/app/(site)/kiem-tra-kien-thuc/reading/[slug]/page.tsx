import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getExamOutline } from "../../../../../features/practice/server/readingRepository";
import ReadingExamGate from "../../../../../features/practice/ui/ReadingExamGate";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const outline = await getExamOutline("passage", slug);

  if (!outline) return { title: "Không tìm thấy đề | HNT.IELTS" };

  return {
    title: `${outline.title} | Luyện Reading IELTS`,
    description: `Bài luyện Reading IELTS: ${outline.title} — ${outline.questionCount} câu, ${Math.round(
      outline.durationSeconds / 60,
    )} phút, chấm điểm và giải thích tự động.`,
  };
}

export default async function ReadingTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Chỉ bìa đề: tên, số câu, thời gian. Bài đọc và câu hỏi tải khi bấm bắt đầu,
  // nên đồng hồ không chạy trong lúc học sinh còn đang đọc hướng dẫn.
  const outline = await getExamOutline("passage", slug);
  if (!outline) notFound();

  return (
    <main className="relative z-10 pt-20 pb-16 bg-[#FAF9F6] min-h-screen">
      <ReadingExamGate outline={outline} />
    </main>
  );
}
