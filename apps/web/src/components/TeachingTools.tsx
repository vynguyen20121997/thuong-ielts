"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, ZoomIn, ChevronLeft, ChevronRight, ArrowRight, GraduationCap } from "lucide-react";
import Reveal from "./Reveal";
import NavigationButtonLabel from "./NavigationButtonLabel";

/**
 * Khối "Hệ thống & Công cụ giảng dạy" trên trang chủ.
 *
 * Bố cục và slideshow dựng y theo `Certificates.tsx`: cột trái là lời khẳng
 * định, cột phải là bằng chứng chạy slide — ở đây bằng chứng là ảnh chụp màn
 * hình chính các công cụ cô đang dùng.
 *
 * Nội dung chép đúng doc cấu trúc website (mục HỆ THỐNG & CÔNG CỤ GIẢNG DẠY):
 * ba công cụ, tên và mô tả giữ nguyên chữ của doc — đừng rút gọn lại cho "đẹp",
 * doc là bản đã duyệt. Mỗi ảnh trong doc kèm đúng một dòng chú thích, và chính
 * dòng đó là `detail` của slide.
 *
 * LƯU Ý RIÊNG TƯ: hai ảnh Speaking trong doc có tên thật của học sinh (cột
 * Students, và dải tab cuối bảng). Ảnh đưa lên đây đã cắt bỏ những phần đó.
 * Thay ảnh mới thì phải cắt lại, đừng dán thẳng ảnh từ doc.
 */

type Shot = {
  url: string;
  title: string;
  detail: string;
  alt: string;
};

const SHOTS: Shot[] = [
  {
    url: "/images/he-thong/mock-test-feedback.webp",
    title: "Hệ thống tạo feedback Mock Test tự động",
    detail: "Feedback được cá nhân hóa",
    alt: "Bảng điểm Mock Test kèm nhận xét riêng cho từng kỹ năng của mỗi học sinh",
  },
  {
    url: "/images/he-thong/mock-test-report.webp",
    title: "Hệ thống tạo feedback Mock Test tự động",
    detail: "Tạo báo cáo để gửi cho phụ huynh/học sinh",
    alt: "Phiếu Student Feedback Form: điểm bốn kỹ năng, bảng đánh giá năng lực và hành động tiếp theo",
  },
  {
    url: "/images/he-thong/reading-listening-tracker.webp",
    title: "Reading & Listening Tracker",
    detail: "Hệ thống theo dõi tiến bộ Reading & Listening và lỗi sai",
    alt: "Bảng theo dõi từng bài Reading: ngày, mã đề, số câu đúng và phần tự phân tích lỗi sai",
  },
  {
    url: "/images/he-thong/speaking-monitor-lop.webp",
    title: "Speaking in-class monitor",
    detail: "Feedback tổng của cả lớp cho mỗi buổi học",
    alt: "Bảng tổng hợp lỗi Speaking của cả lớp theo buổi học, đếm số lần lặp lại từng lỗi",
  },
  {
    url: "/images/he-thong/speaking-monitor-ca-nhan.webp",
    title: "Speaking in-class monitor",
    detail: "Feedback riêng cho từng cá nhân cho mỗi buổi học",
    alt: "Phiếu Speaking riêng của một học sinh: mục tiêu buổi học, điểm mạnh, lỗi kèm ví dụ và lời khuyên",
  },
];

const AUTOPLAY_MS = 5000;

export default function TeachingTools() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  // direction chỉ phục vụ animation: 1 = tiến (trượt trái), -1 = lùi
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState<Shot | null>(null);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => (i + dir + SHOTS.length) % SHOTS.length);
  };

  // Tự chạy — dừng khi rê chuột, mở lightbox, hoặc người dùng tắt animation
  useEffect(() => {
    if (reduce || paused || lightbox) return;
    const t = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % SHOTS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduce, paused, lightbox]);

  const shot = SHOTS[index];

  return (
    <section id="he-thong-giang-day" className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-start">
          {/* Cột trái: giới thiệu hệ thống */}
          <Reveal className="flex flex-col items-start gap-5">
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
              Hệ thống &amp; Công cụ giảng dạy
            </span>
            <h2 className="font-serif text-3xl md:text-[42px] font-bold tracking-tight text-brand leading-[1.12]">
              Công cụ đồng hành cùng học viên
            </h2>
            <p className="text-brand/70 text-base leading-relaxed">
              Bên cạnh nội dung bài học, giáo viên xây dựng một hệ thống theo dõi riêng để việc học
              không dừng lại ở từng buổi trên lớp. Bài tập, lỗi sai, kết quả Reading – Listening,
              feedback Speaking và các bài Mock Test đều được ghi nhận xuyên suốt quá trình học.
            </p>
            <p className="text-brand/70 text-base leading-relaxed">
              Nhờ đó, học sinh nhìn thấy rõ mình đang sai ở đâu, lỗi nào lặp lại nhiều lần và kỹ
              năng nào đang thực sự tiến bộ — bấm vào ảnh bên cạnh để xem rõ từng hệ thống.
            </p>
            <Link
              href="/he-thong-cong-cu"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand hover:bg-brand-deep text-white font-bold text-sm rounded-full transition-colors duration-300 shadow-md"
            >
              <NavigationButtonLabel>Khám phá hệ thống giảng dạy</NavigationButtonLabel>
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          {/* Cột phải: sân khấu slideshow */}
          <Reveal delay={0.1}>
            <div
              className="relative bg-mist border border-black/5 rounded-[32px] px-3 py-4 md:px-10 md:py-5"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="relative h-[400px] sm:h-[480px] md:h-[560px] overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.button
                    key={shot.url}
                    type="button"
                    custom={direction}
                    initial={reduce ? false : { opacity: 0, x: direction * 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: direction * -80 }}
                    transition={{ type: "spring", stiffness: 160, damping: 24 }}
                    onClick={() => setLightbox(shot)}
                    className="group absolute inset-0 flex items-center justify-center cursor-zoom-in"
                    aria-label={`Phóng to ${shot.title}`}
                  >
                    <span className="relative block max-h-full">
                      <img
                        src={shot.url}
                        alt={shot.alt}
                        className="max-h-full w-auto max-w-full object-contain rounded-2xl shadow-[0_16px_48px_rgba(20,83,45,0.14)] select-none"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-brand/0 group-hover:bg-brand/15 transition-colors duration-300">
                        <ZoomIn
                          size={30}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow"
                        />
                      </span>
                    </span>
                  </motion.button>
                </AnimatePresence>

                {/* Nút chuyển neo theo ảnh để caption không làm lệch trục điều hướng. */}
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Ảnh trước"
                  className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-white hover:bg-brand hover:text-white text-brand rounded-full shadow-md transition-colors cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Ảnh kế tiếp"
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-white hover:bg-brand hover:text-white text-brand rounded-full shadow-md transition-colors cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Caption nằm trong slideshow và đổi cùng ảnh hiện tại. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={shot.url}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mt-5 border-t border-brand/10 pt-5"
                >
                  <p className="font-serif text-xl font-bold leading-snug text-brand">{shot.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-brand/60">{shot.detail}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Chấm điều hướng */}
            <div className="mt-5 flex items-center justify-center gap-2">
              {SHOTS.map((s, i) => (
                <button
                  key={s.url}
                  type="button"
                  aria-label={`Xem ảnh ${i + 1}`}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === index ? "w-7 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/45"
                  }`}
                />
              ))}
            </div>
          </Reveal>
        </div>

        {/* Bộ đề luyện tập miễn phí — lối vào phòng luyện đề của site */}
        <Reveal delay={0.1} className="mt-14">
          <Link
            href="/kiem-tra-kien-thuc"
            className="group block bg-brand hover:bg-brand-deep rounded-[28px] p-8 md:p-10 transition-colors duration-300"
          >
            <span className="h-14 w-14 rounded-full bg-sage-3/20 flex items-center justify-center mb-6">
              <GraduationCap size={22} className="text-leaf" />
            </span>
            <h3 className="font-serif text-xl md:text-2xl font-bold text-white mb-2 leading-snug">
              Bộ Đề Luyện Tập Miễn Phí
            </h3>
            <p className="text-sm md:text-base text-leaf/80 leading-relaxed mb-6 max-w-xl">
              Bấm giờ như thi thật, nộp bài là có điểm, band ước lượng và giải thích từng câu.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf">
              <NavigationButtonLabel>Vào Phòng Luyện Tập</NavigationButtonLabel>
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </Link>
        </Reveal>
      </div>

      {/* Lightbox — cùng pattern với Certificates/Feedback */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
            id="teaching-tool-lightbox"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-6xl w-full flex flex-col items-center"
            >
              <img
                src={lightbox.url}
                alt={lightbox.alt}
                className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
              />
              <p className="mt-4 text-center text-white font-serif font-bold text-base max-w-lg">
                {lightbox.title}
                <span className="block mt-1 font-sans font-normal text-sm text-white/70">
                  {lightbox.detail}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
