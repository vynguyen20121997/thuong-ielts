import { useEffect } from "react";
import Contact from "../components/Contact";

export default function ContactPage() {
  useEffect(() => {
    document.title = "Tư vấn | HNT.IELTS - Hồ Ngọc Thương";
  }, []);

  return (
    <main className="relative z-10 pt-20">
      <Contact />
    </main>
  );
}
