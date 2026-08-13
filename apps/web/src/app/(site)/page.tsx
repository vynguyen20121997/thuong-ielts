import Hero from "../../components/Hero";
import Testimonials from "../../components/Testimonials";
import Feedback from "../../components/Feedback";
import PracticeSection from "../../features/practice/ui/PracticeSection";

export default function HomePage() {
  return (
    <main className="relative z-10">
      <Hero />

      {/* Practice entry point — sits right under the hero because the hero CTA
          ("Kiểm Tra Kiến Thức IELTS") now points here. */}
      <div id="practice-container">
        <PracticeSection />
      </div>

      <div id="testimonials-container">
        <Testimonials variant="preview" />
      </div>

      <div id="feedback-container">
        <Feedback variant="preview" />
      </div>
    </main>
  );
}
