import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, HeartHandshake, RefreshCw, Target } from "lucide-react";
import NavigationButtonLabel from "./NavigationButtonLabel";
import PageArch from "./PageArch";

const LEARNING_STORY = [
  "Mình bắt đầu học tiếng Anh khá muộn, đến lớp 6 mới thực sự tiếp xúc với môn học này. Lúc đó mình lại được xếp vào lớp giỏi nhất của Trường Trần Đại Nghĩa, nơi nhiều bạn đã có nền tảng rất tốt và có thể nói tiếng Anh “như gió”. Cảm giác bị bỏ lại phía sau khiến mình từng rất tự ti, rồi dần chuyển thành ghét, chống đối và gần như bỏ mặc môn tiếng Anh.",
  "Đến lớp 9, vì quá sợ không đậu Phổ thông Năng khiếu, mình quyết định xây lại từ đầu theo cách đơn giản nhất: học thật nhiều từ vựng và làm thật nhiều bài tập ngữ pháp. Trong cặp lúc nào cũng có một cuốn từ điển Oxford dày cộm và một quyển sổ ghi từ mới. Mình cũng rất may mắn khi gặp được những thầy cô tiếng Anh giỏi — những người không chỉ giúp mình tiến bộ mà còn thay đổi hoàn toàn cách mình nhìn về môn học này.",
  "Từ lớp 10 trở đi, tiếng Anh của mình tiến bộ rất nhanh, phần lớn nhờ việc mình bắt đầu thực sự yêu thích nó. Vì thích văn hóa phương Tây, mình đọc, nghe và xem rất nhiều nội dung tiếng Anh một cách tự nhiên. Từ một học sinh từng sợ tiếng Anh, mình dần đạt những điểm số thuộc nhóm cao trong lớp và ở trung tâm. Một trong những cột mốc lớn nhất với mình là tiếng Anh trở thành lợi thế giúp mình đậu Đại học Ngoại thương. Sau này tiếng Anh lại tiếp tục thay đổi cuộc đời mình theo hướng tích cực hơn khi mang lại công việc phù hợp với năng lực và tâm hồn của mình hơn.",
  "Có một kỷ niệm mình vẫn nhớ rất rõ. Khi mình bắt đầu tiến bộ ở lớp 9, cô giáo từng chủ động chọn mình vào một nhóm nhỏ để học nâng cao. Nhưng vì vào sau và nền tảng không vững bằng các bạn còn lại, mình nhanh chóng bị tụt lại, hoảng sợ đến mức khóc và xin mẹ cho nghỉ. Đến giờ, đó vẫn là một trong những điều mình tiếc nhất: nếu ngày đó cố thêm một chút, có lẽ mình đã có thể đi xa hơn.",
  "Vì vậy, mình từng tự hứa với bản thân: một khi đã quay lại với tiếng Anh, mình sẽ không bỏ cuộc với nó thêm lần nào nữa. Có lẽ cũng chính vì đã từng là một học sinh chật vật và muốn bỏ cuộc, mình càng hiểu cảm giác của những bạn đang gặp khó khăn với IELTS ngày hôm nay.",
];

const TEACHING_STORY = [
  "Sau khi tốt nghiệp Đại học Ngoại thương, mình có khoảng hai năm làm việc trong lĩnh vực Truyền thông – Quảng cáo – Marketing. Trong thời gian đó, nhờ có nền tảng IELTS 7.5 từ năm hai đại học, mình thường xuyên được giao các công việc liên quan đến tiếng Anh như dịch tài liệu, biên tập nội dung và ghi chép lại các buổi phỏng vấn bằng tiếng Anh.",
  "Dù tiếng Anh luôn là một thế mạnh được tận dụng trong công việc, mình lại không thực sự tìm thấy nhiều niềm vui hay cảm giác gắn bó với công việc văn phòng. Trái lại, việc học IELTS sau giờ làm lại trở thành một sở thích mà mình rất nghiêm túc theo đuổi. Năm 2019, sau khi đạt IELTS Overall 8.5, mình quyết định thực hiện một bước chuyển lớn: rời lĩnh vực cũ để bắt đầu giảng dạy IELTS.",
  "Những ngày đầu đi dạy cũng không hề dễ dàng. Mình từng khá loay hoay khi nhận ra rằng giỏi tiếng Anh và biết cách dạy tiếng Anh là hai chuyện rất khác nhau. Nhờ quá trình học hỏi từ những người quản lý, đồng nghiệp đầu tiên tại The IELTS Workshop, tiếp tục học phương pháp giảng dạy bài bản và không ngừng thử nghiệm, điều chỉnh trong lớp học, mình dần tìm được cách dạy phù hợp với bản thân.",
  "Cũng từ đó, mình nhận ra đây là công việc mà mình thực sự muốn gắn bó: truyền cảm hứng học tiếng Anh và đồng hành cùng những học viên đang gặp khó khăn với IELTS.",
];

const PRINCIPLES = [
  { icon: Target, title: "Hiệu quả luôn được đặt lên hàng đầu", text: "Mỗi hoạt động, bài tập hay phần chữa bài đều cần có mục tiêu rõ ràng và giúp học viên cải thiện đúng vấn đề mình đang gặp phải. Với mình, học nhiều không quan trọng bằng học đúng và nhìn thấy sự tiến bộ thực sự." },
  { icon: HeartHandshake, title: "Giáo viên là người đồng hành, tạo niềm vui và sự thoải mái", text: "Mình muốn lớp học là một không gian đủ thoải mái để học viên dám hỏi, dám sai và dám thử lại. Giáo viên không chỉ là người truyền đạt kiến thức mà còn là người đồng hành, giúp học viên duy trì động lực trong suốt quá trình học." },
  { icon: RefreshCw, title: "Giáo viên cũng phải không ngừng học hỏi và đổi mới", text: "Không có một phương pháp nào phù hợp mãi mãi với tất cả học viên. Vì vậy, mình luôn cố gắng quan sát, thử nghiệm, điều chỉnh và cải thiện cách dạy dựa trên phản hồi và hiệu quả thực tế trong lớp học." },
] as const;

function StorySection({ id, number, title, eyebrow, paragraphs, icon: Icon }: { id: string; number: string; title: string; eyebrow: string; paragraphs: readonly string[]; icon: typeof BookOpen }) {
  return (
    <section id={id} className="scroll-mt-28 border-t-2 border-brand/15 py-16 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
        <div><span className="font-mono text-sm font-bold tracking-[0.12em] text-brand/45">{number}</span><span className="mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-leaf text-brand"><Icon size={20} /></span></div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/60">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand md:text-4xl">{title}</h2>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-brand/75 md:text-lg">{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-brand/10 bg-mist">
        <PageArch />
        <div className="absolute -right-24 top-8 h-80 w-80 rounded-full bg-leaf/35 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-28 md:px-12 md:pb-24 md:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/60">Về giáo viên</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand md:text-6xl">Hồ Ngọc Thương</h1>
            <p className="mt-4 text-lg font-semibold text-brand/75">IELTS Teacher · CELTA-certified</p>
            <div className="mt-8 max-w-xl space-y-4 text-base leading-relaxed text-brand/75 md:text-lg">
              <p>Mình là Hồ Ngọc Thương, giáo viên IELTS với định hướng giảng dạy tập trung vào hiểu bản chất – luyện tập có mục tiêu – theo dõi tiến bộ bằng dữ liệu.</p>
              <p>Thay vì chỉ cung cấp mẹo làm bài hoặc những công thức có sẵn, mình muốn học viên hiểu mình đang sai ở đâu, vì sao sai và cần làm gì tiếp theo để tiến bộ.</p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/kinh-nghiem-giang-day" className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-deep"><NavigationButtonLabel>Xem kinh nghiệm giảng dạy</NavigationButtonLabel> <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
              <Link href="/phuong-phap" className="group inline-flex items-center gap-2 rounded-full border border-brand/20 px-5 py-3 text-sm font-bold text-brand transition-colors hover:bg-sage"><NavigationButtonLabel>Tìm hiểu phương pháp học</NavigationButtonLabel> <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-3 rounded-[34px] border border-brand/15" />
            <img src="/images/about/teacher-hero-placeholder.png" alt="Ảnh minh họa tạm thời cho giáo viên Hồ Ngọc Thương" className="relative aspect-[4/5] w-full rounded-[28px] object-cover shadow-[0_22px_50px_rgba(20,83,45,0.15)]" />
            <p className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 px-4 py-3 text-xs leading-relaxed text-brand/70 shadow-sm">Ảnh minh họa tạm thời — có thể thay bằng ảnh chân dung của cô sau này.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <StorySection id="hanh-trinh" number="01" eyebrow="Hành trình học tiếng Anh của mình" title="Mình cũng từng là một học sinh rất sợ tiếng Anh" paragraphs={LEARNING_STORY} icon={BookOpen} />
        <StorySection id="kinh-nghiem" number="02" eyebrow="Mình đến với việc dạy tiếng Anh như thế nào?" title="Từ công việc văn phòng chuyển sang giảng dạy" paragraphs={TEACHING_STORY} icon={BriefcaseBusiness} />

        <section className="scroll-mt-28 border-t-2 border-brand/15 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
            <div><span className="font-mono text-sm font-bold tracking-[0.12em] text-brand/45">03</span></div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/60">Quan điểm giảng dạy</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand md:text-4xl">Hiệu quả – Đồng hành – Không ngừng cải thiện</h2>
              <div className="mt-8 grid gap-4">{PRINCIPLES.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-brand/10 bg-mist p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-brand"><Icon size={19} /></span><h3 className="mt-4 text-lg font-bold text-brand">{title}</h3><p className="mt-2 text-sm leading-relaxed text-brand/75 md:text-base">{text}</p></article>)}</div>
            </div>
          </div>
        </section>

        <section className="border-t-2 border-brand/15 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
            <div><span className="font-mono text-sm font-bold tracking-[0.12em] text-brand/45">04</span></div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/60">Lời khuyên dành cho học viên</p>
              <blockquote className="mt-5 border-l-4 border-leaf pl-6"><p className="text-2xl font-bold italic leading-snug text-brand md:text-3xl">“It’s all about the journey, not the destination.”</p></blockquote>
              <div className="mt-7 space-y-4 text-base leading-relaxed text-brand/75 md:text-lg"><p>Đừng chỉ nhìn vào band điểm cuối cùng. Hãy cố gắng tiến bộ hơn chính mình một chút mỗi ngày, trân trọng những thành quả nhỏ và xem mỗi lỗi sai hay lần thất bại là một cơ hội để học thêm điều gì đó.</p><p>Chỉ cần tiếp tục tiến về phía trước, kết quả sẽ đến như một hệ quả của cả quá trình.</p></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
