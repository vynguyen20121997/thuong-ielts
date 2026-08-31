"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, ZoomIn, ChevronLeft, ChevronRight, Check } from "lucide-react";
import Reveal from "./Reveal";

/**
 * Khối "Học vấn & Chứng chỉ" trên trang chủ, ngay dưới hero — theo Google Doc
 * cấu trúc website (note [a]: 3 bằng IELTS + bằng giảng dạy).
 *
 * Layout 2 cột: HỒ SƠ NĂNG LỰC (chuyển từ hero xuống) bên trái, SLIDESHOW bằng
 * cấp bên phải — chữ là lời khẳng định, ảnh bằng ngay cạnh là bằng chứng.
 * Slideshow tự chạy 5s, dừng khi rê chuột / mở lightbox.
 *
 * LƯU Ý: doc nhắc "1 bằng CELTA" nhưng KHÔNG nhúng ảnh CELTA — ảnh thứ tư trong
 * doc là chứng chỉ IELTS Teacher Training của IDP, nên ở đây ghi đúng tên đó.
 * Có ảnh CELTA thật thì thêm vào CERTS, đừng đổi nhãn ảnh IDP thành CELTA.
 */

// Hồ sơ năng lực — gạch đầu dòng theo sheet portfolio (trước đây nằm ở hero)
const CREDENTIALS = [
  "IELTS Overall 8.5 — 3 lần thi",
  "Reading & Listening 9.0 — 3 lần",
  "Writing 8.5 (2026) · Speaking 8.5 (2021)",
  "Chứng chỉ CELTA — Đại học Cambridge",
  "6 năm kinh nghiệm luyện thi IELTS",
] as const;

type Cert = {
  url: string;
  title: string;
  detail: string;
};

const CERTS: Cert[] = [
  {
    url: "/images/certificates/ielts-2026.webp",
    title: "IELTS Academic — Overall 8.5",
    detail: "07/2026 · Listening 9.0 · Reading 9.0 · Writing 8.5 · Speaking 7.5",
  },
  {
    url: "/images/certificates/ielts-2021.webp",
    title: "IELTS Academic — Overall 8.5",
    detail: "12/2021 · Listening 9.0 · Reading 9.0 · Writing 7.5 · Speaking 8.5",
  },
  {
    url: "/images/certificates/ielts-2019.webp",
    title: "IELTS Academic — Overall 8.5",
    detail: "09/2019 · Listening 9.0 · Reading 9.0 · Writing 7.5 · Speaking 8.0",
  },
  {
    url: "/images/certificates/idp-teacher-training.webp",
    title: "IELTS Teacher Training Program",
    detail: "Certificate of Training · IDP Education Vietnam · 11/2021",
  },
];

const AUTOPLAY_MS = 5000;

export default function Certificates() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  // direction chỉ phục vụ animation: 1 = tiến (trượt trái), -1 = lùi
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState<Cert | null>(null);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => (i + dir + CERTS.length) % CERTS.length);
  };

  // Tự chạy — dừng khi rê chuột, mở lightbox, hoặc người dùng tắt animation
  useEffect(() => {
    if (reduce || paused || lightbox) return;
    const t = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % CERTS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduce, paused, lightbox]);

  const cert = CERTS[index];

  return (
    <section id="bang-cap" className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-center">
          {/* Cột trái: hồ sơ năng lực (chuyển từ hero xuống) */}
          <Reveal className="flex flex-col items-start gap-5">
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand">
              Học vấn &amp; Chứng chỉ
            </span>
            <h2 className="font-serif text-3xl md:text-[42px] font-bold tracking-tight text-brand leading-[1.12]">
              Hồ sơ năng lực
            </h2>
            <p className="text-brand/70 text-base leading-relaxed">
              Ba lần thi IELTS đều đạt Overall 8.5 với Reading và Listening 9.0 tuyệt đối. Mỗi
              gạch đầu dòng bên dưới đều có bằng thật bên cạnh — bấm vào ảnh để phóng to.
            </p>
            <ul className="space-y-3">
              {CREDENTIALS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2.5 text-sm md:text-base text-brand/80"
                >
                  <span className="h-6 w-6 rounded-full bg-leaf flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} className="text-brand-deep" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>

            {/* Chú thích bằng đang hiện bên slideshow */}
            <div className="mt-2 pt-5 border-t border-black/10 w-full">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand/45 mb-1.5">
                Đang xem
              </p>
              <p className="font-serif font-bold text-brand text-lg leading-snug">{cert.title}</p>
              <p className="text-sm text-brand/60 mt-1">{cert.detail}</p>
            </div>
          </Reveal>

          {/* Cột phải: sân khấu slideshow */}
          <Reveal delay={0.1}>
            <div
              className="relative bg-mist border border-black/5 rounded-[32px] px-4 py-6 md:px-16 md:py-8"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="relative h-[400px] sm:h-[480px] md:h-[560px] overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.button
                    key={cert.url}
                    type="button"
                    custom={direction}
                    initial={reduce ? false : { opacity: 0, x: direction * 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: direction * -80 }}
                    transition={{ type: "spring", stiffness: 160, damping: 24 }}
                    onClick={() => setLightbox(cert)}
                    className="group absolute inset-0 flex items-center justify-center cursor-zoom-in"
                    aria-label={`Phóng to ${cert.title}`}
                  >
                    <span className="relative block h-full">
                      <img
                        src={cert.url}
                        alt={cert.title}
                        className="h-full w-auto max-w-full object-contain rounded-2xl shadow-[0_16px_48px_rgba(20,83,45,0.14)] select-none"
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
              </div>

              {/* Nút chuyển trái/phải */}
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Bằng trước"
                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-white hover:bg-brand hover:text-white text-brand rounded-full shadow-md transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Bằng kế tiếp"
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-white hover:bg-brand hover:text-white text-brand rounded-full shadow-md transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Chấm điều hướng */}
            <div className="mt-5 flex items-center justify-center gap-2">
              {CERTS.map((c, i) => (
                <button
                  key={c.url}
                  type="button"
                  aria-label={`Xem bằng ${i + 1}`}
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
      </div>

      {/* Lightbox — cùng pattern với Feedback/Testimonials */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
            id="certificate-lightbox"
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
              className="max-w-4xl w-full flex flex-col items-center"
            >
              <img
                src={lightbox.url}
                alt={lightbox.title}
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
