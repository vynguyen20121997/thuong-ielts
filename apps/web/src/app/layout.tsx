import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Literata } from "next/font/google";
import "./globals.css";

/**
 * Ba vai chữ, mỗi vai một việc:
 *
 * - **Literata** (serif) cho tiêu đề. Google vẽ nó để đọc sách điện tử, có trục
 *   optical size nên cỡ lớn nét thanh mảnh, cỡ nhỏ nét dày lên cho dễ đọc —
 *   hợp với thứ mình đang bán: đề Cambridge và chữ nghĩa.
 * - **Be Vietnam Pro** cho thân bài và giao diện. Vẽ riêng cho tiếng Việt, nên
 *   dấu không đè lên chữ và không bị lệch như các font Latin gắn dấu vào sau.
 * - **JetBrains Mono** chỉ còn cho *số liệu*: đồng hồ, số câu, slug. Trước đây
 *   nó gánh cả nhãn giao diện, và đó là thứ làm trang trông như máy sinh ra.
 *
 * Nạp qua `next/font` chứ không `@import` Google Fonts trong CSS: file tự host,
 * không chặn render, không phụ thuộc mạng bên thứ ba khi khách vào trang.
 */

// Không liệt kê `weight`: Literata là font biến thiên, khai `axes` thì phải để
// nguyên dải trọng lượng — next/font báo lỗi build nếu ghim cứng vài mức.
const display = Literata({
  subsets: ["latin", "latin-ext", "vietnamese"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});

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
    <html lang="vi" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
