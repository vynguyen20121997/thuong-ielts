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
import NavigationButtonLabel from "./NavigationButtonLabel";

/**
 * Homepage block "Phương pháp giảng dạy".
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
 * - **Cụm trọng tâm được tô đậm** theo nội dung đã duyệt; vị trí nhấn mạnh
 *   khác nhau ở mỗi kỹ năng, không mặc định là câu cuối.
 *
 * Server component: tĩnh hoàn toàn, JS duy nhất là `Reveal`.
 */

const STEPS = [
  {
    icon: Stethoscope,
    title: "Chẩn đoán đúng vấn đề",
    description:
      "Xác định cụ thể điểm mạnh, điểm yếu và nguyên nhân khiến học viên chưa đạt band mục tiêu.",
  },
  {
    icon: Target,
    title: "Luyện tập có trọng tâm",
    description:
      "Thiết kế bài tập và phương pháp luyện tập tập trung vào những kỹ năng học viên thực sự cần cải thiện.",
  },
  {
    icon: TrendingUp,
    title: "Theo dõi sự tiến bộ",
    description:
      "Ghi nhận lỗi, kết quả luyện tập và sự tiến bộ của học viên xuyên suốt quá trình học.",
  },
] as const;

/**
 * Bảng "Skill → Cách học" — nguyên văn theo Google Doc cấu trúc website.
 * Mỗi đoạn được tách thành phần trước, cụm cần nhấn và phần sau; ghép lại phải
 * ra đúng nội dung gốc.
 */
const SKILLS = [
  {
    icon: BookOpen,
    name: "Reading",
    before:
      "Học sinh được hướng dẫn cách tiếp cận từng dạng bài từ dễ đến khó, xác định vị trí thông tin, nhận diện paraphrase và phân tích nguyên nhân sai. Trọng tâm là ",
    emphasis: "đọc hiểu và xử lý thông tin",
    after: ", thay vì phụ thuộc vào tips, tricks hay học mẹo.",
  },
  {
    icon: Headphones,
    name: "Listening",
    before: "Mỗi lỗi sai được phân tích để xác định nguyên nhân: ",
    emphasis: "không nghe được âm, không nhận ra paraphrase, mất tập trung hay dùng sai chiến thuật.",
    after: " Từ đó, học sinh xây dựng cách nghe và làm bài phù hợp với từng dạng câu hỏi.",
  },
  {
    icon: PenLine,
    name: "Writing",
    before: "Học sinh phát triển từ ",
    emphasis: "câu → đoạn → bài hoàn chỉnh",
    after:
      ", học cấu trúc và cách triển khai từng dạng Task 1 & Task 2. Mỗi bài viết được chấm theo 4 tiêu chí IELTS và lỗi cá nhân được theo dõi để tránh lặp lại ở những bài sau.",
  },
  {
    icon: Mic,
    name: "Speaking",
    before: "Tập trung vào ",
    emphasis: "phát triển ý, phản xạ và khả năng diễn đạt tự nhiên.",
    after:
      " Học sinh không cần học thuộc bài mẫu hay cố sử dụng từ vựng phức tạp, mà được hướng dẫn cách xây dựng câu trả lời dựa trên trải nghiệm của chính mình.",
  },
] as const;

export default function TeachingMethod() {
  return (
    <section id="phuong-phap" className="py-16 md:py-24 bg-mist relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Đầu khối căn trái: tiêu đề và câu dẫn nằm CẠNH nhau, không chồng lên nhau giữa trang */}
        <Reveal className="mb-12 md:mb-14">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
              Phương pháp giảng dạy
            </span>
            <h2 className="font-serif text-3xl md:text-[46px] font-bold tracking-tight text-brand leading-[1.12] md:whitespace-nowrap">
              Học bài bản &amp; đi sâu vào bản chất
            </h2>
          </div>
        </Reveal>

        {/* Ba nguyên tắc cốt lõi của lộ trình học. */}
        <div className="mb-14 grid grid-cols-1 gap-6 md:mb-16 md:grid-cols-3 md:gap-7">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={i * 0.08} className="group relative min-h-[410px]">
                <div className={`absolute inset-x-3 top-3 flex min-h-[190px] flex-col items-center justify-center rounded-[28px] bg-leaf px-7 text-center transition-all duration-500 ease-out ${i === 1 ? "-rotate-[3deg]" : i === 2 ? "rotate-[3deg]" : "rotate-[-2deg]"} group-hover:translate-y-40 group-hover:rotate-[10deg] md:px-8`}>
                  <p className="translate-y-2 text-sm leading-relaxed text-brand opacity-0 transition-all duration-300 delay-75 group-hover:translate-y-0 group-hover:opacity-100">
                    {step.description}
                  </p>
                </div>
                <div className="relative z-10 flex min-h-[190px] flex-col rounded-[28px] bg-white p-7 shadow-sm transition-all duration-500 ease-out group-hover:-rotate-[10deg] group-hover:shadow-[0_18px_35px_rgba(20,83,45,0.14)] md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-brand-deep">
                      <Icon size={22} />
                    </span>
                    <span className="font-mono text-3xl font-bold tracking-[-0.05em] text-brand/20 transition-colors duration-300 group-hover:text-brand/45">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-bold leading-snug text-brand md:text-[21px]">{step.title}</h3>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Bốn kỹ năng: mỗi kỹ năng một hàng, tên trái / mô tả phải */}
        <div className="mb-12 md:mb-14">
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
                    {skill.before}
                    <strong className="font-semibold text-brand">{skill.emphasis}</strong>
                    {skill.after}
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
            <NavigationButtonLabel>Khám Phá Phương Pháp Giảng Dạy</NavigationButtonLabel>
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
