import Link from "next/link";
import Reveal from "./Reveal";
import {
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
    <section id="phuong-phap" className="relative overflow-hidden bg-mist pt-16 pb-14 md:pt-24 md:pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Đầu khối căn trái: tiêu đề và câu dẫn nằm CẠNH nhau, không chồng lên nhau giữa trang */}
        <Reveal className="mb-8 md:mb-10">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
              Phương pháp giảng dạy
            </span>
            <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-brand md:text-[46px] md:whitespace-nowrap">
                Học bài bản &amp; đi sâu vào bản chất
              </h2>
              <Link
                href="/phuong-phap"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-md transition-colors duration-300 hover:bg-brand-deep"
              >
                <NavigationButtonLabel>Chi tiết Phương pháp Giảng dạy</NavigationButtonLabel>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
            <div>
              <p className="max-w-3xl text-sm leading-relaxed text-brand/65 md:text-base">
                Không học mẹo, không phụ thuộc bài mẫu. Tại Thương Hồ&apos;s Class, khả năng tư duy phản biện &amp; tính cá nhân của học viên được đề cao và thúc đẩy phát triển để các bạn có thể giải thích được đáp án, lựa chọn cách tiếp cận phù hợp và đưa câu chuyện thật của bản thân vào bài làm.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Bốn kỹ năng: ảnh hiện sẵn, rê chuột mới mở phần mô tả. Trước đây ảnh
            cũng ẩn theo mô tả, nên lúc nghỉ bốn thẻ chỉ là bốn ô trắng trống. */}
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
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
                  className="group relative h-full min-h-[280px] overflow-hidden rounded-[24px] bg-white p-6 shadow-sm outline-none transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-xl focus:-translate-y-1 focus:shadow-xl md:min-h-[360px]"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-cover bg-[position:65%_center] brightness-[0.96] saturate-[0.92] transition-transform duration-700 ease-out group-hover:scale-105 group-focus:scale-105"
                      style={{ backgroundImage: `url(${skill.image})` }}
                    />
                    {/* Màn trắng lúc nghỉ: chỉ dày ở NỬA DƯỚI, nơi tên kỹ năng
                        (màu brand) cần nền sáng mới đọc được. Bản trước phủ trắng
                        gần kín cả thẻ nên bốn ảnh bệch ra thành một mảng chói. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-white from-15% via-white/70 via-55% to-transparent transition-opacity duration-500 group-hover:opacity-0 group-focus:opacity-0"
                    />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/45 to-brand/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus:opacity-100" />
                  <div className="relative flex h-full min-h-[232px] flex-col md:min-h-[312px]">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-brand-deep transition-transform duration-500 group-hover:rotate-6 group-focus:rotate-6">
                        <Icon size={22} />
                      </span>
                    <div className="mt-auto">
                        <h3 className="text-[28px] font-bold leading-none text-brand transition-colors duration-500 group-hover:text-white group-focus:text-white">
                          {skill.name}
                        </h3>
                        <div className="mt-4 h-px w-full bg-brand/25 transition-colors duration-500 group-hover:bg-white/60 group-focus:bg-white/60" />
                      <div className="mt-3 grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr] group-focus:grid-rows-[1fr]">
                        <div className="overflow-hidden">
                          <p className="translate-y-4 text-xs leading-[1.5] text-white/90 opacity-0 transition-[opacity,transform] duration-500 delay-100 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
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

      </div>
    </section>
  );
}
