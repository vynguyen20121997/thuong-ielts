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
    image: "/images/skills/reading-study.png",
    before:
      "Học sinh được hướng dẫn cách tiếp cận từng dạng bài từ dễ đến khó, xác định vị trí thông tin, nhận diện paraphrase và phân tích nguyên nhân sai. Trọng tâm là ",
    emphasis: "đọc hiểu và xử lý thông tin",
    after: ", thay vì phụ thuộc vào tips, tricks hay học mẹo.",
  },
  {
    icon: Headphones,
    name: "Listening",
    image: "/images/skills/listening-study.png",
    before: "Mỗi lỗi sai được phân tích để xác định nguyên nhân: ",
    emphasis: "không nghe được âm, không nhận ra paraphrase, mất tập trung hay dùng sai chiến thuật.",
    after: " Từ đó, học sinh xây dựng cách nghe và làm bài phù hợp với từng dạng câu hỏi.",
  },
  {
    icon: PenLine,
    name: "Writing",
    image: "/images/skills/writing-study.png",
    before: "Học sinh phát triển từ ",
    emphasis: "câu → đoạn → bài hoàn chỉnh",
    after:
      ", học cấu trúc và cách triển khai từng dạng Task 1 & Task 2. Mỗi bài viết được chấm theo 4 tiêu chí IELTS và lỗi cá nhân được theo dõi để tránh lặp lại ở những bài sau.",
  },
  {
    icon: Mic,
    name: "Speaking",
    image: "/images/skills/speaking-study.png",
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

        <Reveal className="mb-5 flex flex-col gap-1.5 md:mb-6">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand/55">
            Quy trình xuyên suốt mỗi lớp học
          </span>
          <p className="max-w-2xl text-sm leading-relaxed text-brand/65">
            Dù học kỹ năng nào, học viên cũng được chẩn đoán đúng vấn đề, luyện tập có trọng tâm và theo dõi tiến bộ qua từng giai đoạn.
          </p>
        </Reveal>

        {/* Ba nguyên tắc cốt lõi của lộ trình học. */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:mb-10 md:grid-cols-3 md:gap-7">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal
                key={step.title}
                delay={i * 0.08}
                className={`group relative min-h-[360px] ${i === 1 ? "md:mt-14" : ""}`}
              >
                <div
                  className={`absolute inset-x-3 flex min-h-[190px] flex-col items-center justify-center rounded-[28px] bg-leaf px-7 text-center transition-all duration-500 ease-out md:px-8 ${
                    i === 1
                      ? "bottom-3 rotate-[3deg] group-hover:-translate-y-40 group-hover:-rotate-[10deg]"
                      : `top-3 ${i === 2 ? "rotate-[3deg]" : "rotate-[-2deg]"} group-hover:translate-y-40 group-hover:rotate-[10deg]`
                  }`}
                >
                  <p className="translate-y-2 text-sm leading-relaxed text-brand opacity-0 transition-all duration-300 delay-75 group-hover:translate-y-0 group-hover:opacity-100">
                    {step.description}
                  </p>
                </div>
                <div
                  className={`relative z-10 flex min-h-[190px] flex-col rounded-[28px] bg-white p-7 shadow-sm transition-all duration-500 ease-out group-hover:shadow-[0_18px_35px_rgba(20,83,45,0.14)] md:p-8 ${
                    i === 1 ? "group-hover:rotate-[10deg]" : "group-hover:-rotate-[10deg]"
                  }`}
                >
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

        <Reveal className="mb-6 border-t border-brand/15 pt-7 md:mb-7 md:pt-8">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand/55">
            Phương pháp theo từng kỹ năng
          </span>
          <h3 className="mt-2 font-serif text-2xl font-bold text-brand md:text-3xl">
            Mỗi kỹ năng cần một cách học riêng
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand/65 md:text-base">
            Cùng một quy trình, nhưng cách tiếp cận Reading, Listening, Writing và Speaking được điều chỉnh theo đúng đặc thù của từng kỹ năng.
          </p>
        </Reveal>

        {/* Bốn kỹ năng: thẻ ảnh mở ra khi rê chuột. */}
        <div className="mb-12 md:mb-14">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5">
            {SKILLS.map((skill, i) => {
              const Icon = skill.icon;
              return (
                <Reveal
                  key={skill.name}
                  delay={i * 0.06}
                  y={20}
                  className="h-full"
                >
                  <div
                    tabIndex={0}
                    className="group relative h-full min-h-[292px] overflow-hidden rounded-[24px] bg-white p-6 shadow-sm outline-none transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-xl focus:-translate-y-1 focus:shadow-xl md:min-h-[380px] md:p-8"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 scale-110 bg-cover bg-center opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus:scale-100 group-focus:opacity-100"
                      style={{ backgroundImage: `url(${skill.image})` }}
                    />
                    <div className="absolute inset-0 bg-brand/0 transition-colors duration-500 group-hover:bg-brand/70 group-focus:bg-brand/70" />
                    <div className="relative flex h-full min-h-[244px] flex-col justify-between md:min-h-[316px]">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-brand-deep transition-transform duration-500 group-hover:rotate-6 group-focus:rotate-6">
                        <Icon size={22} />
                      </span>
                      <div className="transition-transform duration-500 ease-out group-hover:-translate-y-14 group-focus:-translate-y-14">
                        <h3 className="font-serif text-[28px] font-bold leading-none text-brand transition-colors duration-500 group-hover:text-white group-focus:text-white">
                          {skill.name}
                        </h3>
                        <div className="mt-4 h-px w-full bg-brand/25 transition-colors duration-500 group-hover:bg-white/60 group-focus:bg-white/60" />
                        <div className="mt-4 grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr] group-focus:grid-rows-[1fr]">
                          <div className="overflow-hidden">
                            <p className="translate-y-7 text-sm leading-relaxed text-white/90 opacity-0 transition-[opacity,transform] duration-500 delay-100 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
                              {skill.before}
                              <strong className="font-semibold text-white">{skill.emphasis}</strong>
                              {skill.after}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
