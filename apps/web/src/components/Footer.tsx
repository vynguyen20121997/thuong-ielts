import Link from "next/link";
import { ArrowRight, GraduationCap, QrCode, Mail } from "lucide-react";
import NavigationButtonLabel from "./NavigationButtonLabel";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M13.6 21v-7.7h2.6l.4-3h-3V8.4c0-.9.3-1.5 1.6-1.5h1.7V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2H7.5v3h2.9V21h3.2Z" />
    </svg>
  );
}

function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.1 5.5A3.5 3.5 0 0 1 8.5 2h7A3.5 3.5 0 0 1 19 5.5v7A3.5 3.5 0 0 1 15.5 16h-4.3L7 20v-4.3a3.5 3.5 0 0 1-1.9-3.2v-7Z" />
      <path d="M9 7.5h5.6L9.4 12.8H15" />
    </svg>
  );
}

/**
 * Footer theo Figma: nền xanh nhạt, 4 cột (thương hiệu / thông tin / khởi đầu
 * lộ trình / social), dòng dưới là copyright.
 * Server component — năm lấy lúc render server, đủ chính xác cho copyright.
 */
export default function Footer() {
  return (
    <footer className="bg-mist text-brand pt-14 pb-10 relative overflow-hidden border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Lưới 4 cột */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-14 border-b border-black/10 text-left">
          {/* Thương hiệu */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <span className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-leaf" />
              </span>
              <span className="font-bold text-lg tracking-tight">
                Thương Hồ&apos;s Class
              </span>
            </Link>
            <p className="text-sm text-brand/60 leading-relaxed max-w-sm mb-6">
              Lớp học IELTS bài bản, có tâm và đi sâu vào bản chất, giúp học
              viên tiến bộ thông qua lộ trình có hệ thống, nhận xét chi tiết và
              phương pháp học tập phù hợp.
            </p>
            <div className="flex items-center gap-4 text-brand">
              <a
                href="https://zalo.me/g/uzpljg880"
                target="_blank"
                rel="noreferrer"
                aria-label="Group cộng đồng Zalo"
                className="transition-colors hover:text-brand-deep"
              >
                <QrCode size={20} />
              </a>
              <a
                href="mailto:thuongho1609@gmail.com"
                aria-label="Email Thương Hồ's Class"
                className="transition-colors hover:text-brand-deep"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Thông tin */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] mb-6">
              Thông Tin
            </h4>
            <ul className="space-y-4 text-sm text-brand/70 font-medium">
              <li>
                <Link
                  href="/gioi-thieu"
                  className="hover:text-brand transition-colors"
                >
                  Về cô Thương Hồ
                </Link>
              </li>
              <li>
                <Link
                  href="/ket-qua-hoc-vien"
                  className="hover:text-brand transition-colors"
                >
                  Kết quả học viên
                </Link>
              </li>
              <li>
                <Link
                  href="/cam-nhan-hoc-vien"
                  className="hover:text-brand transition-colors"
                >
                  Cảm nhận học viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Khởi đầu lộ trình */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] mb-6">
              Khởi Đầu Lộ Trình
            </h4>
            <p className="text-sm text-brand/60 leading-relaxed mb-5">
              Tham gia test thử năng lực và thảo luận lộ trình cùng giáo viên
              hoàn toàn miễn phí ngay hôm nay.
            </p>
            <Link
              href="/tu-van"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-deep transition-colors"
            >
              <NavigationButtonLabel>
                Nhận lịch tư vấn miễn phí
              </NavigationButtonLabel>
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* Social */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] mb-6">
              Social Connect
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/thuonghoieltsclass/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Thương Hồ's Class"
                className="h-11 w-11 rounded-full bg-sage-3 flex items-center justify-center text-brand transition-colors hover:bg-leaf"
              >
                <FacebookIcon className="h-[18px] w-[18px]" />
              </a>
              <a
                href="https://www.threads.com/@thuongho.class?igshid=NTc4MTIwNjQ2YQ=="
                target="_blank"
                rel="noreferrer"
                aria-label="Threads thuongho.class"
                className="h-11 w-11 rounded-full bg-sage-3 flex items-center justify-center text-brand transition-colors hover:bg-leaf"
              >
                <img
                  src="https://cdn.simpleicons.org/threads/0D5D36"
                  alt=""
                  className="h-[20px] w-[20px] object-contain"
                />
              </a>
              <a
                href="https://zalo.me/0783836912"
                target="_blank"
                rel="noreferrer"
                aria-label="Nhắn tin qua Zalo 0783836912"
                className="h-11 w-11 rounded-full bg-sage-3 flex items-center justify-center text-brand transition-colors hover:bg-leaf"
              >
                <ZaloIcon className="h-[19px] w-[19px]" />
              </a>
            </div>
          </div>
        </div>

        {/* Dòng dưới */}
        <div className="pt-8">
          <p className="text-sm font-medium text-brand/80">
            © {new Date().getFullYear()} Hồ Ngọc Thương. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
