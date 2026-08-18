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
  searchParams: Promise<{ bai?: string }>;
}) {
  const { slug } = await params;
  // `?bai=<token>` nghĩa là em vào bằng link cô gửi — luồng đó không đòi khai
  // hồ sơ và cho phép khách gõ tên. Xem `requireStudentOrGuest`.
  const { bai: token } = await searchParams;

  await requireStudentOrGuest(`/kiem-tra-kien-thuc/listening/${slug}`, token);

  // Public projection — the answer key stays in the database.
  //
  // Listening KHÔNG dùng màn chờ chung như Reading: `ListeningPlayer` đã có màn
  // hướng dẫn riêng, và nút "Bắt đầu" của nó chính là cú bấm mà trình duyệt
  // đòi để cho phép phát tiếng (`audio.play()` gọi ngay trong handler). Tách
  // nút ấy ra một màn chờ dựng trước đó là tách `play()` khỏi cử chỉ người
  // dùng — Safari chặn, và học sinh vào bài thì không nghe thấy gì.
  const test = await getListeningTestBySlug(slug);
  if (!test) notFound();

  return (
    <main className="relative z-10 pt-20 pb-16 bg-[#FAF9F6] min-h-screen">
      <ListeningPlayer test={test} />
    </main>
  );
}
