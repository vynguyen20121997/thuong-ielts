"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Send,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import PageArch from "./PageArch";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    currentLevel: "basic",
    targetScore: "6.5",
    message: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.fullname || !formData.phone) {
      return;
    }

    // Simulate API call and animate success
    setFormSubmitted(true);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal columns
      gsap.fromTo(
        ".contact-reveal",
        { opacity: 0, x: -35 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.2,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="contact"
      className="py-28 bg-white relative overflow-hidden border-b border-black/5"
    >
      <PageArch />
      <div className="max-w-7xl mx-auto relative z-10 gutter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Direct Contact Info & Booking Slogan */}
          <div className="lg:col-span-5 contact-reveal text-left">
            <span className="text-xs text-brand block mb-3 font-medium">
              Đồng Hành Cùng Bạn
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight mb-6">
              Bắt Đầu Lộ Trình <br />
              Chinh Phục IELTS <br />
              Ngay Hôm Nay
            </h2>
            <p className="text-ink/70 text-base leading-relaxed mb-10">
              Hãy đặt lịch hẹn tư vấn và đánh giá năng lực tiếng Anh chi tiết
              hoàn toàn miễn phí cùng cô Ngọc Thương. Tôi sẽ trực tiếp hỗ trợ
              phân tích điểm mạnh, điểm yếu và xây dựng sơ đồ lộ trình riêng
              biệt cho bạn.
            </p>

            {/* List Contact Channels */}
            <div className="space-y-6 mb-12" id="contact-channels-list">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0 border border-brand/20">
                  <Phone className="text-brand" size={18} />
                </div>
                <div>
                  <h4 className="text-2xs text-ink/65 mb-0.5 font-medium">
                    Số điện thoại (Zalo)
                  </h4>
                  <a
                    href="https://zalo.me/0783836912"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-sm text-ink hover:text-brand"
                  >
                    0783836912
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0 border border-brand/20">
                  <Mail className="text-brand" size={18} />
                </div>
                <div>
                  <h4 className="text-2xs text-ink/65 mb-0.5 font-medium">
                    Email Hỗ Trợ
                  </h4>
                  <a
                    href="mailto:thuongho1609@gmail.com"
                    className="font-mono font-bold text-sm text-ink hover:text-brand"
                  >
                    thuongho1609@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0 border border-brand/20">
                  <MapPin className="text-brand" size={18} />
                </div>
                <div>
                  <h4 className="text-2xs text-ink/65 mb-0.5 font-medium">
                    Địa Chỉ Lớp Học
                  </h4>
                  <p className="font-mono font-bold text-sm text-ink">
                    Thành phố Hồ Chí Minh
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-6 border-t border-black/10">
              <p className="text-2xs text-ink/65 mb-3 font-medium">
                Kênh Học Tập Cộng Đồng
              </p>
              <div className="flex gap-4 text-xs font-bold text-ink/80">
                <a
                  href="https://www.facebook.com/thuonghoieltsclass/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  Facebook: Thương Hồ&apos;s Class
                </a>
                <span className="text-ink/20">•</span>
                <a
                  href="https://www.threads.com/@thuongho.class?igshid=NTc4MTIwNjQ2YQ=="
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  Threads: thuongho.class
                </a>
                <span className="text-ink/20">•</span>
                <a
                  href="https://zalo.me/g/uzpljg880"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  Group học tập Zalo
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Modern Dynamic Form Box */}
          <div className="lg:col-span-7 contact-reveal">
            <div className="bg-white border border-black/5 rounded-3xl p-8 md:p-12 shadow-[0_15px_35px_rgba(0,0,0,0.06)] relative">
              {!formSubmitted ? (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  id="consultation-form"
                >
                  <div className="text-left mb-6">
                    <h3 className="text-2xl font-bold text-ink mb-2">
                      Đăng Ký Đánh Giá Năng Lực
                    </h3>
                    <p className="text-xs text-ink/65">
                      Nhận lịch hẹn test trình độ miễn phí và tư vấn lộ trình
                      1-kèm-1.
                    </p>
                  </div>

                  {/* Name field */}
                  <div className="text-left">
                    <label
                      htmlFor="fullname"
                      className="block text-xs font-medium text-ink/60 mb-2"
                    >
                      Họ Và Tên Học Viên{" "}
                      <span className="text-brand font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullname"
                      required
                      value={formData.fullname}
                      onChange={(e) =>
                        setFormData({ ...formData, fullname: e.target.value })
                      }
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-brand focus:bg-white transition-all duration-300"
                    />
                  </div>

                  {/* Phone & Email Fields Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-left">
                      <label
                        htmlFor="phone"
                        className="block text-xs font-medium text-ink/60 mb-2"
                      >
                        Số Điện Thoại{" "}
                        <span className="text-brand font-bold">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Số Zalo nhận tài liệu"
                        className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-brand focus:bg-white transition-all duration-300"
                      />
                    </div>

                    <div className="text-left">
                      <label
                        htmlFor="email"
                        className="block text-xs font-medium text-ink/60 mb-2"
                      >
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="Để nhận kết quả bài test"
                        className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-brand focus:bg-white transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Level & Target Dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-left">
                      <label
                        htmlFor="currentLevel"
                        className="block text-xs font-medium text-ink/60 mb-2"
                      >
                        Trình Độ Hiện Tại
                      </label>
                      <select
                        id="currentLevel"
                        value={formData.currentLevel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentLevel: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm text-ink focus:outline-none focus:border-brand transition-all font-sans"
                      >
                        <option value="zero" className="bg-white text-ink">
                          Mất Gốc / Chưa biết gì
                        </option>
                        <option value="basic" className="bg-white text-ink">
                          Đã biết cơ bản
                        </option>
                        <option value="level-4-5" className="bg-white text-ink">
                          Band 4.0 - 5.0 IELTS
                        </option>
                        <option value="level-5-6" className="bg-white text-ink">
                          Band 5.5 - 6.0 IELTS
                        </option>
                      </select>
                    </div>

                    <div className="text-left">
                      <label
                        htmlFor="targetScore"
                        className="block text-xs font-medium text-ink/60 mb-2"
                      >
                        Band Điểm Mục Tiêu
                      </label>
                      <select
                        id="targetScore"
                        value={formData.targetScore}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetScore: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm text-ink focus:outline-none focus:border-brand transition-all font-sans"
                      >
                        <option value="6.0" className="bg-white text-ink">
                          IELTS 6.0
                        </option>
                        <option value="6.5" className="bg-white text-ink">
                          IELTS 6.5 (Tiêu chuẩn)
                        </option>
                        <option value="7.0" className="bg-white text-ink">
                          IELTS 7.0 (Du học)
                        </option>
                        <option value="7.5" className="bg-white text-ink">
                          IELTS 7.5 - 8.0+ (Chuyên sâu)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Message/Note Field */}
                  <div className="text-left">
                    <label
                      htmlFor="message"
                      className="block text-xs font-medium text-ink/60 mb-2"
                    >
                      Mục Tiêu Riêng Biệt & Thắc Mắc (Nếu có)
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Ví dụ: Em muốn thi gấp trong 4 tháng tới, kỹ năng yếu nhất là Đọc..."
                      className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-brand focus:bg-white transition-all duration-300 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-ink hover:bg-leaf text-cream hover:text-brand font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                  >
                    Gửi yêu cầu đăng ký tư vấn
                    <Send size={14} />
                  </button>

                  <p className="text-2xs text-center text-ink/65 font-medium">
                    * Thông tin cá nhân của bạn hoàn toàn bảo mật theo chính
                    sách học viên.
                  </p>
                </form>
              ) : (
                /* Success View Box */
                <div
                  className="py-12 px-4 text-center space-y-6 animate-in fade-in duration-300"
                  id="success-message"
                >
                  <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto text-brand mb-2 border border-brand/20">
                    <CheckCircle2 size={40} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-ink">
                      Đăng Ký Thành Công!
                    </h3>
                    <p className="text-sm text-ink/70 max-w-md mx-auto">
                      Chào mừng <strong>{formData.fullname}</strong> đã bước đầu
                      thiết lập hành trình chinh phục IELTS cùng cô Ngọc Thương.
                    </p>
                  </div>

                  <div className="p-5 bg-black/5 border border-black/10 rounded-2xl text-left max-w-md mx-auto space-y-3">
                    <h4 className="text-xs font-medium text-brand ">
                      Thông tin tóm tắt:
                    </h4>
                    <ul className="text-xs text-ink/80 space-y-1 font-sans font-medium">
                      <li>
                        • Trình độ hiện tại:{" "}
                        <strong>
                          {formData.currentLevel === "zero"
                            ? "Mất gốc"
                            : formData.currentLevel === "basic"
                              ? "Cơ bản"
                              : formData.currentLevel === "level-4-5"
                                ? "IELTS 4.0-5.0"
                                : "IELTS 5.5-6.0"}
                        </strong>
                      </li>
                      <li>
                        • Band điểm mục tiêu:{" "}
                        <strong>{formData.targetScore} IELTS</strong>
                      </li>
                      <li>
                        • Liên hệ Zalo: <strong>{formData.phone}</strong>
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm text-ink/60 max-w-sm mx-auto leading-relaxed">
                    Trợ lý học thuật lớp cô Ngọc Thương sẽ liên hệ qua Zalo hoặc
                    Hotline của bạn trong vòng 12 - 24 giờ tới để gửi bài test
                    thử và chốt thời gian tư vấn 1-kèm-1 trực tiếp cùng giáo
                    viên.
                  </p>

                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({
                        fullname: "",
                        phone: "",
                        email: "",
                        currentLevel: "basic",
                        targetScore: "6.5",
                        message: "",
                      });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black/5 hover:bg-black/10 text-ink border border-black/10 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Đăng ký thêm một buổi nữa
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
