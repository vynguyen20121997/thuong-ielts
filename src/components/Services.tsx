import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, Headphones, PenTool, Sparkles, Check, ChevronRight, X } from "lucide-react";
import { CourseItem } from "../types";

gsap.registerPlugin(ScrollTrigger);

export default function Services() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  const courses: CourseItem[] = [
    {
      id: "focus",
      title: "IELTS Focus (4 Skills)",
      duration: "3.5 Tháng (42 Buổi)",
      target: "Đầu ra Cam kết 6.5+ IELTS",
      focus: "Toàn diện Nghe, Nói, Đọc, Viết",
      description: "Lộ trình thiết kế bài bản từ mất gốc hoặc từ nền tảng cơ bản lên thẳng điểm số mong muốn. Tập trung xây dựng gốc rễ từ vựng học thuật, ngữ pháp nâng cao và phản xạ ngôn ngữ thực chiến.",
      highlights: [
        "Sĩ số lớp giới hạn tối đa 6-8 học viên để đảm bảo chất lượng sửa bài nói, viết trực tiếp.",
        "Xây dựng phản xạ tự tin trả lời Speaking theo các chủ đề phổ biến.",
        "Luyện tập tư duy tìm ý tưởng và bố cục bài viết Writing Task 1 & 2 logic.",
        "Thi thử (Mock Test) chuẩn chỉ như thi thật mỗi tháng 1 lần."
      ]
    },
    {
      id: "masterclass",
      title: "Reading & Listening Masterclass",
      duration: "2 Tháng (24 Buổi)",
      target: "Mục tiêu 8.0 - 9.0 Đọc & Nghe",
      focus: "Tư duy Logic & Bóc Tách Đề Thi",
      description: "Khóa học độc quyền làm nên thương hiệu của cô Ngọc Thương. Thích hợp cho các học viên đã có nền tảng tốt nhưng muốn tối ưu hóa điểm số tuyệt đối ở hai kỹ năng Đọc và Nghe.",
      highlights: [
        "Làm chủ phương pháp sơ đồ hóa đoạn văn, giải quyết triệt để dạng Matching Headings.",
        "Bóc tách cấu trúc phát âm của người bản xứ (linking sounds, reduction) để nghe rõ từng từ.",
        "Học cách nhận diện bẫy nhiễu thông tin trong bài nghe (distractors) một cách chủ động.",
        "Kho từ vựng Synonym (từ đồng nghĩa) phân loại theo chuyên đề bao quát 99% đề thi."
      ]
    },
    {
      id: "intensive",
      title: "Writing & Speaking Intensive",
      duration: "2 Tháng (18 Buổi)",
      target: "Nâng Band 7.0+ Nói & Viết",
      focus: "Lập Luận Phản Biện & Sửa Bài Chi Tiết",
      description: "Khóa học tập trung rèn luyện tư duy phản biện (Critical Thinking) để xử lý các chủ đề phức tạp trong Writing Task 2 và Speaking Part 3. Cam kết sửa chữa lỗi sai triệt để.",
      highlights: [
        "Sửa chi tiết 24 bài viết lớn nhỏ, chỉ rõ lỗi ngữ pháp, từ vựng và tư duy sắp xếp luận điểm.",
        "Luyện Speaking 1-kèm-1 định kỳ hàng tuần trực tiếp cùng cô Ngọc Thương.",
        "Nâng cấp kho từ vựng Academic và các cụm Idiomatic Collocations tự nhiên.",
        "Chiến thuật lấy điểm tuyệt đối Coherence & Cohesion (Sự mạch lạc và gắn kết)."
      ]
    },
    {
      id: "speaking",
      title: "Public Speaking & Presentation",
      duration: "1.5 Tháng (12 Buổi)",
      target: "Tự tin thuyết trình Tiếng Anh",
      focus: "Phát âm chuẩn & Làm chủ sân khấu",
      description: "Không chỉ dừng lại ở bài thi IELTS, khóa học này giúp bạn phát triển khả năng nói tiếng Anh trước công chúng một cách tự tin, chuyên nghiệp và có sức hút mãnh liệt nhất.",
      highlights: [
        "Rèn luyện phát âm chuẩn Anh-Anh hoặc Anh-Mỹ thông qua phương pháp Shadowing.",
        "Kỹ thuật kiểm soát tốc độ nói, nhấn nhá từ ngữ (word stress) và điều tiết hơi thở.",
        "Sử dụng ngôn ngữ cơ thể (body language) và giao tiếp bằng ánh mắt thuyết phục người nghe.",
        "Thực hành thuyết trình đề tài thực tế và được feedback chi tiết từng giây quay phim."
      ]
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal-on-scroll of course cards
      gsap.fromTo(
        ".course-card",
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const getIcon = (id: string) => {
    switch (id) {
      case "focus":
        return <BookOpen className="text-[#14532D]" size={24} />;
      case "masterclass":
        return <Headphones className="text-[#15803D]" size={24} />;
      case "intensive":
        return <PenTool className="text-[#14532D]" size={24} />;
      default:
        return <Sparkles className="text-[#15803D]" size={24} />;
    }
  };

  return (
    <section
      ref={containerRef}
      id="courses"
      className="py-28 bg-white relative overflow-hidden border-b border-black/5"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Editorial Heading */}
        <div className="max-w-3xl mb-16 text-left">
          <span className="font-mono text-xs tracking-[0.25em] text-[#14532D] uppercase block mb-3 font-bold">
            Lộ Trình Tinh Gọn - Cá Nhân Hóa
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-black tracking-tight text-[#1A1A1A] leading-tight mb-4">
            Các Chương Trình Đào Tạo <br />
            Chuyên Sâu Điểm Nhấn
          </h2>
          <p className="text-[#1A1A1A]/70 text-base md:text-lg leading-relaxed">
            Mỗi chương trình học đều được thiết kế tỉ mỉ, biên soạn tài liệu cập nhật liên tục từ đề thi thật tại IDP & BC. Chọn một khóa học để tìm hiểu chi tiết về giáo trình và chính sách cam kết đầu ra.
          </p>
        </div>

        {/* Featured flagship course, full width */}
        <div
          className="course-card bg-[#14532D] text-white p-8 md:p-12 rounded-3xl flex flex-col md:flex-row md:items-center gap-8 justify-between transition-all duration-300 hover:shadow-xl group cursor-pointer text-left mb-8 relative overflow-hidden"
          onClick={() => setSelectedCourse(courses[0])}
          id={`course-card-${courses[0].id}`}
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <BookOpen size={220} />
          </div>
          <div className="relative z-10 md:max-w-xl">
            <span className="font-mono text-[10px] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full font-bold inline-block mb-5">
              Chương trình chủ lực · {courses[0].duration}
            </span>
            <h3 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              {courses[0].title}
            </h3>
            <p className="font-mono text-xs font-semibold tracking-wider mb-4 uppercase text-[#9FE870]">
              {courses[0].target}
            </p>
            <p className="text-sm md:text-base text-white/75 leading-relaxed mb-6">
              {courses[0].description}
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-[#9FE870] transition-colors">
              <span>Tìm hiểu chi tiết giáo trình</span>
              <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
          <div className="relative z-10 h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            {getIcon(courses[0].id)}
          </div>
        </div>

        {/* Remaining courses, tighter trio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {courses.slice(1).map((course) => (
            <div
              key={course.id}
              className="course-card bg-white border border-black/5 hover:border-[#14532D]/55 p-6 md:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer text-left"
              onClick={() => setSelectedCourse(course)}
              id={`course-card-${course.id}`}
            >
              <div>
                {/* Upper line metadata */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${
                    course.id === "masterclass" || course.id === "speaking"
                      ? "bg-[#15803D]/10 border-[#15803D]/20"
                      : "bg-[#14532D]/10 border-[#14532D]/20"
                  }`}>
                    {getIcon(course.id)}
                  </div>
                  <span className="font-mono text-[10px] text-[#1A1A1A]/50 uppercase tracking-widest bg-black/5 border border-black/5 px-2.5 py-1 rounded-full font-bold">
                    {course.duration}
                  </span>
                </div>

                {/* Course Main Details */}
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] group-hover:text-[#14532D] transition-colors mb-2">
                  {course.title}
                </h3>
                <p className={`font-mono text-[11px] font-semibold tracking-wider mb-3 uppercase ${
                  course.id === "masterclass" || course.id === "speaking"
                    ? "text-[#15803D]"
                    : "text-[#14532D]"
                }`}>
                  {course.target}
                </p>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed mb-6 line-clamp-3">
                  {course.description}
                </p>
              </div>

              {/* Readmore trigger */}
              <div className="pt-5 border-t border-black/5 flex items-center justify-between text-xs font-bold text-[#1A1A1A]/80 group-hover:text-[#14532D] transition-colors uppercase tracking-wider">
                <span>Chi tiết giáo trình</span>
                <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Detail Modal */}
        {selectedCourse && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
            id="course-modal-overlay"
            onClick={() => setSelectedCourse(null)}
          >
            <div
              className="bg-white border border-black/10 w-full max-w-2xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] p-6 md:p-10 max-h-[90vh] overflow-y-auto relative text-left animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              id="course-modal-content"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors text-black/60 hover:text-black"
                id="close-modal-button"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
                  selectedCourse.id === "masterclass" || selectedCourse.id === "speaking"
                    ? "bg-[#15803D]/10 border-[#15803D]/20"
                    : "bg-[#14532D]/10 border-[#14532D]/20"
                }`}>
                  {getIcon(selectedCourse.id)}
                </div>
                <span className={`font-mono text-xs tracking-wider font-semibold uppercase ${
                  selectedCourse.id === "masterclass" || selectedCourse.id === "speaking"
                    ? "text-[#15803D]"
                    : "text-[#14532D]"
                }`}>
                  {selectedCourse.focus}
                </span>
              </div>

              <h3 className="font-serif text-3xl font-black text-[#1A1A1A] mb-2">
                {selectedCourse.title}
              </h3>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm font-mono text-[#1A1A1A]/70">
                <p>Thời gian học: <strong className="text-[#1A1A1A]">{selectedCourse.duration}</strong></p>
                <p>Mục tiêu: <strong className={`font-bold ${
                  selectedCourse.id === "masterclass" || selectedCourse.id === "speaking"
                    ? "text-[#15803D]"
                    : "text-[#14532D]"
                }`}>{selectedCourse.target}</strong></p>
              </div>

              <div className="h-px bg-black/10 w-full mb-6" />

              <h4 className="font-bold text-[#1A1A1A] text-base mb-3">Tổng quan khóa học</h4>
              <p className="text-sm text-[#1A1A1A]/70 leading-relaxed mb-6">
                {selectedCourse.description}
              </p>

              <h4 className="font-bold text-[#1A1A1A] text-base mb-4">Giá trị nổi bật nhận được</h4>
              <ul className="space-y-3 mb-8">
                {selectedCourse.highlights.map((highlight, index) => (
                  <li key={index} className="flex gap-3 text-sm text-[#1A1A1A]/85 leading-relaxed">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      selectedCourse.id === "masterclass" || selectedCourse.id === "speaking"
                        ? "bg-[#15803D]/10 border-[#15803D]/20"
                        : "bg-[#14532D]/10 border-[#14532D]/20"
                    }`}>
                      <Check size={12} className={`font-bold ${
                        selectedCourse.id === "masterclass" || selectedCourse.id === "speaking"
                          ? "text-[#15803D]"
                          : "text-[#14532D]"
                      }`} />
                    </div>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-black/10">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-6 py-2.5 text-xs font-bold text-[#1A1A1A]/60 hover:text-black uppercase tracking-wider"
                >
                  Đóng lại
                </button>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedCourse(null);
                    const contactSection = document.getElementById("contact");
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="px-6 py-2.5 bg-[#9FE870] hover:bg-[#86D65A] text-[#14532D] text-xs font-bold rounded-xl transition-colors uppercase tracking-wider shadow-md text-center"
                >
                  Đăng ký tư vấn miễn phí
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
