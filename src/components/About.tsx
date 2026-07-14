import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bookmark, Compass, Brain, GraduationCap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Image parallax scrolling
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // 2. Reveal-on-scroll for textual content
      gsap.fromTo(
        ".reveal-element",
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="py-28 bg-white relative overflow-hidden border-b border-black/5"
    >
      {/* Decorative background visual elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-[#8BA8D1]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-[#E15243]/3 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Side: Parallax Image Column */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border border-black/5 shadow-[0_15px_35px_rgba(0,0,0,0.06)] group">
            {/* Elegant overlay frame */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-4 border border-white/20 rounded-2xl z-20 pointer-events-none" />
            
            <img
              ref={imageRef}
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"
              alt="Logic study preparation and notes"
              referrerPolicy="no-referrer"
              className="absolute top-[-10%] left-0 w-full h-[120%] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Float Label */}
            <div className="absolute bottom-8 left-8 right-8 z-20 bg-white/95 border border-black/5 p-5 rounded-2xl shadow-xl">
              <span className="font-mono text-[9px] text-[#E15243] tracking-[0.25em] uppercase block mb-1 font-bold">
                Triết lý hàng đầu
              </span>
              <p className="font-serif italic text-sm text-[#1A1A1A]/90 leading-relaxed">
                "Thấu hiểu bản chất học thuật giúp bạn làm chủ mọi đề thi IELTS, thay vì cầu may vào các bộ từ vựng tủ."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Informative & Philosophy Content */}
        <div className="lg:col-span-7 order-1 lg:order-2 text-left">
          
          <div className="reveal-element">
            <span className="font-mono text-xs tracking-[0.25em] text-[#E15243] uppercase block mb-3 font-bold">
              Giảng Viên & Người Truyền Cảm Hứng
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-black tracking-tight text-[#1A1A1A] mb-8 leading-[1.15]">
              Học IELTS Bằng Tư Duy <br />
              Thay Vì Ghi Nhớ Máy Móc
            </h2>
          </div>

          {/* Education Block */}
          <div className="reveal-element flex gap-4 p-6 bg-white border border-black/5 rounded-2xl mb-8 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-[#E15243]/10 flex items-center justify-center shrink-0">
              <GraduationCap className="text-[#E15243]" size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A] mb-1">
                Học Vấn Xuất Sắc - ĐH Ngoại Ngữ (ULIS)
              </h3>
              <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                Tốt nghiệp Cử nhân chuyên ngành Ngôn ngữ Anh xuất sắc tại Đại học Ngoại Ngữ - Đại học Quốc gia Hà Nội. Nền tảng sư phạm chính quy và kỹ năng nghiên cứu ngôn ngữ bài bản.
              </p>
            </div>
          </div>

          {/* Narrative description */}
          <div className="reveal-element mb-10 text-[#1A1A1A]/85 space-y-4">
            <p className="text-base md:text-lg leading-relaxed">
              Xin chào, tôi là <strong>Hồ Ngọc Thương</strong>. Hơn 6 năm trực tiếp đứng lớp và nghiên cứu chuyên sâu về đề thi IELTS, tôi nhận ra sai lầm lớn nhất của đại đa số học viên là học vẹt cấu trúc và từ vựng riêng lẻ.
            </p>
            <p className="text-base leading-relaxed">
              Tại lớp học của tôi, bạn sẽ học cách <strong>vận hành tư duy phân tích của giám khảo</strong>. Chúng ta sẽ giải quyết bài đọc (Reading) như giải một câu đố Logic, và làm chủ bài nghe (Listening) thông qua cấu trúc ngữ điệu và tư duy định vị từ khóa thông minh.
            </p>
          </div>

          {/* The Core Principles list */}
          <div className="reveal-element grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Principle 1 */}
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#8BA8D1]/10 flex items-center justify-center shrink-0 border border-[#8BA8D1]/20">
                <Brain className="text-[#8BA8D1]" size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                  Sơ Đồ Tư Duy Logic
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                  Bản đồ hóa từ vựng đồng nghĩa, tối giản hóa cấu trúc câu giúp hiểu nhanh 100% văn bản học thuật.
                </p>
              </div>
            </div>

            {/* Principle 2 */}
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#8BA8D1]/10 flex items-center justify-center shrink-0 border border-[#8BA8D1]/20">
                <Compass className="text-[#8BA8D1]" size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                  Kỹ Thuật Nghe Chủ Động
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                  Rèn luyện phản xạ phát hiện bẫy thông tin, paraphrase trong hội thoại thực tế của IELTS Listening.
                </p>
              </div>
            </div>

            {/* Principle 3 */}
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#E15243]/10 flex items-center justify-center shrink-0 border border-[#E15243]/20">
                <Bookmark className="text-[#E15243]" size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                  Nói & Viết Sắc Bén
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                  Lập luận mạch lạc, sử dụng các từ liên kết luận điểm thuyết phục tối đa các giám khảo khó tính nhất.
                </p>
              </div>
            </div>

            {/* Principle 4 */}
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#E15243]/10 flex items-center justify-center shrink-0 border border-[#E15243]/20">
                <GraduationCap className="text-[#E15243]" size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                  Chăm Sóc Kép 1-Kèm-1
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                  Sửa chi tiết từng bài viết, ghi âm nói trực tiếp hàng tuần để tối ưu hóa sự tiến bộ trong thời gian ngắn nhất.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
