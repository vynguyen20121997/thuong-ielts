import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  getWritingPrompt,
  listKnowledgeTopics,
} from "../../../../../features/practice/server/writingRepository";
import WritingGate from "../../../../../features/practice/ui/WritingGate";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getWritingPrompt(slug);
  if (!prompt) return { title: "Không tìm thấy đề | HNT.IELTS" };

  return {
    title: `${prompt.title} | Luyện Writing IELTS`,
    description: `Đề IELTS Writing Task 2: ${prompt.title}. Viết có bấm giờ, đếm từ và checklist soi lỗi trước khi nộp.`,
  };
}

/*
  CỐ Ý không gọi `requireStudentOrGuest` như Reading/Listening.

  Hai kỹ năng kia phải chặn vì mỗi lượt sinh ra một bản ghi điểm gắn với học
  viên, và đáp án chỉ được mở sau khi nộp. Ở đây không có điểm, không có đáp án
  để giấu — bài viết là của chính học sinh, nằm trong trình duyệt của em ấy.
  Bắt đăng nhập chỉ để gõ một đoạn văn là dựng thêm một cánh cửa không giữ gì.

  Đổi ý thì thêm một dòng `await requireStudentOrGuest(...)` ở đầu hàm, giống
  `reading/[slug]/page.tsx`.
*/
export default async function WritingTaskPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prompt = await getWritingPrompt(slug);
  if (!prompt) notFound();

  /* Chỉ tên chủ đề, không kèm nội dung — xem chú thích ở `listKnowledgeTopics`. */
  const knowledge = await listKnowledgeTopics(prompt.id);

  return (
    <main className="relative z-10 pt-24 md:pt-28 pb-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <nav className="flex items-center gap-1.5 text-2xs font-medium text-ink/40 mb-6">
          <Link href="/kiem-tra-kien-thuc" className="hover:text-brand transition-colors">
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <Link href="/kiem-tra-kien-thuc/writing" className="hover:text-brand transition-colors">
            Writing
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand truncate">{prompt.title}</span>
        </nav>

        <WritingGate prompt={prompt} knowledge={knowledge} />
      </div>
    </main>
  );
}
