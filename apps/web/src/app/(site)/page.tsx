import Hero from "../../components/Hero";
import Testimonials from "../../components/Testimonials";
import Feedback from "../../components/Feedback";
import TeachingMethod from "../../components/TeachingMethod";
import TeachingTools from "../../components/TeachingTools";

export default function HomePage() {
  return (
    <main className="relative z-10">
      <Hero />

      <div id="testimonials-container">
        <Testimonials variant="preview" />
      </div>

      <div id="feedback-container">
        <Feedback variant="preview" />
      </div>

      <TeachingMethod />

      {/* Hệ thống & công cụ giảng dạy — bộ đề luyện tập (Kiểm Tra Kiến Thức)
          là một thẻ công cụ bên trong lưới này, không còn là khối riêng. */}
      <div id="tools-container">
        <TeachingTools />
      </div>
    </main>
  );
}
