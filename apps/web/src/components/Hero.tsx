"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import NavigationButtonLabel from "./NavigationButtonLabel";
import CountUp from "./CountUp";
import PageArch from "./PageArch";
import { usePageReady, useHoldPageReady } from "./PageReady";
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
  titleLine1: "HỒ NGỌC THƯƠNG",
  titleLine2: "Giáo viên IELTS",
  quote:
    "Giúp học viên tiến bộ thông qua lộ trình có hệ thống, nhận xét chi tiết và phương pháp học tập phù hợp.",
  bio: "IELTS Overall 8.5 (3 lần thi), Reading & Listening 9.0 (3 lần), Writing 8.5 (2026), Speaking 8.5 (2021). Chứng chỉ giảng dạy CELTA do Đại học Cambridge cấp và 6 năm kinh nghiệm luyện thi IELTS.",
  closingLine:
    "Theo đuổi IELTS vì đam mê, và sau khi chạm mốc 8.5 Overall thì chọn con đường giảng dạy để giúp người khác đi nhanh hơn con đường mình từng đi.",
};

// Ba con số muốn nổi ngay cạnh chân dung — khác STATS ở dưới: đây là phần
// highlight, STATS là dải điểm số đầy đủ đè mép dưới hero.
const HERO_HIGHLIGHTS = [
  { value: "8.5", label: "OVERALL" },
  { value: "9.0", label: "Reading & Listening" },
  { value: "8.5", label: "Writing" },
] as const;

const IMPACT_STATS = [
  { value: "6", suffix: "năm", label: "Kinh nghiệm giảng dạy" },
  { value: "120", suffix: "+", label: "Lớp đã giảng dạy" },
  { value: "1200", suffix: "+", label: "Học viên" },
  { value: "110", suffix: "+", label: "Học viên đạt mục tiêu" },
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

const headlineReveal: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13, delayChildren: 0.04 },
  },
};

const headlineLine: Variants = {
  hidden: { opacity: 0, y: "115%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  },
};

const underlineReveal: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

const buttonGroup: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1], delay: 0.08 },
  },
};

const quoteReveal: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)", color: "rgba(31, 41, 55, 0.18)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    color: "rgba(31, 41, 55, 0.65)",
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  // Hero là màn đầu: nội dung của nó phải có TRƯỚC khi khách nhìn thấy trang,
  // nếu không chữ tiêu đề đổi ngay trước mắt. Giữ màn chờ lại cho tới khi
  // `/api/hero` xong — kể cả khi hỏng, vì lúc đó ta dùng `DEFAULT_HERO`.
  const [heroSettled, setHeroSettled] = useState(false);
  useHoldPageReady(!heroSettled);

  const ready = usePageReady();
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
      .catch((err) => console.error("Failed to load hero content:", err))
      .finally(() => setHeroSettled(true));
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
      className="relative pt-24 md:pt-20 overflow-hidden bg-white"
    >
      <PageArch />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-end">
          {/* Cột chữ: container stagger, từng khối bật vào bằng spring.
              `self-center` để khối chữ ngang tầm chân dung — lưới vẫn giữ
              `items-end` cho cột ảnh dính đáy, nếu để chữ theo đáy luôn thì nó
              bị tuột xuống ngang chân hình. */}
          <motion.div
            variants={textContainer}
            initial={reduce ? false : "hidden"}
            animate={ready ? "visible" : "hidden"}
            className="text-left pb-6 md:pb-0 md:self-center order-1"
          >
            <motion.h1
              variants={headlineReveal}
              className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.1] mb-5"
            >
              <span className="-mt-[0.18em] block overflow-hidden pt-[0.18em] pb-[0.08em]">
                <motion.span variants={headlineLine} className="block text-brand">
                  {hero.titleLine1}
                </motion.span>
              </span>
              {/* Dòng 2 gạch chân bằng border của chính span: vệt kẻ luôn dài
                  đúng bằng chữ, không phải canh tay một khối trang trí rời. */}
              <span className="mt-2 block overflow-hidden pb-[0.18em]">
                <motion.span variants={headlineLine} className="block text-brand-soft">
                  {hero.titleLine2.replace(/\.$/, "")}
                </motion.span>
                <motion.span
                  aria-hidden="true"
                  variants={underlineReveal}
                  style={{ transformOrigin: "left center" }}
                  className="mt-1 block h-1 w-full max-w-[490px] rounded-full bg-leaf"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={quoteReveal}
              className="max-w-[35rem] text-pretty text-[15px] leading-[1.65] md:text-[17px] mb-7"
            >
              {hero.quote}
            </motion.p>

            <motion.div variants={buttonGroup} className="flex flex-wrap items-center gap-4">
              <motion.a
                href="#testimonials"
                whileHover={reduce ? undefined : { y: -3, scale: 1.015 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="hero-cta group inline-flex items-center gap-2 px-8 py-4 bg-brand text-white font-bold text-sm rounded-full shadow-md cursor-pointer"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <NavigationButtonLabel>Xem Thành Tích Học Viên</NavigationButtonLabel>
                  <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1.5" />
                </span>
              </motion.a>
              <motion.a
                href="#phuong-phap"
                whileHover={reduce ? undefined : { y: -3, scale: 1.015 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="hero-cta hero-cta-secondary group inline-flex items-center gap-2 border-2 border-brand bg-white px-8 py-[14px] text-brand font-bold text-sm rounded-full shadow-none cursor-pointer"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <NavigationButtonLabel>Khám Phá Phương Pháp Giảng Dạy</NavigationButtonLabel>
                  <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1.5" />
                </span>
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Chân dung zoom lớn tràn khỏi VÒNG TRÒN xanh phía sau (hình khối poster) */}
          {/* Chiều cao cột chân dung co theo màn hình: trên laptop thấp
              (~800px) khối 640px cố định đẩy dải chỉ số rơi khỏi khung nhìn.
              `svh` chứ không phải `vh` để thanh địa chỉ mobile không làm nhảy. */}
          <div className="relative h-[460px] sm:h-[560px] md:h-[clamp(460px,calc(100svh-230px),640px)] order-2">
            {/* Tấm nền xanh sau lưng, mọc lên từ đáy bằng spring. Hình khối lấy
                hình BẦU DỤC: `rounded-full` trên khung hẹp ngang hơn cao (rộng
                88% cột) — cùng utility đó trên khung vuông sẽ ra hình tròn.
                Đỉnh oval (`top-1`) là mức cao nhất còn được: header `fixed` cao
                đúng 80px và `pt-20` của section đặt cột ngay sát dưới nó, nên
                chỉ còn 4px hở — cao hơn nữa là chui vào header. Mép dưới ăn vào
                dải chỉ số. */}
            <motion.div
              initial={reduce ? false : { scaleY: 0 }}
              animate={ready ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.1 }}
              style={{ transformOrigin: "bottom center" }}
              className="absolute -bottom-10 left-1/2 top-1 w-[88%] -translate-x-1/2"
            >
              {/* Một mảnh duy nhất, không còn lớp lệch phía sau — đúng kiểu tấm
                  nền phẳng của mẫu poster. */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sage-3 to-leaf/55" />
            </motion.div>
            {/* Ba con số neo mép phải, chồng lên phần trống bên phải vòng xanh
                — không lấy bề ngang của cột nên hai vòng giữ nguyên dáng */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 16 }}
              animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.55 }}
              className="absolute right-0 md:-right-6 top-1/2 z-10 hidden w-[142px] -translate-y-1/2 flex-col gap-3 md:flex"
            >
              {HERO_HIGHLIGHTS.map((h) => (
                <div
                  key={h.label}
                  className="flex flex-col items-center gap-1 rounded-[18px] border border-brand/8 bg-white px-3 py-3 text-center shadow-[0_12px_30px_rgba(20,83,45,0.12)]"
                >
                  <span className="text-[34px] font-bold leading-none tracking-tight text-brand-soft">
                    {h.value}
                  </span>
                  <span className="text-xs font-semibold leading-snug text-ink/55">
                    {h.label}
                  </span>
                </div>
              ))}
            </motion.div>
            {/* Wrapper giữ căn giữa bằng Tailwind; clip-path chạy trên khối
                bọc nên ảnh và bóng sticker lộ ra cùng một nhịp — trước đây chỉ
                ảnh chính trượt lên còn bóng đứng yên, nên lúc đang chạy nhìn
                thành hai hình lệch nhau. */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[85%] w-auto md:h-full md:w-[108%] max-w-none pointer-events-none">
              <motion.div
                initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
                animate={
                  ready
                    ? { clipPath: "inset(0% 0% 0% 0%)" }
                    : { clipPath: "inset(100% 0% 0% 0%)" }
                }
                transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ x: parallaxX }}
                className="relative h-full w-auto md:h-full md:w-full"
              >
                <img
                  src={hero.portraitUrl}
                  alt="Cô Hồ Ngọc Thương"
                  className="relative h-full w-auto md:h-full md:w-full max-w-none object-contain object-bottom select-none"
                />
                {/* Bóng silhouette lệch kiểu sticker (như mẫu): chính ảnh đó,
                    brightness(0)+invert(1) thành mảng trắng phẳng, đẩy lệch phải */}
                <img
                  aria-hidden="true"
                  src={hero.portraitUrl}
                  alt=""
                  className="absolute inset-0 h-full w-auto md:h-full md:w-full max-w-none object-contain object-bottom select-none -z-10 translate-x-7 [filter:brightness(0)invert(1)] opacity-70"
                />
              </motion.div>
            </div>
          </div>

          {/* Rail số dưới md: một hàng ba thẻ, nằm sau chân dung trong lưới */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
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
                <span className="text-2xs font-semibold leading-snug text-ink/55">
                  {h.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Dải chỉ số dùng cùng kiểu đếm tăng dần như Câu chuyện học viên. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.75 }}
        className="relative z-20 max-w-6xl mx-auto px-6 md:px-12 -mt-2 pb-10 md:pb-6"
      >
        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(20,83,45,0.12)] border border-black/5 px-6 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-y-6 md:divide-x md:divide-black/10">
          {IMPACT_STATS.map((s) => (
            <div key={s.label} className="text-center px-4">
              <span className="mb-1.5 block text-2xl font-bold leading-none text-[#15803D] md:text-3xl">
                <CountUp
                  value={Number(s.value)}
                  duration={2}
                  delay={0.9}
                />
                <span className={`ml-1 font-semibold tracking-normal ${s.suffix === "+" ? "text-[0.92em]" : "text-[0.68em]"}`}>
                  {s.suffix}
                </span>
              </span>
              <span className="text-2xs md:text-xs font-semibold uppercase tracking-[0.08em] text-black/60">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
