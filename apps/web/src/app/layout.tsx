import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HNT.IELTS - Hồ Ngọc Thương | Luyện Thi IELTS Logic",
  description:
    "Chuyên gia luyện thi IELTS và phát triển tư duy biện chứng. Chương trình luyện thi IELTS chất lượng cao, giúp học viên Việt Nam chinh phục IELTS bền vững và thực tế.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
