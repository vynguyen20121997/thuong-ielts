import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin | HNT.IELTS",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] antialiased">
        {children}
      </body>
    </html>
  );
}
