import Link from "next/link";
import Reveal from "./Reveal";
import {
  Stethoscope,
  Target,
  TrendingUp,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  ArrowRight,
} from "lucide-react";

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

// Bảng "Skill → Cách học" — nguyên văn theo Google Doc cấu trúc website
const SKILLS = [
  {
    icon: BookOpen,
    name: "Reading",
    description:
      "Học sinh được hướng dẫn cách tiếp cận từng dạng bài từ dễ đến khó, xác định vị trí thông tin, nhận diện paraphrase và phân tích nguyên nhân sai. Trọng tâm là đọc hiểu và xử lý thông tin, thay vì phụ thuộc vào tips, tricks hay học mẹo.",
  },
  {
    icon: Headphones,
    name: "Listening",
    description:
      "Mỗi lỗi sai được phân tích để xác định nguyên nhân: không nghe được âm, không nhận ra paraphrase, mất tập trung hay dùng sai chiến thuật. Từ đó, học sinh xây dựng cách nghe và làm bài phù hợp với từng dạng câu hỏi.",
  },
  {
    icon: PenLine,
    name: "Writing",
    description:
      "Học sinh phát triển từ câu → đoạn → bài hoàn chỉnh, học cấu trúc và cách triển khai từng dạng Task 1 & Task 2. Mỗi bài viết được chấm theo 4 tiêu chí IELTS và lỗi cá nhân được theo dõi để tránh lặp lại ở những bài sau.",
  },
  {
    icon: Mic,
    name: "Speaking",
    description:
      "Tập trung vào phát triển ý, phản xạ và khả năng diễn đạt tự nhiên. Học sinh không cần học thuộc bài mẫu hay cố sử dụng từ vựng phức tạp, mà được hướng dẫn cách xây dựng câu trả lời dựa trên trải nghiệm của chính mình.",
  },
] as const;

export default function TeachingMethod() {
  return (
    <section id="phuong-phap" className="py-16 md:py-20 bg-mist-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header căn giữa theo Figma */}
        <Reveal className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-4">
          <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
            Phương Pháp Giảng Dạy
          </span>
          <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-brand leading-[1.2]">
            Chẩn Đoán → Cải Thiện → Theo Dõi
          </h2>
          <p className="text-brand/60 text-sm md:text-base leading-relaxed">
            Ba bước lặp lại xuyên suốt lộ trình: biết chính xác mình yếu ở đâu, luyện đúng chỗ đó,
            và nhìn thấy sự tiến bộ qua từng tuần.
          </p>
        </Reveal>

        {/* 3 thẻ so le: thẻ giữa hạ thấp trên desktop, reveal nối đuôi nhau */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start mb-16">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal
                key={step.number}
                delay={i * 0.08}
                className={`bg-white rounded-[32px] p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 ${i === 1 ? "md:mt-14" : ""}`}
              >
                <span className="h-20 w-20 rounded-full bg-sage-3 flex items-center justify-center mb-8">
                  <Icon size={26} className="text-brand" />
                </span>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-brand">{step.title}</h3>
                  <span className="text-2xl font-bold text-brand/10 select-none">
                    {step.number}
                  </span>
                </div>
                <p className="text-sm md:text-base text-brand/60 leading-relaxed">
                  {step.description}
                </p>
              </Reveal>
            );
          })}
        </div>

        {/* Bảng Skill → Cách học: 4 kỹ năng, mỗi kỹ năng tóm tắt cách dạy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {SKILLS.map((skill, i) => {
            const Icon = skill.icon;
            return (
              <Reveal
                key={skill.name}
                delay={(i % 2) * 0.08}
                className="bg-white rounded-[28px] p-7 md:p-8 flex flex-col gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 rounded-full bg-leaf flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-brand" />
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-brand">{skill.name}</h3>
                </div>
                <p className="text-sm md:text-base text-brand/70 leading-relaxed">
                  {skill.description}
                </p>
              </Reveal>
            );
          })}
        </div>

        {/* Nút vào trang phương pháp chi tiết (theo doc) */}
        <Reveal className="text-center">
          <Link
            href="/phuong-phap"
            className="group inline-flex items-center gap-2 px-9 py-4 bg-brand hover:bg-brand-deep text-white font-bold text-sm rounded-full transition-colors duration-300 shadow-md"
          >
            Khám Phá Phương Pháp Giảng Dạy
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
