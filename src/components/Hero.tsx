import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Award, ChevronRight, MessageSquare, Compass, ShieldAlert, Award as AwardIcon } from "lucide-react";
import PlexusCanvas from "./PlexusCanvas";
import { initialTestimonials } from "../data/testimonialsData";
import { feedbackItems } from "../data/feedbackData";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const titleWordsRef = useRef<HTMLSpanElement[]>([]);
  const subRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Text Masking Reveal on Load
      gsap.fromTo(
        titleWordsRef.current,
        { y: "115%", rotate: 3 },
        {
          y: "0%",
          rotate: 0,
          duration: 1.5,
          ease: "power4.out",
          stagger: 0.15,
          delay: 0.1,
        }
      );

      // 2. Sub-elements fade and slide
      gsap.fromTo(
        subRef.current,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 1.3, ease: "power3.out", delay: 0.7 }
      );

      // 3. Right side reveal
      gsap.fromTo(
        rightSideRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.6, ease: "power4.out", delay: 0.4 }
      );

      // 4. Portrait Image Reveal
      gsap.fromTo(
        portraitRef.current,
        { opacity: 0, scale: 1.05, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 2, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    // 5. Mouse Move Parallax Movement Effect on the Background Portrait
    const handleMouseMove = (e: MouseEvent) => {
      if (!portraitRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 45;
      const y = (e.clientY - innerHeight / 2) / 45;

      gsap.to(portraitRef.current, {
        x: x,
        y: y,
        duration: 1.2,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      if (!portraitRef.current) return;
      gsap.to(portraitRef.current, {
        x: 0,
        y: 0,
        duration: 1.5,
        ease: "power3.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const addTitleWord = (el: HTMLSpanElement | null) => {
    if (el && !titleWordsRef.current.includes(el)) {
      titleWordsRef.current.push(el);
    }
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[100dvh] pt-32 pb-32 md:py-16 flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Signature Bright Green Block on the right */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[35%] lg:w-[30%] bg-[#9FE870] hidden md:block z-0" />

      {/* Decorative Glowing Light Leak Streaks - softened for clean look */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#14532D]/[0.03] blur-[150px] pointer-events-none z-0" />
      
      {/* Integrated Portrait of Cô Thương in the background */}
      <div
        ref={portraitRef}
        className="absolute bottom-0 right-0 w-full md:w-[48%] lg:w-[42%] h-[55%] md:h-[95%] pointer-events-none select-none z-5"
      >
        <img
          src="/images/ho-ngoc-thuong-portrait.png"
          alt="Cô Hồ Ngọc Thương"
          className="absolute bottom-0 right-0 h-full w-auto max-w-none object-contain object-bottom"
        />
      </div>

      {/* 3D Plexus Canvas Interactive Background (Overlays the portrait image) */}
      <PlexusCanvas className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] select-none z-15">
        <div className="w-full h-full grid grid-cols-4 md:grid-cols-12 h-screen max-w-7xl mx-auto px-6 md:px-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-black h-full first:border-l" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-center relative z-20">
        
        {/* Left Column: Bold Slogan & Intros */}
        <div className="md:col-span-7 flex flex-col justify-center order-2 md:order-1 text-left relative py-12 md:py-0">
          

          {/* Heading with Masking */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-[4.5rem] font-black tracking-tight text-[#1A1A1A] leading-[1.1] mb-6">
            <span className="char-mask-wrapper block">
              <span ref={addTitleWord} className="char-mask-inner">
                Hồ Ngọc Thương
              </span>
            </span>{" "}
            <span className="char-mask-wrapper block">
              <span ref={addTitleWord} className="char-mask-inner text-[#14532D]">
                Chuyên Gia IELTS Master
              </span>
            </span>
          </h1>

          {/* Slogan & Introduction with Delay Animation */}
          <div ref={subRef} className="max-w-xl">
            <p className="font-sans italic text-base md:text-lg text-[#1A1A1A]/70 leading-relaxed mb-6 border-l-2 border-[#14532D] pl-4">
              Chuyên gia <span className="text-[#14532D] not-italic font-sans font-bold">Luyện thi IELTS</span> và Phát triển <span className="text-[#15803D] not-italic font-sans font-bold">Tư duy Biện chứng</span>
            </p>

            <p className="text-[#1A1A1A]/75 text-sm md:text-base leading-relaxed mb-4">
              <span className="text-[#1A1A1A] font-bold">Cử nhân xuất sắc Đại học Ngoại Thương (FTU)</span>, chứng chỉ giảng dạy <span className="text-[#1A1A1A] font-bold">CELTA do Cambridge cấp</span>, <span className="text-[#1A1A1A] font-bold">IELTS Overall 8.5</span> (Listening &amp; Reading tuyệt đối 9.0). Hơn <span className="text-[#14532D] font-bold">4 năm trực tiếp đứng lớp</span>, dẫn dắt <span className="text-[#1A1A1A] font-bold">{initialTestimonials.length}+ học viên đạt điểm cao</span> và nhận <span className="text-[#1A1A1A] font-bold">{feedbackItems.length}+ phản hồi tích cực</span> bằng phương pháp sơ đồ hóa tư duy logic.
            </p>

            <p className="text-[#1A1A1A]/75 text-sm md:text-base leading-relaxed mb-8">
              Theo đuổi IELTS vì đam mê, và sau khi chạm mốc 8.5 Overall thì chọn con đường giảng dạy để giúp người khác đi nhanh hơn con đường mình từng đi.
            </p>

            {/* Achievement stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 sm:divide-x sm:divide-black/10 mb-10 max-w-md">
              <div className="sm:pr-4">
                <span className="font-serif text-2xl md:text-3xl font-black text-[#14532D] block leading-none">8.5</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold mt-1 block">Overall Band</span>
              </div>
              <div className="sm:px-4">
                <span className="font-serif text-2xl md:text-3xl font-black text-[#14532D] block leading-none">9.0</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold mt-1 block">Listening</span>
              </div>
              <div className="sm:px-4">
                <span className="font-serif text-2xl md:text-3xl font-black text-[#14532D] block leading-none">94%</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold mt-1 block">Đạt Target</span>
              </div>
              <div className="sm:pl-4">
                <span className="font-serif text-2xl md:text-3xl font-black text-[#14532D] block leading-none">2.500+</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold mt-1 block">Học Viên Đã Dạy</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link
                to="/gioi-thieu"
                className="group px-8 py-3.5 bg-[#9FE870] hover:bg-[#86D65A] text-[#14532D] font-bold text-xs rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer tracking-wider uppercase flex items-center gap-2"
              >
                Về Cô Thương
                <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Floating credential cards over the green block.
            Positions/sizes are percentage + clamp()-based (not fixed px) so the
            cluster scales fluidly with the column and never overlaps at any
            zoom level or intermediate viewport width. */}
        <div ref={rightSideRef} className="md:col-span-5 order-1 md:order-2 w-full aspect-[4/3] sm:aspect-[3/2] md:aspect-[10/11] relative">

          {/* Large overall band card */}
          <div
            className="absolute bg-white rounded-3xl shadow-xl p-[clamp(0.9rem,3vw,1.5rem)] rotate-[-3deg] border border-black/5"
            style={{ top: "2%", left: "2%", width: "clamp(140px, 42%, 220px)" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 font-bold block mb-2">
              Overall Band
            </span>
            <span className="font-serif text-[clamp(1.75rem,5vw,3.75rem)] font-black text-[#14532D] block leading-none">
              8.5
            </span>
            <span className="font-mono text-[10px] text-[#1A1A1A]/60 block mt-2">
              IELTS Academic
            </span>
          </div>

          {/* Small listening score card, overlapping */}
          <div
            className="absolute bg-[#14532D] text-white rounded-2xl shadow-xl p-[clamp(0.75rem,2.5vw,1.25rem)] rotate-[4deg]"
            style={{ top: "42%", left: "34%", width: "clamp(110px, 32%, 170px)" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60 font-bold block mb-1">
              Listening
            </span>
            <span className="font-serif text-[clamp(1.25rem,3.5vw,2.25rem)] font-black block leading-none">
              9.0
            </span>
          </div>

          {/* Trust pills, bottom-left: link straight into the results / feedback sections below.
              Kept clear of the portrait's face and hands on the right side of the frame. */}
          <div className="absolute bottom-[4%] left-0 flex flex-col gap-2 max-w-[85%]">
            <Link
              to="/ket-qua-hoc-vien"
              className="group bg-white rounded-full shadow-xl pl-2 pr-4 py-2 flex items-center gap-3 border border-black/5 hover:border-[#14532D]/30 transition-colors"
            >
              <span className="h-8 w-8 rounded-full bg-[#9FE870] flex items-center justify-center shrink-0">
                <Award size={16} className="text-[#14532D]" />
              </span>
              <span className="text-left">
                <span className="font-serif text-sm font-black text-[#1A1A1A] block leading-none">{initialTestimonials.length}+</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold group-hover:text-[#14532D] transition-colors">Học viên đạt đích</span>
              </span>
            </Link>
            <Link
              to="/cam-nhan-hoc-vien"
              className="group bg-white rounded-full shadow-xl pl-2 pr-4 py-2 flex items-center gap-3 border border-black/5 hover:border-[#14532D]/30 transition-colors"
            >
              <span className="h-8 w-8 rounded-full bg-[#14532D] flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-white" />
              </span>
              <span className="text-left">
                <span className="font-serif text-sm font-black text-[#1A1A1A] block leading-none">{feedbackItems.length}+</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold group-hover:text-[#14532D] transition-colors">Đánh giá tích cực</span>
              </span>
            </Link>
          </div>
        </div>

      </div>

      {/* Floating Trust Badge Strip - styled exactly like the reference image brand logos banner */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl bg-white border border-black/5 p-4 md:p-5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.04)] z-30 flex items-center justify-around gap-6 overflow-x-auto select-none no-scrollbar">
        <span className="font-serif text-xs md:text-sm font-black text-black/35 tracking-tight whitespace-nowrap">IDP IELTS Partner</span>
        <span className="font-serif text-xs md:text-sm font-black text-black/35 tracking-tight whitespace-nowrap">British Council</span>
        <span className="font-mono text-[10px] md:text-xs font-bold text-black/35 uppercase tracking-widest whitespace-nowrap">CELTA Certified</span>
        <span className="font-serif text-xs md:text-sm font-black text-black/35 italic tracking-tight whitespace-nowrap">VTV Education</span>
        <span className="font-mono text-[10px] md:text-xs font-bold text-black/35 uppercase tracking-wider whitespace-nowrap">IELTS 9.0 Club</span>
      </div>

      {/* Floating Vertical Navigation Sidebar (Right-side, like reference image) */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40 bg-white/90 border border-black/5 p-3 rounded-full backdrop-blur-md shadow-lg">
        <Link to="/" className="group relative p-2.5 rounded-full text-[#1A1A1A]/50 hover:text-[#14532D] transition-colors cursor-pointer" id="side-nav-hero">
          <Compass size={18} />
          <span className="absolute right-12 top-1/2 -translate-y-1/2 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap">Trang Chủ</span>
        </Link>
        <Link to="/gioi-thieu" className="group relative p-2.5 rounded-full text-[#1A1A1A]/50 hover:text-[#14532D] transition-colors cursor-pointer" id="side-nav-about">
          <AwardIcon size={18} />
          <span className="absolute right-12 top-1/2 -translate-y-1/2 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap">Giới Thiệu</span>
        </Link>
        <Link to="/tu-van" className="group relative p-2.5 rounded-full text-[#1A1A1A]/50 hover:text-[#14532D] transition-colors cursor-pointer" id="side-nav-contact">
          <ShieldAlert size={18} />
          <span className="absolute right-12 top-1/2 -translate-y-1/2 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap">Liên Hệ</span>
        </Link>
      </div>

    </section>
  );
}
