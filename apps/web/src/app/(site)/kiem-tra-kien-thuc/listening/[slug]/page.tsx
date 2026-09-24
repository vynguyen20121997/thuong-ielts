import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireStudentOrGuest } from "../../../../../features/account/server/guard";
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
      test.durationSeconds / 60,
    )} phút, có file nghe và chấm điểm tự động.`,
  };
}

export default async function ListeningTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bai?: string; part?: string }>;
}) {
  const { slug } = await params;
  // `?bai=<token>` nghĩa là em vào bằng link cô gửi — luồng đó không đòi khai
  // hồ sơ và cho phép khách gõ tên. Xem `requireStudentOrGuest`.
  const { bai: token, part: rawPart } = await searchParams;

  await requireStudentOrGuest(`/phong-luyen-tap/listening/${slug}`, token);

  // Public projection — the answer key stays in the database.
  //
  // Listening KHÔNG dùng màn chờ chung như Reading: `ListeningPlayer` đã có màn
  // hướng dẫn riêng, và nút "Bắt đầu" của nó chính là cú bấm mà trình duyệt
  // đòi để cho phép phát tiếng (`audio.play()` gọi ngay trong handler). Tách
  // nút ấy ra một màn chờ dựng trước đó là tách `play()` khỏi cử chỉ người
  // dùng — Safari chặn, và học sinh vào bài thì không nghe thấy gì.
  const test = await getListeningTestBySlug(slug);
  if (!test) notFound();
  const part = Number(rawPart);
  const selectedPart = Number.isInteger(part) && test.sections.includes(part) ? part : null;
  const partTitle = selectedPart ? test.topic.split("·")[selectedPart - 1]?.trim() : "";
  const playerTest = selectedPart
    ? {
        ...test,
        title: `${test.title} · Part ${selectedPart}${partTitle ? `: ${partTitle}` : ""}`,
        questions: test.questions.filter((question) => question.section === selectedPart),
        sections: [selectedPart],
        questionCount: test.questions.filter((question) => question.section === selectedPart).length,
        durationSeconds: Math.max(600, Math.round(test.durationSeconds / Math.max(1, test.sections.length))),
        audio: test.audio.filter((track) => track.part === undefined || track.part === selectedPart),
        practicePart: selectedPart,
      }
    : test;

  return (
    <main className="relative z-10 pt-20 pb-16 bg-white min-h-screen">
      <ListeningPlayer test={playerTest} />
    </main>
  );
}
