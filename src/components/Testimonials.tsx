import React, { useState, useEffect, useRef } from "react";
import { 
  Star, 
  Quote, 
  Award, 
  Search, 
  Plus, 
  Upload, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  ThumbsUp, 
  Filter, 
  Sparkles,
  ShieldCheck,
  Maximize2
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ExtendedTestimonialItem, initialTestimonials } from "../data/testimonialsData";

export default function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core Testimonials Data
  const [testimonials, setTestimonials] = useState<ExtendedTestimonialItem[]>(initialTestimonials);

  // UI state
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>("all");
  const [activeBandFilter, setActiveBandFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [selectedProofName, setSelectedProofName] = useState<string>("");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSchool, setFormSchool] = useState("");
  const [formCourse, setFormCourse] = useState("focus");
  const [formBeforeScore, setFormBeforeScore] = useState("5.5");
  const [formAfterScore, setFormAfterScore] = useState("7.5");
  const [formComment, setFormComment] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formL, setFormL] = useState("7.5");
  const [formR, setFormR] = useState("7.5");
  const [formW, setFormW] = useState("7.0");
  const [formS, setFormS] = useState("7.0");
  const [uploadedProof, setUploadedProof] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Statistics for overall ratings
  const totalRating = 4.9;
  const ratingBars = [
    { star: 5, percentage: 92, count: 1398 },
    { star: 4, percentage: 6, count: 91 },
    { star: 3, percentage: 2, count: 31 },
    { star: 2, percentage: 0, count: 0 },
    { star: 1, percentage: 0, count: 0 }
  ];

  // Map course id to clean names
  const courseNamesMap: Record<string, string> = {
    focus: "Lớp IELTS Focus (4 Kỹ Năng)",
    reading: "Reading Masterclass",
    listening: "Listening Masterclass",
    intensive: "Writing & Speaking Intensive"
  };

  const toggleExpand = (id: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleHelpfulClick = (id: string) => {
    if (helpfulVotes[id]) {
      // Undo vote
      setTestimonials(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, helpfulCount: item.helpfulCount - 1 };
        }
        return item;
      }));
      setHelpfulVotes(prev => ({ ...prev, [id]: false }));
    } else {
      // Add vote
      setTestimonials(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, helpfulCount: item.helpfulCount + 1 };
        }
        return item;
      }));
      setHelpfulVotes(prev => ({ ...prev, [id]: true }));
    }
  };

  // Mock File Upload Handler
  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Use a random Unsplash placeholder to represent their uploaded image
      const randomImages = [
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600"
      ];
      const selectedImage = randomImages[Math.floor(Math.random() * randomImages.length)];
      setUploadedProof(selectedImage);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formComment || !formSchool) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    const newFeedback: ExtendedTestimonialItem = {
      id: `student-${Date.now()}`,
      studentName: formName,
      score: `${formAfterScore} IELTS`,
      schoolOrJob: formSchool,
      courseId: formCourse,
      courseName: courseNamesMap[formCourse] || "Chương Trình IELTS",
      beforeScore: formBeforeScore,
      afterScore: formAfterScore,
      date: "Tháng Hiện Tại",
      rating: formRating,
      helpfulCount: 0,
      comment: formComment,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&q=80&w=200`,
      proofUrl: uploadedProof || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600",
      subScores: {
        listening: formL,
        reading: formR,
        writing: formW,
        speaking: formS
      }
    };

    setTestimonials(prev => [newFeedback, ...prev]);
    setFormSuccess(true);
    setTimeout(() => {
      // Reset form
      setFormName("");
      setFormSchool("");
      setFormComment("");
      setFormRating(5);
      setUploadedProof("");
      setFormSuccess(false);
      setIsSubmitModalOpen(false);
    }, 2500);
  };

  // Filter Logic
  const filteredTestimonials = testimonials.filter(item => {
    // 1. Course Filter
    const matchesCourse = activeCourseFilter === "all" || item.courseId === activeCourseFilter;
    
    // 2. Band Filter
    let matchesBand = true;
    if (activeBandFilter !== "all") {
      const numericScore = parseFloat(item.score.replace(/[^\d.]/g, ''));
      if (activeBandFilter === "8.0+") {
        matchesBand = numericScore >= 8.0;
      } else if (activeBandFilter === "7.0-7.5") {
        matchesBand = numericScore >= 7.0 && numericScore <= 7.5;
      } else if (activeBandFilter === "6.0-6.5") {
        matchesBand = numericScore >= 6.0 && numericScore <= 6.5;
      }
    }

    // 3. Search Query Filter
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.comment || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolOrJob.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.score.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCourse && matchesBand && matchesSearch;
  });

  return (
    <section
      ref={containerRef}
      id="testimonials"
      className="py-24 bg-white text-[#1A1A1A] relative overflow-hidden border-t border-b border-black/5"
    >
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(black_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header Block & Slogan */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-16">
          <div className="max-w-2xl text-left">
            <span className="font-mono text-xs tracking-[0.25em] text-[#E15243] uppercase block mb-3 font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#E15243]" />
              Góc Vinh Danh Học Viên
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-black tracking-tight text-[#1A1A1A] leading-tight mb-4">
              Điểm Số Thật - Đánh Giá Thật <br />
              Từ Đồng Đội HNT IELTS
            </h2>
            <p className="text-[#1A1A1A]/70 text-sm md:text-base leading-relaxed">
              Toàn bộ bảng điểm và nhận xét của học viên đều được xác minh thực tế qua hệ thống học thuật IDP & British Council. Cùng tìm hiểu câu chuyện tự học và bứt phá của các chiến binh xuất sắc!
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#1A1A1A] hover:bg-[#E15243] text-[#FAF9F6] hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md whitespace-nowrap self-start lg:self-end"
            id="write-review-button"
          >
            <Plus size={16} />
            Gửi nhận xét của bạn
          </button>
        </div>

        {/* Aggregated Reviews Dashboard Block (Classmate-vuive style) */}
        <div className="bg-white border border-black/5 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-12 shadow-sm text-left">
          {/* Big rating score */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-black/5 pb-6 md:pb-0 md:pr-8">
            <span className="font-serif text-6xl font-black text-[#1A1A1A] mb-2">{totalRating}</span>
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} className="fill-[#E15243] text-[#E15243]" />
              ))}
            </div>
            <p className="text-xs text-[#1A1A1A]/60 font-mono uppercase tracking-wider font-bold">
              Đánh giá trung bình tích lũy
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-mono rounded-full font-bold uppercase tracking-wider">
              <ShieldCheck size={12} />
              100% Đánh giá đã xác thực
            </div>
          </div>

          {/* Progress rating bars */}
          <div className="md:col-span-5 space-y-2.5">
            {ratingBars.map((item) => (
              <div key={item.star} className="flex items-center gap-3 text-xs">
                <span className="font-mono font-bold w-12 text-left shrink-0">{item.star} Sao</span>
                <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#E15243] rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="font-mono text-[#1A1A1A]/50 w-10 text-right">{item.percentage}%</span>
                <span className="font-mono text-[#1A1A1A]/30 w-12 text-right hidden sm:inline">({item.count})</span>
              </div>
            ))}
          </div>

          {/* Quick trust metrics */}
          <div className="md:col-span-3 bg-white border border-black/5 p-5 rounded-2xl flex flex-col justify-center text-center md:text-left">
            <div className="text-[#E15243] font-serif text-2xl font-black mb-1">1,520+</div>
            <p className="text-xs text-[#1A1A1A]/80 font-semibold mb-3 leading-relaxed">
              Học viên đã nộp bảng điểm chứng chỉ quốc tế IELTS về lớp.
            </p>
            <div className="h-px bg-black/5 w-full mb-3" />
            <div className="text-[#1A1A1A]/60 text-[10px] font-mono leading-relaxed uppercase font-bold">
              Cập nhật định kỳ tháng 07/2026
            </div>
          </div>
        </div>

        {/* Search, Filter, Tabs Control panel */}
        <div className="bg-white border border-black/5 p-6 rounded-3xl mb-10 shadow-sm flex flex-col gap-6 text-left">
          {/* Top row: search + band dropdown */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" size={18} />
              <input
                type="text"
                placeholder="Tìm tên học viên, bài viết hoặc điểm số..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#E15243] focus:bg-white transition-all duration-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Band brackets selector filter */}
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
              <Filter size={16} className="text-[#E15243]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60">Phân loại điểm:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { label: "Tất cả Band", value: "all" },
                  { label: "8.0+ IELTS", value: "8.0+" },
                  { label: "7.0 - 7.5", value: "7.0-7.5" },
                  { label: "6.0 - 6.5", value: "6.0-6.5" }
                ].map((band) => (
                  <button
                    key={band.value}
                    onClick={() => setActiveBandFilter(band.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeBandFilter === band.value
                        ? "bg-[#1A1A1A] text-[#FAF9F6]"
                        : "bg-black/5 hover:bg-black/10 text-[#1A1A1A]/80"
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-black/5 w-full" />

          {/* Bottom row: Course Program tabs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 block mb-1">
              Lọc theo Chương trình học tập:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Tất cả chương trình", value: "all" },
                { label: "IELTS Focus (4 Kỹ Năng)", value: "focus" },
                { label: "Reading Masterclass", value: "reading" },
                { label: "Listening Masterclass", value: "listening" },
                { label: "Writing & Speaking Intensive", value: "intensive" }
              ].map((course) => (
                <button
                  key={course.value}
                  onClick={() => setActiveCourseFilter(course.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    activeCourseFilter === course.value
                      ? "bg-[#E15243] text-white border-[#E15243] shadow-sm"
                      : "bg-white border-black/5 text-[#1A1A1A]/70 hover:bg-black/5"
                  }`}
                >
                  {course.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Main Feed */}
        {filteredTestimonials.length === 0 ? (
          <div className="py-16 text-center bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
            <MessageSquare size={48} className="mx-auto text-black/20 mb-4" />
            <h3 className="font-serif text-xl font-bold mb-1">Không tìm thấy đánh giá nào</h3>
            <p className="text-sm text-black/50 max-w-sm mx-auto leading-relaxed">
              Thử nhập từ khóa khác hoặc điều chỉnh các bộ lọc ở bảng điều khiển phía trên.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTestimonials.slice(0, visibleCount).map((test) => {
              const isLongComment = (test.comment?.length ?? 0) > 180;
              const isExpanded = expandedReviews[test.id] || false;
              const hasVoted = helpfulVotes[test.id] || false;

              return (
                <div
                  key={test.id}
                  className="testimonial-card bg-white border border-black/5 hover:border-[#E15243]/35 p-6 lg:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:shadow-xl relative group text-left"
                  id={test.id}
                >
                  {/* Decorative Quote Mark */}
                  <div className="absolute top-6 right-6 text-black/5 group-hover:text-[#E15243]/10 transition-colors pointer-events-none">
                    <Quote size={40} />
                  </div>

                  <div>
                    {/* Upper row: Star rating & Target Band status */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={`${i < test.rating ? 'fill-[#E15243] text-[#E15243]' : 'text-black/10'}`} 
                          />
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#E15243]/10 border border-[#E15243]/20 text-[#E15243] text-[10px] font-mono uppercase tracking-wider rounded-full font-bold shadow-sm">
                        <Award size={10} />
                        {test.score}
                      </span>
                    </div>

                    {/* Subskills Breakdown parameters */}
                    {test.subScores && (
                      <div className="grid grid-cols-4 gap-1.5 mb-4 font-mono text-[9px] text-center uppercase tracking-wider font-extrabold text-[#1A1A1A]/75">
                        <div className="bg-black/5 py-1 px-1.5 rounded">L: {test.subScores.listening}</div>
                        <div className="bg-black/5 py-1 px-1.5 rounded">R: {test.subScores.reading}</div>
                        <div className="bg-black/5 py-1 px-1.5 rounded">W: {test.subScores.writing}</div>
                        <div className="bg-black/5 py-1 px-1.5 rounded">S: {test.subScores.speaking}</div>
                      </div>
                    )}

                    {/* Course Program & Date tags */}
                    <div className="flex flex-wrap gap-2 items-center mb-4 text-[10px] font-mono text-black/40 font-bold uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1 text-[#E15243] font-extrabold">
                        <Check size={12} />
                        {test.courseName}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={10} />
                        {test.date}
                      </span>
                    </div>

                    {/* Review text comment with toggle triggers */}
                    {test.comment && (
                      <div className="relative mb-5">
                        <p className={`text-xs md:text-sm text-[#1A1A1A]/80 leading-relaxed font-serif ${!isExpanded && isLongComment ? 'line-clamp-4' : ''}`}>
                          "{test.comment}"
                        </p>

                        {!isExpanded && isLongComment && (
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}

                        {isLongComment && (
                          <button
                            onClick={() => toggleExpand(test.id)}
                            className="mt-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#E15243] hover:text-[#D04335] inline-flex items-center gap-1 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>Rút gọn <ChevronUp size={12} /></>
                            ) : (
                              <>Xem thêm <ChevronDown size={12} /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Clickable Verification Image Proof attachment */}
                    {test.proofUrl && (
                      <div 
                        onClick={() => {
                          setSelectedProofUrl(test.proofUrl || null);
                          setSelectedProofName(test.studentName);
                        }}
                        className="mb-6 relative rounded-2xl overflow-hidden border border-black/5 group/proof cursor-zoom-in bg-black/[0.03] shadow-sm h-80"
                      >
                        <img
                          src={test.proofUrl}
                          alt="Bảng điểm xác minh"
                          className="w-full h-full object-contain group-hover/proof:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/proof:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 font-mono uppercase tracking-wider">
                          <Maximize2 size={14} />
                          Phóng to bảng điểm
                        </div>
                      </div>
                    )}

                    {/* Divider Line */}
                    <div className="h-px bg-black/5 w-full mb-4" />

                    {/* Bottom Student Bio row & Upvotes */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-serif font-black text-xs text-[#1A1A1A] leading-tight">
                            {test.studentName}
                          </h4>
                          <p className="font-mono text-[9px] text-[#1A1A1A]/50 uppercase tracking-widest mt-0.5 font-extrabold leading-none">
                            {test.schoolOrJob}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button element */}
        {filteredTestimonials.length > visibleCount && (
          <div className="mt-12 text-center" id="load-more-testimonials-container">
            <button
              onClick={() => setVisibleCount(prev => prev + 6)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-black/10 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#1A1A1A] hover:text-[#FAF9F6] hover:border-[#1A1A1A] transition-all duration-300 cursor-pointer shadow-sm"
              id="load-more-button"
            >
              <span>Xem thêm đánh giá</span>
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {/* Lightbox Modal Overlay for score reports */}
        <AnimatePresence>
          {selectedProofUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProofUrl(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
              id="proof-lightbox-overlay"
            >
              {/* Close Button top-right */}
              <button 
                onClick={() => setSelectedProofUrl(null)}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                id="close-lightbox"
              >
                <X size={24} />
              </button>

              {/* Lightbox container */}
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-3xl w-full flex flex-col items-center"
              >
                <img 
                  src={selectedProofUrl} 
                  alt="IELTS Report Proof" 
                  className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
                />
                <div className="mt-4 text-center">
                  <h4 className="text-white font-serif font-bold text-lg mb-1">
                    Chứng thực bảng điểm IELTS - Học viên {selectedProofName}
                  </h4>
                  <div className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <ShieldCheck size={14} />
                    Xác minh đạt chuẩn thực tế của HNT IELTS
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Submission review form dialog modal */}
        <AnimatePresence>
          {isSubmitModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
              id="submit-modal-overlay"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
                className="bg-white border border-black/10 w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative text-left"
                id="submit-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-[#1A1A1A]/60 hover:text-black transition-colors cursor-pointer"
                  id="close-submit-modal"
                >
                  <X size={20} />
                </button>

                {formSuccess ? (
                  <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-200 mx-auto">
                      <CheckCircle2 size={36} />
                    </div>
                    <h3 className="font-serif text-2xl font-black text-[#1A1A1A]">
                      Đã Gửi Đánh Giá Thành Công!
                    </h3>
                    <p className="text-sm text-[#1A1A1A]/70 max-w-sm mx-auto leading-relaxed">
                      Cám ơn bạn đã đóng góp phản hồi quý báu cho tập thể lớp. Hệ thống học thuật của cô Ngọc Thương sẽ tự động cập nhật và xác minh bảng điểm của bạn.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div>
                      <h3 className="font-serif text-2xl font-black text-[#1A1A1A] mb-1">
                        Gửi Phản Hồi Học Viên
                      </h3>
                      <p className="text-xs text-[#1A1A1A]/50">
                        Chia sẻ cảm nhận, điểm số và sơ đồ lộ trình học để truyền cảm hứng cho những học viên khóa tiếp theo.
                      </p>
                    </div>

                    <div className="h-px bg-black/5 w-full" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                          Họ Và Tên Học Viên <span className="text-[#E15243]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ví dụ: Hoàng Mai Chi"
                          className="w-full px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#E15243] focus:bg-white transition-all"
                        />
                      </div>

                      {/* school or job */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                          Trường Học / Nghề Nghiệp <span className="text-[#E15243]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formSchool}
                          onChange={(e) => setFormSchool(e.target.value)}
                          placeholder="Ví dụ: Đại học Ngoại Thương"
                          className="w-full px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#E15243] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Course dropdown */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                          Khóa Học Đã Đăng Ký
                        </label>
                        <select
                          value={formCourse}
                          onChange={(e) => setFormCourse(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#E15243] transition-all font-sans"
                        >
                          <option value="focus">IELTS Focus 4 Kỹ Năng</option>
                          <option value="reading">Reading Masterclass</option>
                          <option value="listening">Listening Masterclass</option>
                          <option value="intensive">Writing & Speaking Intensive</option>
                        </select>
                      </div>

                      {/* Before score */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                          Điểm Đầu Vào
                        </label>
                        <input
                          type="text"
                          value={formBeforeScore}
                          onChange={(e) => setFormBeforeScore(e.target.value)}
                          placeholder="Ví dụ: 5.5"
                          className="w-full px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#E15243] focus:bg-white transition-all font-mono"
                        />
                      </div>

                      {/* After score */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                          Band Score Đạt Được
                        </label>
                        <input
                          type="text"
                          value={formAfterScore}
                          onChange={(e) => setFormAfterScore(e.target.value)}
                          placeholder="Ví dụ: 7.5 IELTS"
                          className="w-full px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#E15243] focus:bg-white transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Breakdown subscores row */}
                    <div className="p-4 bg-black/5 rounded-2xl">
                      <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2">
                        Nhập Điểm Chi Tiết Các Kỹ Năng (Tùy chọn)
                      </span>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[8px] font-mono text-[#1A1A1A]/50 mb-1 font-extrabold uppercase">Nghe</label>
                          <input 
                            type="text" 
                            value={formL} 
                            onChange={(e) => setFormL(e.target.value)} 
                            className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-lg text-center font-mono text-xs focus:border-[#E15243] focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-[#1A1A1A]/50 mb-1 font-extrabold uppercase">Đọc</label>
                          <input 
                            type="text" 
                            value={formR} 
                            onChange={(e) => setFormR(e.target.value)} 
                            className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-lg text-center font-mono text-xs focus:border-[#E15243] focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-[#1A1A1A]/50 mb-1 font-extrabold uppercase">Viết</label>
                          <input 
                            type="text" 
                            value={formW} 
                            onChange={(e) => setFormW(e.target.value)} 
                            className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-lg text-center font-mono text-xs focus:border-[#E15243] focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-[#1A1A1A]/50 mb-1 font-extrabold uppercase">Nói</label>
                          <input 
                            type="text" 
                            value={formS} 
                            onChange={(e) => setFormS(e.target.value)} 
                            className="w-full px-2.5 py-1.5 bg-white border border-black/10 rounded-lg text-center font-mono text-xs focus:border-[#E15243] focus:outline-none" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Select slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60">Đánh giá chung:</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            className="text-[#E15243] hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star 
                              size={20} 
                              className={`${star <= formRating ? 'fill-[#E15243]' : 'text-black/10'}`} 
                            />
                          </button>
                        ))}
                      </div>
                      <span className="font-mono text-xs font-bold text-[#E15243]">({formRating} / 5 Sao)</span>
                    </div>

                    {/* Comment text block */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                        Nội Dung Đánh Giá Chi Tiết <span className="text-[#E15243]">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        placeholder="Hãy viết cảm nhận thực tế của bạn về giáo trình, sự tận tình của giáo viên và phương pháp học đã giúp bạn bứt phá như thế nào..."
                        className="w-full px-4 py-2.5 bg-black/5 border border-black/10 rounded-xl text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#E15243] focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {/* Proof Certificate file picker */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">
                        Tải Lên Bảng Điểm / File Xác Minh (Tùy chọn)
                      </label>
                      <div className="border-2 border-dashed border-black/10 hover:border-[#E15243]/40 rounded-2xl p-4 text-center transition-all bg-black/[0.01]">
                        <input
                          type="file"
                          id="proof-upload-input"
                          accept="image/*"
                          onChange={handleMockUpload}
                          className="hidden"
                        />
                        <label htmlFor="proof-upload-input" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                          <Upload size={20} className="text-[#E15243]" />
                          <span className="text-xs font-bold text-[#1A1A1A]">
                            {uploadedProof ? "✓ Đã chọn file minh chứng thành công" : "Kéo thả hoặc nhấp để tải ảnh bảng điểm (TRF)"}
                          </span>
                          <span className="text-[9px] text-[#1A1A1A]/40 font-mono">
                            Hỗ trợ định dạng PNG, JPG, PDF tối đa 10MB
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Footer buttons row */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="px-5 py-2 text-xs font-bold text-black/50 hover:text-black uppercase tracking-wider cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#E15243] text-[#FAF9F6] hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Gửi nhận xét
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
