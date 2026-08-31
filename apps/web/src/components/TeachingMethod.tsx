import { Stethoscope, Target, TrendingUp } from "lucide-react";

/**
 * Homepage block "Phương pháp giảng dạy" — 3 bước Chẩn đoán → Cải thiện → Theo dõi.
 * Layout theo bản Figma: header căn giữa, 3 thẻ trắng bo lớn xếp so le (thẻ giữa
 * hạ thấp), icon trong vòng tròn xanh nhạt, số thứ tự mờ cạnh tiêu đề.
 * Server component: tĩnh hoàn toàn, không ship JS.
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
    <section id="phuong-phap" className="py-16 md:py-20 bg-[#F0F2EC] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header căn giữa theo Figma */}
        <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-4">
          <span className="text-sm font-semibold uppercase tracking-[0.1em] text-[#00230E]">
            Phương Pháp Giảng Dạy
          </span>
          <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#00210D] leading-[1.2]">
            Chẩn Đoán → Cải Thiện → Theo Dõi
          </h2>
          <p className="text-[#00230E]/60 text-sm md:text-base leading-relaxed">
            Ba bước lặp lại xuyên suốt lộ trình: biết chính xác mình yếu ở đâu, luyện đúng chỗ đó,
            và nhìn thấy sự tiến bộ qua từng tuần.
          </p>
        </div>

        {/* 3 thẻ so le: thẻ giữa hạ thấp trên desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`bg-white rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 ${i === 1 ? "md:mt-14" : ""}`}
              >
                <span className="h-20 w-20 rounded-full bg-[#DCE8D5] flex items-center justify-center mb-8">
                  <Icon size={26} className="text-[#00230E]" />
                </span>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-[#00230E]">{step.title}</h3>
                  <span className="text-2xl font-bold text-[#00230E]/10 select-none">
                    {step.number}
                  </span>
                </div>
                <p className="text-sm md:text-base text-[#00230E]/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
