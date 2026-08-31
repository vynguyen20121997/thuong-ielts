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

  // Trang chủ cuộn theo section (kiểu fullpage): mỗi cú lăn chuột đi đúng một
  // section thay vì cuộn tự do. Phải chặn wheel ở capture phase TRƯỚC khi Lenis
  // nhận event, rồi tự ra lệnh lenis.scrollTo. Chỉ áp cho desktop — mobile giữ
  // cuộn chạm tự nhiên. Section cao hơn màn hình thì lật từng trang bên trong
  // trước khi nhảy sang section kế, kẻo nội dung giữa chừng không xem được.
  useEffect(() => {
    if (pathname !== "/") return;
    let animating = false;

    const insideFixedOverlay = (el: EventTarget | null): boolean => {
      // Lightbox/modal (position: fixed) thì trả quyền cuộn tự do
      let node = el instanceof Element ? el : null;
      while (node && node !== document.body) {
        if (getComputedStyle(node).position === "fixed") return true;
        node = node.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      const lenis = lenisRef.current;
      if (!lenis || window.innerWidth < 768) return;
      if (insideFixedOverlay(e.target)) return;

      e.preventDefault();
      e.stopPropagation();
      if (animating || Math.abs(e.deltaY) < 4) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const secs = Array.from(
        document.querySelectorAll<HTMLElement>("main section[id], footer"),
      );
      if (secs.length === 0) return;
      const tops = secs.map((s) => Math.round(s.getBoundingClientRect().top + y));
      const maxScroll = document.documentElement.scrollHeight - vh;

      let idx = 0;
      for (let i = 0; i < tops.length; i++) if (tops[i] <= y + 2) idx = i;
      const bottom = tops[idx] + secs[idx].offsetHeight;

      let target: number;
      if (dir > 0) {
        if (bottom - (y + vh) > 40) {
          // Section dài: lật thêm một trang bên trong
          target = Math.min(y + vh * 0.85, bottom - vh);
        } else if (idx + 1 < tops.length) {
          target = tops[idx + 1];
        } else {
          target = maxScroll;
        }
      } else {
        if (y - tops[idx] > 40) {
          // Đang ở giữa section dài: lật ngược một trang, dừng ở đầu section
          target = Math.max(y - vh * 0.85, tops[idx]);
        } else if (idx > 0) {
          const prevBottom = tops[idx - 1] + secs[idx - 1].offsetHeight;
          // Về section trước: nếu nó dài hơn màn hình thì vào từ cuối
          target = Math.max(tops[idx - 1], prevBottom - vh);
        } else {
          target = 0;
        }
      }
      target = Math.max(0, Math.min(target, maxScroll));
      if (Math.abs(target - y) < 2) return;

      animating = true;
      lenis.scrollTo(target, {
        duration: 1.05,
        lock: true,
        onComplete: () => {
          setTimeout(() => {
            animating = false;
          }, 150);
        },
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
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
