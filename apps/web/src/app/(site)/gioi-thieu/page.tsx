import type { Metadata } from "next";
import About from "../../../components/About";

export const metadata: Metadata = {
  title: "Về giáo viên | Thương Hồ's Class",
};

export default function AboutPage() {
  return (
    <main className="relative z-10 pt-20">
      <About />
    </main>
  );
}
