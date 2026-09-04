import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Hai vai chữ, mỗi vai một việc:
 *
 * - **Be Vietnam Pro** cho tất cả: tiêu đề, thân bài, giao diện, và cả thân bài
 *   đọc IELTS. Vẽ riêng cho tiếng Việt, nên dấu không đè lên chữ và không bị
 *   lệch như các font Latin gắn dấu vào sau.
 * - **JetBrains Mono** chỉ cho *số liệu*: đồng hồ, số câu, điểm, slug. Chữ số
 *   đều cột nên đồng hồ đếm ngược không nhảy ngang mỗi lần đổi số. Trước đây nó
 *   gánh cả nhãn giao diện, và đó là thứ làm trang trông như máy sinh ra.
 *
 * Từng có vai thứ ba: **Literata** (serif) cho tiêu đề. Đã gỡ tháng 9/2026 —
 * cả site thống nhất một giọng chữ. Muốn đưa serif trở lại thì nạp font thật ở
 * đây, đừng trỏ `--font-serif` vào một font sans: đã có lần nó trỏ vào Outfit
 * và 66 chỗ ghi `font-serif` vẫn ra sans suốt một thời gian dài mà không ai
 * nhận ra.
 *
 * Nạp qua `next/font` chứ không `@import` Google Fonts trong CSS: file tự host,
 * không chặn render, không phụ thuộc mạng bên thứ ba khi khách vào trang.
 */

const body = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-numeric",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thương Hồ's Class",
  description:
    "Chuyên gia luyện thi IELTS và phát triển tư duy biện chứng. Chương trình luyện thi IELTS chất lượng cao, giúp học viên Việt Nam chinh phục IELTS bền vững và thực tế.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
