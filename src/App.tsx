/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import StudentResultsPage from "./pages/StudentResultsPage";
import StudentFeedbackPage from "./pages/StudentFeedbackPage";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

function AppShell() {
  const lenisRef = useRef<Lenis | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroll (persists across route changes)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      infinite: false,
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
  }, [location.pathname]);

  // Smooth scroll to a section on the homepage. If we are on another route,
  // navigate home first and let HomePage resolve the pending scroll target.
  const handleScrollToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
      return;
    }

    if (sectionId === "hero") {
      lenisRef.current?.scrollTo(0, { duration: 1.5 });
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      const navbarHeight = document.getElementById("header-nav")?.offsetHeight || 80;
      lenisRef.current?.scrollTo(target, {
        offset: -navbarHeight,
        duration: 1.6,
        immediate: false,
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1A1A1A] antialiased selection:bg-green-600/20 selection:text-green-950">
      {/* Immersive Editorial Border Frame */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-white/60 z-40" />

      {/* Modern Sticky Navigation */}
      <Header onScrollTo={handleScrollToSection} />

      <Routes>
        <Route path="/" element={<HomePage onScrollTo={handleScrollToSection} />} />
        <Route path="/ket-qua-hoc-vien" element={<StudentResultsPage />} />
        <Route path="/cam-nhan-hoc-vien" element={<StudentFeedbackPage />} />
      </Routes>

      {/* Footer block */}
      <Footer onScrollTo={handleScrollToSection} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
