import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import NavigationButtonLabel from "../../../components/NavigationButtonLabel";

export const metadata: Metadata = { title: "Kinh nghiệm giảng dạy | Thương Hồ's Class" };

const MILESTONES = [
  { year: "2019", title: "Bắt đầu với lớp học 1-1", text: "Mình bắt đầu dạy IELTS dưới hình thức gia sư cá nhân. Đây cũng là năm mình có những học viên đầu tiên đạt mục tiêu, với kết quả IELTS 6.0 và 7.5." },
  { year: "2020", title: "Gia nhập The IELTS Workshop", text: "Mình chính thức gia nhập The IELTS Workshop, một trung tâm chuyên sâu về IELTS, và bắt đầu con đường giảng dạy chuyên nghiệp trong một môi trường đào tạo có hệ thống." },
  { year: "2020–2021", title: "Xây nền từ những lớp thấp nhất", text: "Dù đã sở hữu IELTS Overall 8.5, mình vẫn dành một thời gian dài giảng dạy các lớp ngữ pháp nền tảng và học viên trình độ 0–3.0. Giai đoạn này giúp mình hiểu sâu hơn những lỗ hổng căn bản của người học và cách giải thích kiến thức sao cho thật đơn giản, dễ tiếp cận." },
  { year: "2022", title: "Giảng dạy trình độ 3.5–5.5", text: "Khi chuyển sang các lớp IELTS chính thức, mình bắt đầu đồng hành với học viên ở nhóm 3.5–5.5, tập trung vào việc xây nền kỹ năng và giúp học viên làm quen với từng dạng bài trong IELTS." },
  { year: "2023", title: "Giảng dạy trình độ 6.0–6.5", text: "Mình tiếp tục phụ trách các lớp ở level cao hơn, nơi trọng tâm chuyển dần từ xây nền sang nâng chất lượng ngôn ngữ, hoàn thiện chiến thuật và xử lý bài thi ở mức độ phức tạp hơn." },
  { year: "2024–2025", title: "Giảng dạy level Master 7.5+", text: "Đây là một cột mốc đặc biệt trong hành trình giảng dạy của mình khi trở thành giáo viên nữ duy nhất tại The IELTS Workshop được phân công giảng dạy level Master 7.5+ trong giai đoạn này." },
] as const;

export default function TeachingExperiencePage() {
  return (
    <main className="min-h-screen bg-white pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <Link href="/gioi-thieu" className="group inline-flex items-center gap-2 text-sm font-bold text-brand/70 hover:text-brand"><ArrowLeft size={17} className="transition-transform group-hover:-translate-x-1" />Về giáo viên</Link>
        <header className="max-w-3xl border-b-2 border-brand/15 pb-12 pt-8">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand/60">Kinh nghiệm giảng dạy</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand md:text-6xl">Từng bước đi qua nhiều trình độ khác nhau</h1>
          <p className="mt-7 text-base leading-relaxed text-brand/75 md:text-lg">Hành trình giảng dạy của mình không bắt đầu từ những lớp band cao. Trong nhiều năm, mình lần lượt đi qua các trình độ từ mất gốc, nền tảng đến IELTS 7.5+. Chính quá trình đó giúp mình hiểu rõ hơn những khó khăn rất khác nhau của học viên ở từng giai đoạn và cách một người học thực sự tiến bộ qua từng level.</p>
        </header>
        <section className="relative mt-14 space-y-10 before:absolute before:bottom-0 before:left-[19px] before:top-0 before:w-0.5 before:bg-brand/20 md:before:left-1/2">
          {MILESTONES.map((milestone, index) => (
            <article key={milestone.year} className="relative grid gap-5 pl-12 md:grid-cols-2 md:gap-12 md:pl-0">
              <span className="absolute left-[11px] top-6 z-10 h-[17px] w-[17px] rounded-full border-4 border-white bg-leaf shadow-sm md:left-1/2 md:-translate-x-1/2" />
              <div className={index % 2 === 0 ? "md:col-start-1 md:text-right" : "md:col-start-2"}>
                <span className="font-mono text-sm font-bold tracking-[0.1em] text-brand/55">{milestone.year}</span>
                <h2 className="mt-2 text-2xl font-bold text-brand">{milestone.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-brand/75 md:text-base">{milestone.text}</p>
              </div>
              <div className={index % 2 === 0 ? "md:col-start-2 md:row-start-1" : "md:col-start-1 md:row-start-1"}>
                <img src="/images/experience/timeline-placeholder.png" alt={milestone.title} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_10px_28px_rgba(20,83,45,0.1)]" />
              </div>
            </article>
          ))}
        </section>
        <section className="mt-16 rounded-[28px] bg-brand p-8 md:p-10">
          <p className="max-w-3xl text-lg leading-relaxed text-white/85 md:text-xl">Việc từng trực tiếp giảng dạy một dải trình độ rất rộng giúp mình không chỉ hiểu một bài IELTS khó ở đâu, mà còn hiểu người học ở từng level cần được hỗ trợ như thế nào để đi đến bước tiếp theo.</p>
          <Link href="/phuong-phap" className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-leaf"><NavigationButtonLabel>Tìm hiểu phương pháp giảng dạy</NavigationButtonLabel> <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
        </section>
      </div>
    </main>
  );
}
