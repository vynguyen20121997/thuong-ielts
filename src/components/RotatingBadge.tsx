"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";

interface RotatingBadgeProps {
  onClick: () => void;
}

export default function RotatingBadge({ onClick }: RotatingBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Continuous rotation using GSAP
    const rotation = gsap.to(badgeRef.current, {
      rotation: 360,
      duration: 12,
      ease: "none",
      repeat: -1,
    });

    // Pause on hover
    const badgeEl = badgeRef.current;
    const handleMouseEnter = () => {
      gsap.to(rotation, { timeScale: 0.15, duration: 0.5 });
    };
    const handleMouseLeave = () => {
      gsap.to(rotation, { timeScale: 1, duration: 0.5 });
    };

    if (badgeEl) {
      badgeEl.addEventListener("mouseenter", handleMouseEnter);
      badgeEl.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      rotation.kill();
      if (badgeEl) {
        badgeEl.removeEventListener("mouseenter", handleMouseEnter);
        badgeEl.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div 
      onClick={onClick}
      className="relative w-36 h-36 flex items-center justify-center cursor-pointer group active:scale-95 transition-all duration-300 select-none z-20"
      id="rotating-badge-wrapper"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all duration-300 pointer-events-none" />

      {/* Spinning Outer Ring Text */}
      <div ref={badgeRef} className="absolute inset-0 w-full h-full">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <path
              id="textPath"
              d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
              fill="none"
            />
          </defs>
          <text className="font-mono text-[6px] tracking-[0.24em] fill-white/60 group-hover:fill-green-500 uppercase transition-colors duration-300">
            <textPath href="#textPath" startOffset="0%">
              HNT.IELTS • TU DUY LOGIC • SINCE 2018 • EXCELLENCE •
            </textPath>
          </text>
        </svg>
      </div>

      {/* Center Static Circle with Hover Interaction */}
      <div className="relative w-16 h-16 bg-white/10 hover:bg-green-600 border border-white/10 hover:border-green-500 text-white hover:text-black rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 z-10">
        <ArrowUpRight size={22} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        <span className="font-mono text-[7px] font-bold tracking-wider mt-0.5 uppercase">
          Liên Hệ
        </span>
      </div>
    </div>
  );
}
