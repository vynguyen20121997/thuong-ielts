"use client";

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
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-[#15803D]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 rounded-full bg-[#14532D]/3 blur-[120px] pointer-events-none" />

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
              <span className="font-mono text-[9px] text-[#14532D] tracking-[0.25em] uppercase block mb-1 font-bold">
                Triết lý hàng đầu
              </span>
              <p className="font-sans italic text-sm text-[#1A1A1A]/90 leading-relaxed">
                "Đừng áp lực điểm số quá. Chỉ cần đạt đúng target của mình, rồi tiếp tục thực hiện những dự định lớn hơn."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Informative & Philosophy Content */}
        <div className="lg:col-span-7 order-1 lg:order-2 text-left">
          
          <div className="reveal-element">
            <span className="font-mono text-xs tracking-[0.25em] text-[#14532D] uppercase block mb-3 font-bold">
              Giảng Viên & Người Truyền Cảm Hứng
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-black tracking-tight text-[#1A1A1A] mb-4 leading-[1.15]">
              Học IELTS Bằng Tư Duy <br />
              Thay Vì Ghi Nhớ Máy Móc
            </h2>
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[#14532D]/10 text-[#14532D] px-3 py-1.5 rounded-full font-bold">
                8.5 IELTS Overall
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[#14532D]/10 text-[#14532D] px-3 py-1.5 rounded-full font-bold">
                CELTA Certified
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[#14532D]/10 text-[#14532D] px-3 py-1.5 rounded-full font-bold">
                4+ Năm Kinh Nghiệm
              </span>
            </div>
          </div>

          {/* Education & Certification Block */}
          <div className="reveal-element grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex gap-4 p-6 bg-white border border-black/5 rounded-2xl shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-[#14532D]/10 flex items-center justify-center shrink-0">
                <GraduationCap className="text-[#14532D]" size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-1">
                  Cử Nhân Kinh Tế Đối Ngoại
                </h3>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                  Tốt nghiệp Đại học Ngoại Thương (FTU).
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-white border border-black/5 rounded-2xl shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-[#14532D]/10 flex items-center justify-center shrink-0">
                <Bookmark className="text-[#14532D]" size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-1">
                  Chứng Chỉ Giảng Dạy CELTA
                </h3>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                  Chứng chỉ sư phạm quốc tế do Đại học Cambridge cấp.
                </p>
              </div>
            </div>
          </div>

          {/* Narrative description */}
          <div className="reveal-element mb-10 text-[#1A1A1A]/85 space-y-4">
            <p className="text-base md:text-lg leading-relaxed">
              Xin chào, tôi là <strong>Hồ Ngọc Thương</strong>. Sau khi tốt nghiệp, tôi từng đi làm văn phòng nhưng không tìm thấy cảm hứng trong công việc, nên quyết định học IELTS vì đam mê - và sau khi đạt 8.5 Overall, tôi chọn con đường đi dạy. Hơn 4 năm trực tiếp đứng lớp, tôi nhận ra sai lầm lớn nhất của đại đa số học viên là học vẹt cấu trúc và từ vựng riêng lẻ.
            </p>
            <p className="text-base leading-relaxed">
              Tại lớp học của tôi, bạn sẽ học cách <strong>vận hành tư duy phân tích của giám khảo</strong>. Chúng ta sẽ giải quyết bài đọc (Reading) như giải một câu đố Logic, và làm chủ bài nghe (Listening) thông qua cấu trúc ngữ điệu và tư duy định vị từ khóa thông minh.
            </p>
          </div>

          {/* The Core Principles - featured flagship + supporting trio */}
          <div className="reveal-element">

            {/* Featured Principle: the "Logic" methodology, full width */}
            <div className="flex gap-4 items-start p-5 bg-[#14532D]/5 border border-[#14532D]/15 rounded-2xl mb-5">
              <div className="h-11 w-11 rounded-xl bg-[#14532D] flex items-center justify-center shrink-0">
                <Brain className="text-white" size={20} />
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#14532D]/70 font-bold block mb-1">
                  Phương pháp cốt lõi
                </span>
                <h4 className="font-bold text-base text-[#1A1A1A] mb-1">
                  Sơ Đồ Tư Duy Logic
                </h4>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                  Bản đồ hóa từ vựng đồng nghĩa, tối giản hóa cấu trúc câu giúp hiểu nhanh 100% văn bản học thuật.
                </p>
              </div>
            </div>

            {/* Supporting principles, tighter trio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#15803D]/10 flex items-center justify-center shrink-0 border border-[#15803D]/20">
                  <Compass className="text-[#15803D]" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                    Nghe Chủ Động
                  </h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                    Phát hiện bẫy thông tin, paraphrase trong hội thoại thực tế của Listening.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#14532D]/10 flex items-center justify-center shrink-0 border border-[#14532D]/20">
                  <Bookmark className="text-[#14532D]" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                    Nói & Viết Sắc Bén
                  </h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                    Lập luận mạch lạc, thuyết phục tối đa các giám khảo khó tính nhất.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#14532D]/10 flex items-center justify-center shrink-0 border border-[#14532D]/20">
                  <GraduationCap className="text-[#14532D]" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">
                    Chăm Sóc 1-Kèm-1
                  </h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
                    Sửa chi tiết bài viết, ghi âm nói hàng tuần để tối ưu tiến bộ.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
