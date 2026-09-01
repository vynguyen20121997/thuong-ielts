import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowRight } from "lucide-react";
import NavigationButtonLabel from "./NavigationButtonLabel";

/**
 * Khối liên hệ cuối trang chủ theo sheet portfolio: câu mời + hai nút
 * "Đăng ký học" / "Liên hệ hợp tác". Server component, tĩnh hoàn toàn.
 */
export default function ContactCTA() {
  return (
    <section id="lien-he" className="py-16 md:py-20 bg-brand relative overflow-hidden">
      <Reveal className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-snug mb-4">
          Bạn muốn học IELTS cùng mình <br className="hidden md:block" />
          hoặc trao đổi về cơ hội hợp tác?
        </h2>
        <p className="text-white/60 text-sm md:text-base mb-10">
          Nhắn một câu thôi — lộ trình, học phí và lịch học sẽ được tư vấn miễn phí.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tu-van"
            className="group inline-flex items-center gap-2 px-9 py-4 bg-leaf hover:bg-white text-brand font-bold text-sm rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <NavigationButtonLabel>Đăng Ký Học</NavigationButtonLabel>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/tu-van"
            className="group inline-flex items-center gap-2 px-9 py-4 border-2 border-white/30 hover:border-white text-white font-bold text-sm rounded-full transition-colors duration-300"
          >
            <NavigationButtonLabel>Liên Hệ Hợp Tác</NavigationButtonLabel>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
