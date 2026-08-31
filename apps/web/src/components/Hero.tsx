"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type Variants,
} from "motion/react";
import type { HeroContent } from "@thuong-ielts/db";

const DEFAULT_HERO: HeroContent = {
  portraitUrl: "/images/ho-ngoc-thuong-hero.webp",
  titleLine1: "Hồ Ngọc Thương",
  titleLine2: "Giáo Viên IELTS",
  quote:
    "Giúp học viên tiến bộ thông qua lộ trình có hệ thống, nhận xét chi tiết và phương pháp học tập phù hợp.",
  bio: "IELTS Overall 8.5 (3 lần thi), Reading & Listening 9.0 (3 lần), Writing 8.5 (2026), Speaking 8.5 (2021). Chứng chỉ giảng dạy CELTA do Đại học Cambridge cấp và 6 năm kinh nghiệm luyện thi IELTS.",
  closingLine:
    "Theo đuổi IELTS vì đam mê, và sau khi chạm mốc 8.5 Overall thì chọn con đường giảng dạy để giúp người khác đi nhanh hơn con đường mình từng đi.",
};

// Ba con số muốn nổi ngay cạnh chân dung — khác STATS ở dưới: đây là phần
// highlight, STATS là dải điểm số đầy đủ đè mép dưới hero.
const HERO_HIGHLIGHTS = [
  { value: "8.5", label: "IELTS Overall (×3)" },
  { value: "6 năm", label: "Kinh nghiệm giảng dạy" },
  { value: "120+", label: "Học viên thành công" },
] as const;

const STATS = [
  { value: "8.5", label: "Overall Band (×3)" },
  { value: "9.0", label: "Reading & Listening (×3)" },
  { value: "8.5", label: "Writing · 2026" },
  { value: "8.5", label: "Speaking · 2021" },
] as const;

/*
  Entrance kiểu "hero stagger" của motion.dev: cột chữ là container stagger,
  từng khối con bật vào bằng SPRING (trồi lên + phóng nhẹ + khử blur) nối đuôi
  nhau — cảm giác nảy tự nhiên thay vì ease tuyến tính.
*/
const textContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const popIn: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 170, damping: 22 },
  },
};

export default function Hero() {
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  const reduce = useReducedMotion();

  // Parallax nhẹ theo chuột cho chân dung — spring của motion cho mượt
  const mx = useMotionValue(0);
  const parallaxX = useSpring(mx, { stiffness: 60, damping: 18 });

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => {
        if (!res.ok) throw new Error(`/api/hero returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Merging an {error: "..."} body would inject a bogus key and blank
        // the hero — only accept a plain content object.
        if (data && typeof data === "object" && !("error" in data)) {
          setHero((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error("Failed to load hero content:", err));
  }, []);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      mx.set(((e.clientX - window.innerWidth / 2) / window.innerWidth) * 24);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce, mx]);

  return (
    <section
      id="hero"
      className="relative pt-24 md:pt-28 overflow-hidden bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-end">
          {/* Cột chữ: container stagger, từng khối bật vào bằng spring.
              `self-center` để khối chữ ngang tầm chân dung — lưới vẫn giữ
              `items-end` cho cột ảnh dính đáy, nếu để chữ theo đáy luôn thì nó
              bị tuột xuống ngang chân hình. */}
          <motion.div
            variants={textContainer}
            initial={reduce ? false : "hidden"}
            animate="visible"
            className="text-left pb-6 md:pb-0 md:self-center order-1"
          >
            <motion.h1
              variants={popIn}
              className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.1] mb-5"
            >
              <span className="text-brand">{hero.titleLine1} </span>
              {/* Dòng 2 gạch chân bằng border của chính span: vệt kẻ luôn dài
                  đúng bằng chữ, không phải canh tay một khối trang trí rời. */}
              <span className="text-brand-soft inline-block border-b-4 border-leaf pb-1">
                {hero.titleLine2}.
              </span>
            </motion.h1>

            <motion.p
              variants={popIn}
              className="text-brand/75 text-sm md:text-base leading-relaxed mb-7 max-w-lg"
            >
              {hero.quote}
            </motion.p>

            <motion.div variants={popIn} className="flex flex-wrap items-center gap-4">
              <a
                href="#testimonials"
                className="px-8 py-4 bg-brand hover:bg-brand-deep text-white font-bold text-sm rounded-full transition-colors duration-300 shadow-md cursor-pointer"
              >
                Xem Thành Tích Học Viên
              </a>
              <a
                href="#phuong-phap"
                className="px-8 py-4 bg-brand hover:bg-brand-deep text-white font-bold text-sm rounded-full transition-colors duration-300 shadow-md cursor-pointer"
              >
                Khám Phá Phương Pháp Giảng Dạy
              </a>
            </motion.div>
          </motion.div>

          {/* Chân dung zoom lớn tràn khỏi TẤM THẺ xanh phía sau (đúng hình khối poster) */}
          <div className="relative h-[460px] sm:h-[560px] md:h-[640px] order-2">
            {/* Tấm thẻ bo lớn, mọc lên từ đáy bằng spring */}
            <motion.div
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.1 }}
              style={{ transformOrigin: "bottom center" }}
              className="absolute left-[-4%] right-[-4%] top-[2%] bottom-0"
            >
              {/* Vòng sau, lệch phải-xuống: xanh non pha loãng, đậm hơn vòng
                  trước một nhịp để còn thấy được viền lệch */}
              <div className="absolute inset-0 translate-x-6 translate-y-4 rounded-full bg-gradient-to-br from-leaf/55 to-leaf-dark/45" />
              {/* Vòng trước: gradient nhạt nhất, từ sage sang leaf pha loãng */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sage-3 to-leaf/55" />
            </motion.div>
            {/* Ba con số neo mép phải, chồng lên phần trống bên phải khối xanh
                — không lấy bề ngang của cột nên hai bóng xanh giữ nguyên dáng */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.55 }}
              className="absolute right-0 md:-right-8 top-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col gap-3.5 w-[150px]"
            >
              {HERO_HIGHLIGHTS.map((h) => (
                <div
                  key={h.label}
                  className="flex flex-col gap-1 rounded-[20px] border border-brand/8 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(20,83,45,0.12)]"
                >
                  <span className="text-[34px] font-bold leading-none tracking-tight text-brand-soft">
                    {h.value}
                  </span>
                  <span className="text-xs font-semibold leading-snug text-brand/60">
                    {h.label}
                  </span>
                </div>
              ))}
            </motion.div>
            {/* Wrapper giữ căn giữa bằng Tailwind; clip-path chạy trên khối
                bọc nên ảnh và bóng sticker lộ ra cùng một nhịp — trước đây chỉ
                ảnh chính trượt lên còn bóng đứng yên, nên lúc đang chạy nhìn
                thành hai hình lệch nhau. */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[85%] w-auto md:h-auto md:w-[108%] max-w-none pointer-events-none">
              <motion.div
                initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ x: parallaxX }}
                className="relative h-full w-auto md:h-auto md:w-full"
              >
                <img
                  src={hero.portraitUrl}
                  alt="Cô Hồ Ngọc Thương"
                  className="relative h-full w-auto md:h-auto md:w-full max-w-none object-contain object-bottom select-none"
                />
                {/* Bóng silhouette lệch kiểu sticker (như mẫu): chính ảnh đó,
                    brightness(0)+invert(1) thành mảng trắng phẳng, đẩy lệch phải */}
                <img
                  aria-hidden="true"
                  src={hero.portraitUrl}
                  alt=""
                  className="absolute inset-0 h-full w-auto md:h-auto md:w-full max-w-none object-contain object-bottom select-none -z-10 translate-x-7 [filter:brightness(0)invert(1)] opacity-70"
                />
              </motion.div>
            </div>
          </div>

          {/* Rail số dưới md: một hàng ba thẻ, nằm sau chân dung trong lưới */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.55 }}
            className="order-3 grid grid-cols-3 gap-3 md:hidden"
          >
            {HERO_HIGHLIGHTS.map((h) => (
              <div
                key={h.label}
                className="flex flex-col gap-1 rounded-[20px] border border-brand/8 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(20,83,45,0.12)]"
              >
                <span className="text-2xl font-bold leading-none tracking-tight text-brand-soft">
                  {h.value}
                </span>
                <span className="text-2xs font-semibold leading-snug text-brand/60">
                  {h.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Thanh điểm số sáng đè mép dưới — pill trắng, số xanh */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.75 }}
        className="relative z-20 max-w-6xl mx-auto px-6 md:px-12 -mt-2 pb-10"
      >
        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(20,83,45,0.12)] border border-black/5 px-6 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-y-6 md:divide-x md:divide-black/10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center px-4">
              <span className="text-2xl md:text-3xl font-bold text-brand block leading-none mb-1.5">
                {s.value}
              </span>
              <span className="text-2xs md:text-xs font-semibold uppercase tracking-[0.08em] text-brand/55">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
