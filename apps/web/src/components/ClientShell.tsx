"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Header from "./Header";
import Footer from "./Footer";

gsap.registerPlugin(ScrollTrigger);

export default function ClientShell({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Lenis Smooth Scroll (persists across route changes)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      infinite: false,
      // Để Lenis tự tiếp quản link neo (#...) — cú nhảy native của trình duyệt
      // đánh nhau với trạng thái cuộn của Lenis và làm trang trôi quá đích.
      anchors: true,
    });

    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // On route change: jump to top and refresh triggers for the new page.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1A1A1A] antialiased selection:bg-green-600/20 selection:text-green-950">
      {/* Immersive Editorial Border Frame */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-white/60 z-40" />

      {/* Modern Sticky Navigation */}
      <Header />

      {children}

      {/* Footer block */}
      <Footer />
    </div>
  );
}
