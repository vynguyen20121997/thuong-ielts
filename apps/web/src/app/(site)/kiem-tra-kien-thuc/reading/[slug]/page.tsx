import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getReadingTestBySlug } from "../../../../../features/practice/server/readingRepository";
import ReadingPlayer from "../../../../../features/practice/ui/ReadingPlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getReadingTestBySlug(slug);

  if (!test) return { title: "Không tìm thấy đề | HNT.IELTS" };

  return {
    title: `${test.title} | Luyện Reading IELTS`,
    description: `Bài luyện Reading IELTS: ${test.title} — ${test.questionCount} câu, ${Math.round(
      test.durationSeconds / 60
    )} phút, chấm điểm và giải thích tự động.`,
  };
}

export default async function ReadingTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Server fetch of the PUBLIC projection — the answer key stays in the
  // database and is only read by the submit route.
  const test = await getReadingTestBySlug(slug);
  if (!test) notFound();

  return (
    <main className="relative z-10 pt-20 pb-16 bg-[#FAF9F6] min-h-screen">
      <ReadingPlayer test={test} />
    </main>
  );
}
