import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-white text-[#1A1A1A] pt-20 pb-12 relative overflow-hidden border-t border-b border-black/5">

      {/* Upper line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Upper footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16 border-b border-black/10 text-left">

          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-block">
                <span className="font-serif text-2xl md:text-3xl font-black tracking-tight text-[#1A1A1A] block mb-1">
                  HNT<span className="text-[#14532D]">.</span>IELTS
                </span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-[#1A1A1A]/40 uppercase block mb-6 font-bold">
                  Hồ Ngọc Thương
                </span>
              </Link>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed max-w-sm mb-6">
                Chương trình luyện thi IELTS chất lượng cao, tập trung rèn luyện tư duy biện chứng sâu sắc, giúp học viên Việt Nam chinh phục IELTS bền vững và thực tế.
              </p>
            </div>

            <p className="font-mono text-[10px] text-[#1A1A1A]/30 hidden md:block">
              © {new Date().getFullYear()} Hồ Ngọc Thương. All rights reserved.
            </p>
          </div>

          {/* Sitemaps */}
          <div className="md:col-span-4 grid grid-cols-1 gap-8">
            <div>
              <h4 className="font-mono text-[10px] font-bold text-[#14532D] uppercase tracking-widest mb-6">Thông tin</h4>
              <ul className="space-y-3 text-sm text-[#1A1A1A]/70 font-bold">
                <li><Link to="/gioi-thieu" className="hover:text-[#14532D] transition-colors text-left">Về cô Ngọc Thương</Link></li>
                <li><Link to="/thanh-tich" className="hover:text-[#14532D] transition-colors text-left">Bảng điểm vàng</Link></li>
                <li><Link to="/ket-qua-hoc-vien" className="hover:text-[#14532D] transition-colors text-left">Kết quả học viên</Link></li>
                <li><Link to="/cam-nhan-hoc-vien" className="hover:text-[#14532D] transition-colors text-left">Cảm nhận học viên</Link></li>
              </ul>
            </div>
          </div>

          {/* Action Col */}
          <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end">
            <div className="text-left md:text-right">
              <h4 className="font-mono text-[10px] font-bold text-[#14532D] uppercase tracking-widest mb-6">Khởi đầu lộ trình</h4>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed mb-6">
                Tham gia test thử năng lực và thảo luận lộ trình cùng giáo viên hoàn toàn miễn phí ngay hôm nay.
              </p>
              <Link
                to="/tu-van"
                className="inline-block px-6 py-3 bg-[#1A1A1A] hover:bg-[#9FE870] text-[#FAF9F6] hover:text-[#14532D] text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md cursor-pointer"
              >
                Nhận lịch tư vấn miễn phí
              </Link>
            </div>
          </div>

         </div>

        {/* Lower footer */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="font-mono text-[10px] text-[#1A1A1A]/30 md:hidden">
            © {new Date().getFullYear()} Hồ Ngọc Thương. All rights reserved.
          </p>
          <div className="flex gap-4 font-mono text-[10px] text-[#1A1A1A]/40 font-bold">
            <a href="#privacy" className="hover:text-[#1A1A1A] transition-colors">Điều khoản bảo mật</a>
            <span>|</span>
            <a href="#terms" className="hover:text-[#1A1A1A] transition-colors">Cam kết hợp đồng đầu ra</a>
          </div>

          {/* Back to top button */}
          <button
            onClick={handleBackToTop}
            className="group flex items-center gap-2 p-3 bg-black/5 border border-black/10 text-[#1A1A1A] hover:bg-[#14532D] hover:text-white hover:border-[#14532D] transition-all duration-300 cursor-pointer text-xs"
            aria-label="Back to Top"
            id="back-to-top-button"
          >
            <span className="font-mono text-[9px] uppercase tracking-widest px-1 hidden sm:inline font-bold">Về đầu trang</span>
            <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
