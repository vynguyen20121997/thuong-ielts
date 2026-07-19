import type { Metadata } from "next";
import About from "../../components/About";

export const metadata: Metadata = {
  title: "Giới thiệu | HNT.IELTS - Hồ Ngọc Thương",
};

export default function AboutPage() {
  return (
    <main className="relative z-10 pt-20">
      <About />
    </main>
  );
}
