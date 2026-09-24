import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { requireStudent } from "../../../features/account/server/guard";
import VocabHome from "../../../features/vocab/ui/VocabHome";

export const metadata: Metadata = {
  title: "Học từ vựng IELTS | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Học từ vựng IELTS theo lịch giãn cách: thẻ chỉ quay lại đúng lúc bạn sắp quên. Bộ thẻ của cô và bộ bạn tự tạo.",
};

export const dynamic = "force-dynamic";

/*
  BẮT đăng nhập, khác trang Writing.

  Lịch ôn của từng thẻ gắn với từng người và tích dần qua nhiều tháng — không
  có danh tính thì không có lịch, mà không có lịch thì cả tính năng này vô
  nghĩa. Writing thì khác: bài viết nằm trong trình duyệt của chính em ấy.
*/
export default async function VocabPage() {
  await requireStudent("/hoc-tu-vung");

  return (
    <main className="relative z-10 min-h-screen bg-white pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-6xl gutter">
        <nav className="mb-6 flex items-center gap-1.5 text-2xs font-medium text-ink/65">
          <Link
            href="/kiem-tra-kien-thuc"
            className="transition-colors hover:text-brand"
          >
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Học từ vựng</span>
        </nav>
        <VocabHome />
      </div>
    </main>
  );
}
