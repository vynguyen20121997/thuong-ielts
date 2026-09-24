import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import NavigationButtonLabel from "../../../components/NavigationButtonLabel";
import PageArch from "../../../components/PageArch";
import TeachingCertificateCarousel from "../../../components/TeachingCertificateCarousel";
import ZoomableImage from "../../../components/ZoomableImage";

export const metadata: Metadata = { title: "Học vấn & Chứng chỉ | Thương Hồ's Class" };

const EDUCATION = [
  ["THPT Chuyên Trần Đại Nghĩa", "Giai đoạn đầu giúp mình tiếp xúc với môi trường học tập có yêu cầu cao về ngoại ngữ và học thuật."],
  ["Phổ thông Năng khiếu – ĐHQG TP.HCM", "Tiếp tục phát triển khả năng tự học, tư duy độc lập và nền tảng học thuật trong một môi trường cạnh tranh cao."],
  ["Đại học Ngoại thương – Chuyên ngành Kinh tế Đối ngoại", "Hoàn thành chương trình đại học tại Đại học Ngoại thương, đồng thời tiếp tục sử dụng tiếng Anh thường xuyên trong học tập và công việc."],
] as const;

const CORE_CERTIFICATES = [
  { title: "IELTS Overall 8.5 – 3 lần", images: ["/images/certificates/ielts-2026.webp", "/images/certificates/ielts-2021.webp", "/images/certificates/ielts-2019.webp"], description: ["Mình đã 3 lần đạt IELTS Overall 8.5, trong đó có các kỹ năng đạt mức điểm cao như Listening 9.0, Reading 9.0 và Writing 8.5.", "Việc trực tiếp tham gia kỳ thi nhiều lần giúp mình không chỉ hiểu IELTS dưới góc độ giáo viên mà còn liên tục cập nhật trải nghiệm thi thật và những yêu cầu thực tế của bài thi."] },
  { title: "Cambridge CELTA – Pass", images: ["/images/certificates/celta-cambridge.webp"], subtitle: "Certificate in Teaching English to Speakers of Other Languages", description: ["CELTA là chứng chỉ giảng dạy tiếng Anh quốc tế do Cambridge English cấp, với chương trình đào tạo tập trung mạnh vào thực hành giảng dạy, lesson planning, language analysis, classroom management và feedback."] },
] as const;

const IELTS_TEACHING_CERTIFICATES = [
  { title: "IELTS Teacher Training – IDP", images: ["/images/certificates/idp-teacher-training.webp"], description: ["Hoàn thành chương trình đào tạo dành cho giáo viên IELTS của IDP, tập trung vào hai kỹ năng Writing và Speaking.", "Nội dung đào tạo giúp mình hiểu sâu hơn về tiêu chí chấm điểm, cách examiner đánh giá bài làm và cách chuyển các band descriptors thành feedback cụ thể, dễ áp dụng hơn cho học viên."] },
] as const;

const ENGLISH_TEACHING_CERTIFICATES = [
  {
    title: "Assessing Learning by British Council",
    image: "/images/certificates/teachingenglish-assessing-learning.png",
    description: "Khóa học giúp mình thiết kế hoạt động đánh giá công bằng và phù hợp với nhiều nhóm học viên; vận dụng assessment for learning qua đặt câu hỏi, phản hồi, đánh giá đồng đẳng và tự đánh giá; đồng thời biến việc ôn luyện bài thi thành một quá trình tích cực, có động lực hơn.",
  },
  {
    title: "How to Teach Pronunciation by British Council",
    image: "/images/certificates/teachingenglish-how-to-teach-pronunciation.png",
    description: "Khóa học giúp mình nhận diện các yếu tố cốt lõi của phát âm tiếng Anh, lựa chọn và đánh giá những hoạt động luyện các âm khó; đồng thời tích hợp luyện phát âm — từ âm riêng lẻ đến trọng âm, ngữ điệu và nối âm — vào các kỹ năng ngôn ngữ khác trong lớp học.",
  },
] as const;

export default function EducationPage() {
  return <main className="relative min-h-screen bg-white pb-24 pt-28 md:pt-32"><PageArch /><div className="relative z-10 mx-auto max-w-6xl gutter">
    <Link href="/gioi-thieu" className="group inline-flex items-center gap-2 text-sm font-bold text-brand/80 hover:text-brand"><ArrowLeft size={17} className="transition-transform group-hover:-translate-x-1" />Về giáo viên</Link>
    <header className="max-w-3xl border-b-2 border-brand/15 pb-12 pt-8"><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/80">Hồ sơ chuyên môn</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-brand md:text-6xl">Học vấn & Chứng chỉ</h1></header>
    <section className="py-16 md:py-20"><div className="grid gap-8 lg:grid-cols-[190px_1fr]"><div><span className="font-mono text-sm font-bold tracking-[0.12em] text-brand/80">01</span><span className="mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-leaf text-brand"><GraduationCap size={20} /></span></div><div><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/80">Học vấn</p><p className="mt-5 text-base leading-relaxed text-brand/80 md:text-lg">Nền tảng học tập của mình được xây dựng từ môi trường học thuật có tính chọn lọc cao, với trọng tâm xuyên suốt là ngoại ngữ, tư duy phân tích và khả năng tự học.</p><div className="mt-8 grid gap-4">{EDUCATION.map(([title, text]) => <article key={title} className="rounded-2xl border border-brand/10 bg-mist p-6"><h2 className="text-lg font-bold text-brand">{title}</h2><p className="mt-2 text-sm leading-relaxed text-brand/80 md:text-base">{text}</p></article>)}</div></div></div></section>
    <section className="border-t-2 border-brand/15 py-16 md:py-20"><div className="grid gap-8 lg:grid-cols-[190px_1fr]"><div><span className="font-mono text-sm font-bold tracking-[0.12em] text-brand/80">02</span></div><div><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand/80">Chứng chỉ chuyên môn</p><div className="mt-8 space-y-12">{CORE_CERTIFICATES.map((certificate) => <article key={certificate.title} className="overflow-hidden rounded-[28px] border border-brand/10 bg-mist"><div className={"p-5 " + (certificate.images.length === 1 ? "grid gap-6 sm:grid-cols-[minmax(260px,0.75fr)_1.25fr] sm:items-center" : "")}><div className={"grid gap-3 " + (certificate.images.length > 1 ? "grid-cols-3" : "")}><>{certificate.images.map((image) => <ZoomableImage key={image} src={image} alt={certificate.title} className={"w-full rounded-xl bg-white shadow-sm " + (certificate.images.length > 1 ? "aspect-[4/3] object-contain" : "aspect-[3/4] object-contain")} />)}</></div><div className={certificate.images.length > 1 ? "mt-6" : ""}><h2 className="text-xl font-bold text-brand">{certificate.title}</h2>{"subtitle" in certificate && <p className="mt-2 font-medium text-brand/80">{certificate.subtitle}</p>}<div className="mt-4 space-y-3 text-sm leading-relaxed text-brand/80 md:text-base">{certificate.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></div></article>)}</div>

      <div className="mt-16 border-t border-brand/15 pt-12"><h2 className="text-2xl font-bold text-brand md:text-3xl">Chứng chỉ giảng dạy IELTS</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand/80 md:text-base">Các chương trình đào tạo chuyên sâu giúp mình cập nhật tiêu chí đánh giá và phương pháp phản hồi dành riêng cho học viên IELTS.</p><div className="mt-7 space-y-6">{IELTS_TEACHING_CERTIFICATES.map((certificate) => <article key={certificate.title} className="grid overflow-hidden rounded-[28px] border border-brand/10 bg-mist p-5 sm:grid-cols-[minmax(260px,0.75fr)_1.25fr] sm:items-center sm:gap-7"><ZoomableImage src={certificate.images[0]} alt={certificate.title} className="aspect-[3/4] w-full rounded-xl bg-white object-contain shadow-sm" /><div className="mt-6 sm:mt-0"><h3 className="text-xl font-bold text-brand">{certificate.title}</h3><div className="mt-4 space-y-3 text-sm leading-relaxed text-brand/80 md:text-base">{certificate.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></article>)}</div></div>

      <div className="mt-16 border-t border-brand/15 pt-12"><h2 className="text-2xl font-bold text-brand md:text-3xl">Chứng chỉ giảng dạy tiếng Anh</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-brand/80 md:text-base">Các khóa đào tạo ngắn hạn mình hoàn thành để không ngừng học hỏi, cập nhật kiến thức và đưa những phương pháp giảng dạy mới vào lớp học.</p><TeachingCertificateCarousel certificates={ENGLISH_TEACHING_CERTIFICATES} /></div>
    </div></div></section>
    <Link href="/phuong-phap" className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-deep"><NavigationButtonLabel>Tìm hiểu phương pháp giảng dạy</NavigationButtonLabel> <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
  </div></main>;
}
