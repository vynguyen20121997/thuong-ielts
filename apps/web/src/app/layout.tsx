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

/**
 * Khoá cuộn cho màn chờ, chạy ngay lúc trình duyệt đọc tới thẻ này.
 *
 * Không đặt trong `useEffect` của `LoadingScreen` được: effect chỉ chạy sau khi
 * React hydrate, mà đo trên Slow 3G thì đúng giai đoạn màn chờ đang che là giai
 * đoạn React chưa kịp sống. Khoá muộn bằng không khoá: khách vẫn lăn chuột kéo
 * được trang đi mất đằng sau lớp mờ, xong màn chờ thì đã ở giữa trang.
 *
 * `setTimeout` ở đây là lối thoát, phải khớp với con số của animation `.site-loader`
 * trong `globals.css` (8s): hai thứ phải nhả cùng lúc, nếu không sẽ có lúc lớp mờ đã
 * tan mà trang vẫn không cuộn được — trông hệt như trang bị treo. Đổi một bên thì
 * đổi nốt bên kia. Đường bình thường không chớ tới đây: `LoadingScreen` nhả khoá
 * ngay khi `PageReady` báo xong.
 */
const LOCK_SCROLL = `(function(){var d=document.documentElement;d.classList.add('site-loading');setTimeout(function(){d.classList.remove('site-loading')},8000)})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${mono.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: LOCK_SCROLL }} />
        {children}
      </body>
    </html>
  );
}
