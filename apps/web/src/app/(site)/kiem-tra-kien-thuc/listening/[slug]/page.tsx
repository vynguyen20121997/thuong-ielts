import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getListeningTestBySlug } from "../../../../../features/practice/server/listeningRepository";
import ListeningPlayer from "../../../../../features/practice/ui/ListeningPlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getListeningTestBySlug(slug);
  if (!test) return { title: "Không tìm thấy đề | HNT.IELTS" };
  return {
    title: `${test.title} | Luyện Listening IELTS`,
    description: `Bài luyện Listening IELTS: ${test.title} — ${test.questionCount} câu, ${Math.round(
      test.durationSeconds / 60
    )} phút, có file nghe và chấm điểm tự động.`,
  };
}

export default async function ListeningTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Public projection — the answer key stays in the database.
  const test = await getListeningTestBySlug(slug);
  if (!test) notFound();

  return (
    <main className="relative z-10 pt-20 pb-16 bg-[#FAF9F6] min-h-screen">
      <ListeningPlayer test={test} />
    </main>
  );
}
