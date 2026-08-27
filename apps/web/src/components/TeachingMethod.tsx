import { Compass, Stethoscope, Target, TrendingUp, ChevronRight, ArrowRight } from "lucide-react";

/**
 * Homepage block "Phương pháp giảng dạy" — 3 bước Chẩn đoán → Cải thiện → Theo dõi.
 * Nội dung lấy nguyên văn từ sheet portfolio. Server component: tĩnh hoàn toàn,
 * không ship JS (cùng pattern với PracticeSection).
 */

const STEPS = [
  {
    number: "01",
    icon: Stethoscope,
    title: "Chẩn đoán đúng vấn đề",
    description:
      "Xác định cụ thể điểm mạnh, điểm yếu và nguyên nhân khiến học viên chưa đạt band mục tiêu.",
  },
  {
    number: "02",
    icon: Target,
    title: "Luyện tập có trọng tâm",
    description:
      "Thiết kế bài tập và phương pháp luyện tập tập trung vào những kỹ năng học viên thực sự cần cải thiện.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Theo dõi sự tiến bộ",
    description:
      "Ghi nhận lỗi, kết quả luyện tập và sự tiến bộ của học viên xuyên suốt quá trình học.",
  },
] as const;

export default function TeachingMethod() {
  return (
    <section
      id="phuong-phap"
      className="py-24 md:py-28 bg-white relative overflow-hidden border-b border-black/5"
    >
      {/* Soft brand glows, matching the other homepage sections */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-[#9FE870]/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-[#14532D]/[0.05] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-2xl mb-14">
          <span className="text-xs text-[#14532D] mb-3 font-medium flex items-center gap-1.5">
            <Compass size={15} />
            Phương Pháp Giảng Dạy
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
            Chẩn Đoán → Cải Thiện <br />→ Theo Dõi
          </h2>
          <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed mt-5">
            Ba bước lặp lại xuyên suốt lộ trình: biết chính xác mình yếu ở đâu, luyện đúng chỗ đó,
            và nhìn thấy sự tiến bộ qua từng tuần.
          </p>
        </div>

        {/* 3 bước — hàng ngang trên desktop, xếp dọc trên mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-[#FAF9F6] border border-black/5 rounded-3xl p-7 md:p-8 hover:border-[#14532D]/20 hover:shadow-lg transition-all duration-300"
              >
                {/* Mũi tên nối bước — chỉ hiện giữa các thẻ trên desktop */}
                {i < STEPS.length - 1 && (
                  <span className="hidden md:flex absolute top-1/2 -right-[26px] lg:-right-[30px] -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-black/10 items-center justify-center shadow-sm">
                    <ArrowRight size={14} className="text-[#14532D]" />
                  </span>
                )}

                <div className="flex items-center justify-between mb-6">
                  <span className="h-12 w-12 rounded-2xl bg-[#9FE870] flex items-center justify-center">
                    <Icon size={22} className="text-[#14532D]" />
                  </span>
                  <span className="font-mono text-3xl font-bold text-[#14532D]/15 select-none">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-serif text-xl md:text-2xl font-bold text-[#1A1A1A] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[#1A1A1A]/65 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Dẫn sang phần hệ thống & công cụ ngay bên dưới */}
        <a
          href="#he-thong-giang-day"
          className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#14532D] hover:bg-[#052E16] text-white font-bold text-xs rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer tracking-wider uppercase"
        >
          Khám Phá Hệ Thống Giảng Dạy
          <ChevronRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </a>
      </div>
    </section>
  );
}
