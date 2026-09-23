import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, PenLine } from "lucide-react";

import { WRITING_MINUTES, WRITING_MIN_WORDS } from "../../../../features/practice/domain/writing";
import { listWritingPrompts } from "../../../../features/practice/server/writingRepository";

import PageArch from "../../../../components/PageArch";

export const metadata: Metadata = {
  title: "Luyện Writing IELTS | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Viết IELTS Writing Task 2 có bấm giờ và đếm từ, kèm checklist tự động soi lỗi bố cục, lạc đề và thiếu ví dụ trước khi nộp cho giáo viên.",
};

/* Danh sách đề lấy từ DB lúc render — không để client fetch sau khi mount, vì
   như vậy trang commit rồi mới có nội dung. Xem `ket-qua-hoc-vien/page.tsx`. */
export const dynamic = "force-dynamic";

export default async function WritingCatalogPage() {
  const prompts = await listWritingPrompts();

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <PageArch />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <nav className="flex items-center gap-1.5 text-2xs font-medium text-ink/40 mb-6">
          <Link href="/kiem-tra-kien-thuc" className="hover:text-brand transition-colors">
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Writing</span>
        </nav>

        <div className="max-w-2xl mb-10">
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand mb-3 flex items-center gap-1.5">
            <PenLine size={15} />
            Kỹ năng Viết
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
            Luyện Writing <br className="hidden md:block" />
            Task 2
          </h1>
          <p className="text-ink/70 text-sm md:text-base leading-relaxed mt-5">
            Viết trong {WRITING_MINUTES} phút, tối thiểu {WRITING_MIN_WORDS} từ, có bấm giờ và đếm
            từ như phòng thi. Viết xong bấm một nút để máy soi trước những lỗi dễ thấy — lạc đề,
            thiếu kết bài, ý không có ví dụ — rồi mới gửi bài cho cô chấm theo barem.
          </p>
        </div>

        {/* Nói thẳng giới hạn ngay trên danh sách, không giấu xuống cuối trang:
            học sinh phải biết trước rằng đây không phải nơi lấy band điểm. */}
        <p className="max-w-2xl text-2xs text-ink/45 leading-relaxed mb-10 rounded-xl border border-black/5 bg-[#FAFAF8] px-4 py-3">
          Phần kiểm tra tự động <b className="text-ink/70">không chấm band</b> và không thay được
          người chấm. Writing được chấm theo bốn tiêu chí mà chỉ giáo viên cân nhắc cùng lúc được;
          máy chỉ giúp bạn không nộp một bài còn thiếu những thứ sửa được trong năm phút.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((p) => (
            <Link
              key={p.id}
              href={`/kiem-tra-kien-thuc/writing/${p.id}`}
              className="group rounded-2xl border border-black/5 bg-white p-5 hover:border-brand/30 hover:shadow-sm transition-all flex flex-col"
            >
              <span className="text-2xs font-medium text-brand bg-leaf/30 rounded-full px-2.5 py-1 self-start">
                {p.topic}
              </span>
              <h2 className="text-lg font-bold tracking-tight text-ink mt-4">{p.title}</h2>
              {/* Cắt còn 3 dòng: đề thật có cả phần hướng dẫn nên dài ngắn rất
                  khác nhau, để nguyên thì các thẻ trong lưới cao thấp lệch hẳn. */}
              <p className="text-sm text-ink/60 leading-relaxed mt-2 flex-1 line-clamp-3 whitespace-pre-line">
                {p.prompt}
              </p>
              <span className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-2xs font-medium text-ink/45">
                Task 2 · {WRITING_MINUTES} phút
                <ArrowRight
                  size={15}
                  className="text-brand transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
