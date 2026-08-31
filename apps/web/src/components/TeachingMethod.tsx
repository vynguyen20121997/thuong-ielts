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
 *
 * Bố cục đặt lại cho dễ đọc, ba điểm đáng nhớ:
 *
 * - **Ba thẻ ngang hàng.** Bản trước hạ thẻ giữa xuống 56px (`md:mt-14`), nên
 *   đọc ngang mắt phải nhảy lên–xuống–lên và ba tiêu đề không nằm trên một
 *   đường. Số thứ tự cũng thôi làm hoa văn mờ 10% nép bên phải tiêu đề: nó lên
 *   hàng trên, ghi rõ "Bước 01", vì đây là thứ tự chứ không phải trang trí.
 * - **Bốn kỹ năng thành bốn HÀNG**, tên trái / mô tả phải, thay cho lưới 2×2.
 *   Mô tả dài 4 dòng nhồi vào cột hẹp là chỗ khó đọc nhất của khối cũ; trải
 *   ngang thì còn 2 dòng, và bốn cái tên xếp thẳng một cột nên lướt mắt thấy hết.
 * - **Câu chốt của mỗi mô tả tô đậm** (`emphasis`). Chữ giữ nguyên văn theo
 *   Google Doc, chỉ tách câu cuối ra để ai đọc vội nắm được luận điểm.
 *
 * Server component: tĩnh hoàn toàn, JS duy nhất là `Reveal`.
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

/**
 * Bảng "Skill → Cách học" — nguyên văn theo Google Doc cấu trúc website.
 * `lead` + `emphasis` là MỘT đoạn của tài liệu, cắt ở dấu chấm cuối để câu chốt
 * được tô đậm. Ghép lại phải ra đúng đoạn gốc — đừng viết lại một trong hai.
 */
const SKILLS = [
  {
    icon: BookOpen,
    name: "Reading",
    lead: "Học sinh được hướng dẫn cách tiếp cận từng dạng bài từ dễ đến khó, xác định vị trí thông tin, nhận diện paraphrase và phân tích nguyên nhân sai.",
    emphasis:
      "Trọng tâm là đọc hiểu và xử lý thông tin, thay vì phụ thuộc vào tips, tricks hay học mẹo.",
  },
  {
    icon: Headphones,
    name: "Listening",
    lead: "Mỗi lỗi sai được phân tích để xác định nguyên nhân: không nghe được âm, không nhận ra paraphrase, mất tập trung hay dùng sai chiến thuật.",
    emphasis:
      "Từ đó, học sinh xây dựng cách nghe và làm bài phù hợp với từng dạng câu hỏi.",
  },
  {
    icon: PenLine,
    name: "Writing",
    lead: "Học sinh phát triển từ câu → đoạn → bài hoàn chỉnh, học cấu trúc và cách triển khai từng dạng Task 1 & Task 2.",
    emphasis:
      "Mỗi bài viết được chấm theo 4 tiêu chí IELTS và lỗi cá nhân được theo dõi để tránh lặp lại ở những bài sau.",
  },
  {
    icon: Mic,
    name: "Speaking",
    lead: "Tập trung vào phát triển ý, phản xạ và khả năng diễn đạt tự nhiên.",
    emphasis:
      "Học sinh không cần học thuộc bài mẫu hay cố sử dụng từ vựng phức tạp, mà được hướng dẫn cách xây dựng câu trả lời dựa trên trải nghiệm của chính mình.",
  },
] as const;

export default function TeachingMethod() {
  return (
    <section id="phuong-phap" className="py-16 md:py-24 bg-mist-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Đầu khối căn trái: tiêu đề và câu dẫn nằm CẠNH nhau, không chồng lên nhau giữa trang */}
        <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 md:items-end mb-12 md:mb-14">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
              Phương pháp giảng dạy
            </span>
            <h2 className="font-serif text-3xl md:text-[46px] font-bold tracking-tight text-brand leading-[1.12]">
              Chẩn đoán → Cải thiện → Theo dõi
            </h2>
          </div>
          <p className="text-brand/70 text-base md:text-lg leading-relaxed md:pb-1.5">
            Ba bước lặp lại xuyên suốt lộ trình: biết chính xác mình yếu ở đâu, luyện đúng chỗ đó,
            và nhìn thấy sự tiến bộ qua từng tuần.
          </p>
        </Reveal>

        {/* Ba bước NGANG HÀNG. Bước 03 tô đậm vòng icon vì nó là bước đóng vòng lặp. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 mb-14 md:mb-16">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const last = i === STEPS.length - 1;
            return (
              <Reveal
                key={step.number}
                delay={i * 0.08}
                className="bg-white rounded-[28px] p-8 md:p-9 flex flex-col gap-3.5 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`h-13 w-13 rounded-full flex items-center justify-center shrink-0 ${last ? "bg-leaf" : "bg-sage-3"}`}
                  >
                    <Icon size={24} className={last ? "text-brand-deep" : "text-brand"} />
                  </span>
                  <span className="font-mono text-2xs font-bold uppercase tracking-[0.06em] text-brand/40">
                    Bước {step.number}
                  </span>
                </div>
                <h3 className="font-serif text-xl md:text-[21px] font-bold text-brand leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base text-brand/70 leading-relaxed">
                  {step.description}
                </p>
              </Reveal>
            );
          })}
        </div>

        {/* Bốn kỹ năng: mỗi kỹ năng một HÀNG, tên trái / mô tả phải */}
        <div className="mb-12 md:mb-14">
          <span className="block text-sm font-semibold uppercase tracking-[0.1em] text-brand/45 mb-5">
            Bốn kỹ năng, bốn cách học
          </span>
          <div className="flex flex-col gap-2.5">
            {SKILLS.map((skill, i) => {
              const Icon = skill.icon;
              return (
                <Reveal
                  key={skill.name}
                  delay={i * 0.06}
                  y={20}
                  className="bg-white rounded-[24px] p-7 md:px-9 md:py-8 grid grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)] gap-4 md:gap-11 md:items-start"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="h-11 w-11 rounded-full bg-leaf flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-brand-deep" />
                    </span>
                    <h3 className="font-serif text-xl md:text-[22px] font-bold text-brand">
                      {skill.name}
                    </h3>
                  </div>
                  <p className="text-sm md:text-base text-brand/70 leading-relaxed text-pretty">
                    {skill.lead}{" "}
                    <strong className="font-semibold text-brand">{skill.emphasis}</strong>
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Nút vào trang phương pháp chi tiết (theo doc) */}
        <Reveal className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <Link
            href="/phuong-phap"
            className="group inline-flex items-center justify-center gap-2 px-9 py-4 bg-brand hover:bg-brand-deep text-white font-bold text-sm rounded-full transition-colors duration-300 shadow-md"
          >
            Khám Phá Phương Pháp Giảng Dạy
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <span className="text-sm text-brand/55">Chi tiết từng kỹ năng, 22 mục.</span>
        </Reveal>
      </div>
    </section>
  );
}
