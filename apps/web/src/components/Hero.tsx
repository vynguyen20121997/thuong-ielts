"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
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

// Hồ sơ năng lực — gạch đầu dòng theo sheet portfolio (khối "Requisitos" của poster)
const CREDENTIALS = [
  "IELTS Overall 8.5 — 3 lần thi",
  "Reading & Listening 9.0 — 3 lần",
  "Writing 8.5 (2026) · Speaking 8.5 (2021)",
  "Chứng chỉ CELTA — Đại học Cambridge",
  "6 năm kinh nghiệm luyện thi IELTS",
] as const;

const STATS = [
  { value: "8.5", label: "Overall Band (×3)" },
  { value: "9.0", label: "Reading & Listening (×3)" },
  { value: "8.5", label: "Writing · 2026" },
  { value: "8.5", label: "Speaking · 2021" },
] as const;

export default function Hero() {
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);

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

  return (
    <section
      id="hero"
      className="relative pt-24 md:pt-28 overflow-hidden bg-gradient-to-br from-[#F3F4EF] via-[#FAF7F4] to-[#F6EFEC]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-end">
          {/* Cột chữ: headline → pill → hồ sơ năng lực → CTA (bố cục poster) */}
          <div className="text-left pb-6 md:pb-14 order-1">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-[#00210D]">{hero.titleLine1}. </span>
              <span className="text-[#3E8E58]">{hero.titleLine2}.</span>
            </h1>

            {/* Pill tag như "Secretário" của poster — nền xanh sáng cho nhẹ mắt */}
            <span className="inline-flex items-center px-6 py-2.5 bg-[#9FE870] text-[#00230E] rounded-full text-sm font-bold mb-6">
              IELTS 8.5 Overall (×3) · CELTA Cambridge
            </span>

            <p className="text-[#00230E]/75 text-sm md:text-base leading-relaxed mb-7 max-w-lg">
              {hero.quote}
            </p>

            {/* Hồ sơ năng lực — như khối "Requisitos" */}
            <h2 className="text-xl md:text-2xl font-bold text-[#3E8E58] mb-3">Hồ sơ năng lực</h2>
            <ul className="space-y-2 mb-8">
              {CREDENTIALS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2.5 text-sm md:text-base text-[#00230E]/80"
                >
                  <Check size={16} className="text-[#3E8E58] mt-1 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>

            <Link
              href="/thanh-tich"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#2E7D42] hover:text-[#00230E] transition-colors mb-6"
            >
              Xem toàn bộ bằng cấp
              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#testimonials"
                className="px-8 py-4 bg-[#9FE870] hover:bg-white text-[#00230E] font-bold text-sm rounded-full transition-all duration-300 shadow-[0_6px_20px_rgba(159,232,112,0.45)] hover:shadow-lg cursor-pointer"
              >
                Xem Thành Tích Học Viên
              </a>
              <a
                href="#phuong-phap"
                className="px-8 py-4 bg-[#E4EDDE] hover:bg-white text-[#00230E] font-bold text-sm rounded-full transition-all duration-300 hover:shadow-lg cursor-pointer"
              >
                Khám Phá Phương Pháp Giảng Dạy
              </a>
            </div>
          </div>

          {/* Chân dung zoom lớn tràn khỏi VIÊN NANG xanh phía sau (đúng hình khối poster) */}
          <div className="relative h-[460px] sm:h-[560px] md:h-[640px] order-2">
            {/* Viên nang bo tròn hẳn đầu trên, hẹp hơn người — người tràn ra hai bên và lên trên.
                Màu xanh sáng #9FE870 đồng bộ với nút "Xem Thành Tích Học Viên". */}
            <div className="absolute left-[14%] right-[14%] top-[13%] bottom-0 rounded-t-[999px] bg-[#9FE870]" />
            <img
              src={hero.portraitUrl}
              alt="Cô Hồ Ngọc Thương"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[95%] w-auto max-w-none object-contain object-bottom select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Thanh điểm số sáng đè mép dưới — pill trắng, số xanh */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 md:px-12 -mt-2 pb-10">
        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,35,14,0.12)] border border-black/5 px-6 py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-y-6 md:divide-x md:divide-black/10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center px-4">
              <span className="text-2xl md:text-3xl font-bold text-[#2E7D42] block leading-none mb-1.5">
                {s.value}
              </span>
              <span className="text-2xs md:text-xs font-semibold uppercase tracking-[0.08em] text-[#00230E]/55">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
