import { useEffect } from "react";
import About from "../components/About";

export default function AboutPage() {
  useEffect(() => {
    document.title = "Giới thiệu | HNT.IELTS - Hồ Ngọc Thương";
  }, []);

  return (
    <main className="relative z-10 pt-20">
      <About />
    </main>
  );
}
