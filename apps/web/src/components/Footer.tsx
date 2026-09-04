import Link from "next/link";
import { ArrowRight, GraduationCap, QrCode, Mail, Globe, MessageSquare, Images } from "lucide-react";
import NavigationButtonLabel from "./NavigationButtonLabel";

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
              <span className="font-bold text-lg tracking-tight">Thương Hồ&apos;s Class</span>
            </Link>
            <p className="text-sm text-brand/60 leading-relaxed max-w-sm mb-6">
              Lớp học IELTS bài bản, có tâm và đi sâu vào bản chất, giúp học viên tiến bộ thông qua
              lộ trình có hệ thống, nhận xét chi tiết và phương pháp học tập phù hợp.
            </p>
            <div className="flex items-center gap-4 text-brand">
              <QrCode size={20} />
              <Mail size={20} />
            </div>
          </div>

          {/* Thông tin */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] mb-6">Thông Tin</h4>
            <ul className="space-y-4 text-sm text-brand/70 font-medium">
              <li>
                <Link href="/gioi-thieu" className="hover:text-brand transition-colors">
                  Về cô Thương Hồ
                </Link>
              </li>
              <li>
                <Link href="/ket-qua-hoc-vien" className="hover:text-brand transition-colors">
                  Kết quả học viên
                </Link>
              </li>
              <li>
                <Link href="/cam-nhan-hoc-vien" className="hover:text-brand transition-colors">
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
              Tham gia test thử năng lực và thảo luận lộ trình cùng giáo viên hoàn toàn miễn phí
              ngay hôm nay.
            </p>
            <Link
              href="/tu-van"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-deep transition-colors"
            >
              <NavigationButtonLabel>Nhận lịch tư vấn miễn phí</NavigationButtonLabel>
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Social */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] mb-6">
              Social Connect
            </h4>
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-sage-3 flex items-center justify-center text-brand">
                <Globe size={18} />
              </span>
              <span className="h-11 w-11 rounded-full bg-sage-3 flex items-center justify-center text-brand">
                <Images size={18} />
              </span>
              <span className="h-11 w-11 rounded-full bg-sage-3 flex items-center justify-center text-brand">
                <MessageSquare size={18} />
              </span>
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
