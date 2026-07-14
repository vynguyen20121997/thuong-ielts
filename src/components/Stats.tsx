import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Award, Users, Star } from "lucide-react";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

export default function Stats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overallRef = useRef<HTMLSpanElement>(null);
  const listeningRef = useRef<HTMLSpanElement>(null);
  const studentsRef = useRef<HTMLSpanElement>(null);
  const passRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const duration = 2;

      // Animating float values
      const overallVal = { val: 0 };
      gsap.to(overallVal, {
        val: 8.0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        duration,
        ease: "power2.out",
        onUpdate: () => {
          if (overallRef.current) {
            overallRef.current.innerText = overallVal.val.toFixed(1);
          }
        },
      });

      const listeningVal = { val: 0 };
      gsap.to(listeningVal, {
        val: 9.0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        duration,
        ease: "power2.out",
        onUpdate: () => {
          if (listeningRef.current) {
            listeningRef.current.innerText = listeningVal.val.toFixed(1);
          }
        },
      });

      // Animating integer values
      const studentsVal = { val: 0 };
      gsap.to(studentsVal, {
        val: 2500,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        duration: 2.5,
        ease: "power2.out",
        onUpdate: () => {
          if (studentsRef.current) {
            studentsRef.current.innerText = Math.floor(studentsVal.val).toLocaleString();
          }
        },
      });

      const passVal = { val: 0 };
      gsap.to(passVal, {
        val: 94,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        duration: 2.2,
        ease: "power2.out",
        onUpdate: () => {
          if (passRef.current) {
            passRef.current.innerText = Math.floor(passVal.val).toString();
          }
        },
      });

      // Background decorative lines reveal
      gsap.fromTo(
        ".divider-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          stagger: 0.2,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );

      // Block fade up reveal
      gsap.fromTo(
        ".stat-block",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="stats"
      className="py-24 bg-white text-[#1A1A1A] relative overflow-hidden border-t border-b border-black/5"
    >
      {/* Decorative Grid Lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Editorial Subtitle & Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16 items-end">
          <div className="lg:col-span-6">
            <span className="font-mono text-xs tracking-[0.25em] text-[#14532D] uppercase block mb-3 font-bold">
              Thực Chứng Đẳng Cấp
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-[#1A1A1A]">
              Điểm Số Thật, <br />
              Thành Quả Rực Rỡ
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed">
              Không chỉ sở hữu bảng điểm cá nhân xuất sắc với điểm số tối đa ở kỹ năng Nghe, cô Ngọc Thương đã giúp hơn hàng nghìn học viên đạt mục tiêu IELTS mong muốn để đi du học, định cư hoặc thăng tiến sự nghiệp.
            </p>
          </div>
        </div>

        {/* Divider Line */}
        <div className="divider-line h-px bg-black/10 w-full mb-12" />

        {/* Stats Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-12">
          
          {/* Stat 1 - Overall */}
          <div className="stat-block flex flex-col justify-between text-left relative" id="stat-overall">
            <div>
              <div className="h-10 w-10 bg-[#14532D]/10 border border-[#14532D]/20 rounded-lg flex items-center justify-center mb-6">
                <Award className="text-[#14532D]" size={20} />
              </div>
              <p className="font-serif text-6xl md:text-7xl font-bold tracking-tight mb-3 text-[#1A1A1A]">
                <span ref={overallRef}>0.0</span>
              </p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">IELTS Overall Band</h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">
                Chứng chỉ IELTS Academic chuẩn quốc tế, chứng thực khả năng sử dụng tiếng Anh học thuật toàn diện.
              </p>
            </div>
          </div>

          {/* Stat 2 - Listening */}
          <div className="stat-block flex flex-col justify-between text-left relative" id="stat-listening">
            <div>
              <div className="h-10 w-10 bg-[#15803D]/10 border border-[#15803D]/20 rounded-lg flex items-center justify-center mb-6">
                <Star className="text-[#15803D]" size={20} />
              </div>
              <p className="font-serif text-6xl md:text-7xl font-bold tracking-tight mb-3 text-[#15803D]">
                <span ref={listeningRef}>0.0</span>
              </p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Listening Score</h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">
                Đạt điểm số 9.0 tuyệt đối ở kỹ năng Nghe thông qua phương pháp luyện tập chép chính tả và bóc tách sơ đồ hội thoại.
              </p>
            </div>
          </div>

          {/* Stat 3 - Students */}
          <div className="stat-block flex flex-col justify-between text-left relative" id="stat-students">
            <div>
              <div className="h-10 w-10 bg-[#14532D]/10 border border-[#14532D]/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-[#14532D]" size={20} />
              </div>
              <p className="font-serif text-6xl md:text-7xl font-bold tracking-tight mb-3 text-[#1A1A1A]">
                <span ref={studentsRef}>0</span><span className="text-[#14532D]">+</span>
              </p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Học Viên Đạt Đích</h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">
                Đã đồng hành cùng hàng nghìn học viên tại Việt Nam và hải ngoại vượt qua nỗi sợ tiếng Anh, hoàn thành ước mơ học tập.
              </p>
            </div>
          </div>

          {/* Stat 4 - Pass Rate */}
          <div className="stat-block flex flex-col justify-between text-left relative" id="stat-pass">
            <div>
              <div className="h-10 w-10 bg-[#15803D]/10 border border-[#15803D]/20 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="text-[#15803D]" size={20} />
              </div>
              <p className="font-serif text-6xl md:text-7xl font-bold tracking-tight mb-3 text-[#1A1A1A]">
                <span ref={passRef}>0</span><span className="text-[#15803D]">%</span>
              </p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Đạt Target Đầu Ra</h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">
                Tỉ lệ học viên đạt hoặc vượt điểm target cam kết trong lộ trình ban đầu nhờ phương pháp dạy tập trung vào cốt lõi.
              </p>
            </div>
          </div>

        </div>

        {/* Small quote inside stats */}
        <div className="divider-line h-px bg-black/10 w-full mt-16 mb-8" />
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#1A1A1A]/40 uppercase text-center font-bold">
          * Điểm số được kiểm chứng thực tế và cập nhật định kỳ hàng năm.
        </p>
      </div>
    </section>
  );
}
