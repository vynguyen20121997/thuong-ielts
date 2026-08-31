import Link from "next/link";
import Reveal from "./Reveal";
import {
  FileCheck2,
  Mic,
  ClipboardList,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

/**
 * Homepage block "Hệ thống & Công cụ giảng dạy" — layout theo Figma: cột trái là
 * tiêu đề + mô tả + CTA, cột phải lưới 2×2 công cụ; Bộ đề luyện tập miễn phí
 * (Kiểm Tra Kiến Thức) là thẻ xanh đậm duy nhất bấm được. Server component.
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
    <section id="he-thong-giang-day" className="py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Cột trái: tiêu đề + mô tả + CTA */}
          <Reveal className="text-left flex flex-col items-start gap-5">
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
              Hệ Thống & Công Cụ Giảng Dạy
            </span>
            <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-brand leading-[1.2]">
              Công Cụ Đồng Hành <br />
              Cùng Học Viên
            </h2>
            <p className="text-brand/60 text-sm md:text-base leading-relaxed max-w-md">
              Bên cạnh nội dung bài học, giáo viên xây dựng một hệ thống theo dõi riêng để việc
              học không dừng lại ở từng buổi trên lớp. Bài tập, lỗi sai, kết quả Reading –
              Listening, feedback Speaking và các bài Mock Test đều được ghi nhận xuyên suốt quá
              trình học.
            </p>
            <p className="text-brand/60 text-sm md:text-base leading-relaxed max-w-md">
              Nhờ đó, học sinh nhìn thấy rõ mình đang sai ở đâu, lỗi nào lặp lại nhiều lần và kỹ
              năng nào đang thực sự tiến bộ, còn giáo viên có đủ dữ liệu để điều chỉnh bài học và
              bài tập phù hợp với từng giai đoạn.
            </p>
            <Link
              href="/kiem-tra-kien-thuc"
              className="group mt-3 inline-flex items-center gap-2 px-8 py-4 bg-brand hover:bg-brand-deep text-white font-semibold text-sm rounded-full transition-colors duration-300 shadow-md cursor-pointer"
            >
              Khám Phá Hệ Thống Giảng Dạy
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          {/* Cột phải: lưới 2×2 công cụ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <Reveal key={tool.name} delay={i * 0.08} className="bg-sage rounded-[28px] p-7">
                  <span className="h-14 w-14 rounded-full bg-white flex items-center justify-center mb-8 shadow-sm">
                    <Icon size={22} className="text-brand" />
                  </span>
                  <h3 className="text-lg font-bold text-brand mb-2 leading-snug">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-brand/60 leading-relaxed">{tool.description}</p>
                </Reveal>
              );
            })}

            {/* Bộ đề luyện tập miễn phí — thẻ xanh đậm, bấm được */}
            <Reveal delay={0.24}>
            <Link
              href="/kiem-tra-kien-thuc"
              className="group h-full bg-brand hover:bg-brand-deep rounded-[28px] p-7 transition-colors duration-300 flex flex-col"
            >
              <span className="h-14 w-14 rounded-full bg-sage-3/20 flex items-center justify-center mb-8">
                <GraduationCap size={22} className="text-[#C9E3BE]" />
              </span>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                Bộ Đề Luyện Tập Miễn Phí
              </h3>
              <p className="text-sm text-[#C9E3BE]/80 leading-relaxed mb-6">
                Bấm giờ như thi thật, nộp bài là có điểm, band ước lượng và giải thích từng câu.
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-leaf">
                Vào Phòng Luyện Tập
                <ArrowRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
