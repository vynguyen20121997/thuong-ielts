import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";

import Hero from "../components/Hero";
import About from "../components/About";
import Stats from "../components/Stats";
import Services from "../components/Services";
import Testimonials from "../components/Testimonials";
import Feedback from "../components/Feedback";
import Contact from "../components/Contact";

interface HomePageProps {
  onScrollTo: (sectionId: string) => void;
}

export default function HomePage({ onScrollTo }: HomePageProps) {
  const location = useLocation();

  // Reveal-on-scroll for elements flagged with .reveal-up
  useEffect(() => {
    const ctx = gsap.context(() => {
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
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  // If we arrived here with a pending scroll target (from another route), resolve it.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (target) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => onScrollTo(target));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <main className="relative z-10">
      <Hero onScrollTo={onScrollTo} />

      <div id="about-container" className="reveal-up">
        <About />
      </div>

      <div id="stats-container">
        <Stats />
      </div>

      <div id="testimonials-container">
        <Testimonials variant="preview" />
      </div>

      <div id="feedback-container">
        <Feedback variant="preview" />
      </div>

      <div id="courses-container" className="reveal-up">
        <Services />
      </div>

      <div id="contact-container" className="reveal-up">
        <Contact />
      </div>
    </main>
  );
}
