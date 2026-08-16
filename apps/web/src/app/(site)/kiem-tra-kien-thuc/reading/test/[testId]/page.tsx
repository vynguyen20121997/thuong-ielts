import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireStudent } from "../../../../../../features/account/server/guard";
import { getExamOutline } from "../../../../../../features/practice/server/readingRepository";
import ReadingExamGate from "../../../../../../features/practice/ui/ReadingExamGate";

/**
 * Thi trọn một test: ba passage, một đồng hồ, một lần chấm.
 *
 * Đoạn tĩnh "test" đứng trước `[slug]` nên không có va chạm route — và cũng
 * không có slug nào tên "test" trong DB.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ testId: string }>;
}): Promise<Metadata> {
  const { testId } = await params;
  const outline = await getExamOutline("test", testId);

  if (!outline) return { title: "Không tìm thấy đề | HNT.IELTS" };

  return {
    title: `${outline.title} — thi cả test | Luyện Reading IELTS`,
    description: `Làm trọn ${outline.parts.length} passage của ${outline.title}: ${outline.questionCount} câu, ${Math.round(
      outline.durationSeconds / 60,
    )} phút, chấm điểm và giải thích tự động.`,
  };
}

export default async function ReadingFullTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  await requireStudent(`/kiem-tra-kien-thuc/reading/test/${testId}`);

  // Chỉ lấy bìa đề. Nội dung bài đọc tải sau, khi học sinh bấm bắt đầu.
  const outline = await getExamOutline("test", testId);
  if (!outline) notFound();

  return (
    <main className="relative z-10 pt-20 pb-16 bg-[#FAF9F6] min-h-screen">
      <ReadingExamGate outline={outline} />
    </main>
  );
}
