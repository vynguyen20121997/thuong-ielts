import { useEffect } from "react";

import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials";
import Feedback from "../components/Feedback";

export default function HomePage() {
  useEffect(() => {
    document.title = "HNT.IELTS - Hồ Ngọc Thương | Luyện Thi IELTS Logic";
  }, []);

  return (
    <main className="relative z-10">
      <Hero />

      <div id="testimonials-container">
        <Testimonials variant="preview" />
      </div>

      <div id="feedback-container">
        <Feedback variant="preview" />
      </div>
    </main>
  );
}
