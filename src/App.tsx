/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Stats from "./components/Stats";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential smoothing
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    // 2. Synchronize Lenis scroll triggers with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 3. Connect GSAP ticker with Lenis frame loop
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000); // converting seconds to milliseconds
    };
    gsap.ticker.add(updateTicker);

    // Lag smoothing prevents jumping during heavy rendering frames
    gsap.ticker.lagSmoothing(0);

    // 4. Reveal-on-scroll trigger animation setup
    const revealElements = document.querySelectorAll(".reveal-up");
    revealElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 55 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%", // starts when element top is 85% from viewport top
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Smooth scroll to a target section
  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === "hero") {
      lenisRef.current?.scrollTo(0, {
        duration: 1.5,
      });
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      // Calculate scroll offset based on sticky navbar height
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

      {/* Main Sections */}
      <main className="relative z-10">
        <Hero onScrollTo={handleScrollToSection} />
        
        <div id="about-container" className="reveal-up">
          <About />
        </div>

        <div id="stats-container">
          <Stats />
        </div>

        <div id="testimonials-container">
          <Testimonials />
        </div>

        <div id="courses-container" className="reveal-up">
          <Services />
        </div>

        <div id="contact-container" className="reveal-up">
          <Contact />
        </div>
      </main>

      {/* Footer block */}
      <Footer onScrollTo={handleScrollToSection} />
    </div>
  );
}

