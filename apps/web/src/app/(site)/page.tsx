import Hero from "../../components/Hero";
import Certificates from "../../components/Certificates";
import Testimonials from "../../components/Testimonials";
import Feedback from "../../components/Feedback";
import TeachingMethod from "../../components/TeachingMethod";
import TeachingTools from "../../components/TeachingTools";
import ContactCTA from "../../components/ContactCTA";

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* Thứ tự theo Google Doc cấu trúc website:
          hero → thành tích → cảm nhận → phương pháp → công cụ → liên hệ */}
      <Hero />

      {/* Học vấn & chứng chỉ ngay dưới hero — chứng thực trước khi vào thành tích học viên */}
      <Certificates />

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

      <ContactCTA />
    </main>
  );
}
