import Link from "next/link";
import {
  Wrench,
  FileCheck2,
  Mic,
  ClipboardList,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

/**
 * Homepage block "Hệ thống & Công cụ giảng dạy" — các công cụ nổi bật theo sheet
 * portfolio. Bộ đề luyện tập miễn phí (Kiểm Tra Kiến Thức) là một công cụ trong
 * lưới này chứ không phải khối riêng — thẻ của nó là thẻ duy nhất bấm được và
 * được tô đậm để phân biệt với các công cụ chỉ-giới-thiệu. Server component.
 *
 * Sheet yêu cầu "hiển thị hình ảnh 3–4 công cụ" — chưa có ảnh chụp thật nên
 * tạm dùng icon; có ảnh thì thay phần icon bằng <img> trong từng thẻ.
 */

const TOOLS = [
  {
    icon: FileCheck2,
    name: "Mock Test Feedback",
    description: "Hệ thống xuất feedback tự động",
  },
  {
    icon: Mic,
    name: "Speaking Feedback Sheet",
    description: "Hệ thống phản hồi Speaking theo từng tiêu chí",
  },
  {
    icon: ClipboardList,
    name: "Homework Tracker",
    description: "Theo dõi việc hoàn thành và kết quả bài tập",
  },
] as const;

export default function TeachingTools() {
  return (
    <section
      id="he-thong-giang-day"
      className="py-24 md:py-28 bg-white relative overflow-hidden border-b border-black/5"
    >
      {/* Soft brand glows, matching the other homepage sections */}
      <div className="absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-[#9FE870]/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#14532D]/[0.05] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs text-[#14532D] mb-3 font-medium flex items-center gap-1.5">
              <Wrench size={15} />
              Hệ Thống & Công Cụ Giảng Dạy
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
              Công Cụ Đồng Hành <br />
              Cùng Học Viên
            </h2>
            <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed mt-5">
              Mỗi buổi học đều để lại dấu vết: feedback chi tiết, tiêu chí rõ ràng và tiến độ đo
              được — không học chay, không sửa bài chung chung.
            </p>
          </div>

          <Link
            href="/kiem-tra-kien-thuc"
            className="group shrink-0 px-7 py-3.5 bg-[#14532D] hover:bg-[#052E16] text-white font-bold text-xs rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer tracking-wider uppercase inline-flex items-center gap-2"
          >
            Khám Phá Hệ Thống Giảng Dạy
            <ChevronRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className="bg-[#FAF9F6] border border-black/5 rounded-3xl p-7 md:p-8 hover:border-[#14532D]/20 hover:shadow-lg transition-all duration-300"
              >
                <span className="h-12 w-12 rounded-2xl bg-[#14532D] flex items-center justify-center mb-6">
                  <Icon size={22} className="text-[#9FE870]" />
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">{tool.name}</h3>
                <p className="text-sm text-[#1A1A1A]/65 leading-relaxed">{tool.description}</p>
              </div>
            );
          })}

          {/* Bộ đề luyện tập miễn phí — công cụ duy nhất học viên tự dùng được
              ngay, nên là thẻ duy nhất bấm được và tô nền đậm để nổi bật. */}
          <Link
            href="/kiem-tra-kien-thuc"
            className="group bg-[#14532D] rounded-3xl p-7 md:p-8 hover:bg-[#052E16] hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <span className="h-12 w-12 rounded-2xl bg-[#9FE870] flex items-center justify-center mb-6">
              <GraduationCap size={22} className="text-[#14532D]" />
            </span>
            <h3 className="font-serif text-xl font-bold text-white mb-2">
              Bộ Đề Luyện Tập Miễn Phí
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-5">
              Bấm giờ như thi thật, nộp bài là có điểm, band ước lượng và giải thích từng câu.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9FE870]">
              Vào Phòng Luyện Tập
              <ChevronRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
