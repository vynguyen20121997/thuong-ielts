import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Cùng hai họ chữ với trang chính (`apps/web`) — admin là cùng một sản phẩm,
 * đừng để nó nói một giọng chữ khác.
 *
 * Trước đây admin `@import` Google Fonts thẳng trong CSS: chặn render, phụ
 * thuộc mạng bên thứ ba, và nạp ba họ chữ trong đó hai họ không ai dùng đúng.
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
  title: "Admin | HNT.IELTS",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] antialiased">
        {children}
      </body>
    </html>
  );
}
