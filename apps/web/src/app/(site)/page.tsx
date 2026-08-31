import Hero from "../../components/Hero";
import Testimonials from "../../components/Testimonials";
import Feedback from "../../components/Feedback";
import TeachingMethod from "../../components/TeachingMethod";
import TeachingTools from "../../components/TeachingTools";
import ContactCTA from "../../components/ContactCTA";

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* Thứ tự theo bản Figma: hero → phương pháp → vinh danh → cảm nhận → công cụ */}
      <Hero />

      <TeachingMethod />

      <div id="testimonials-container">
        <Testimonials variant="preview" />
      </div>

      <div id="feedback-container">
        <Feedback variant="preview" />
      </div>

      {/* Hệ thống & công cụ giảng dạy — bộ đề luyện tập (Kiểm Tra Kiến Thức)
          là một thẻ công cụ bên trong lưới này, không còn là khối riêng. */}
      <div id="tools-container">
        <TeachingTools />
      </div>

      <ContactCTA />
    </main>
  );
}
