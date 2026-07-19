import type { Metadata } from "next";
import Contact from "../../components/Contact";

export const metadata: Metadata = {
  title: "Liên hệ | HNT.IELTS - Hồ Ngọc Thương",
};

export default function ContactPage() {
  return (
    <main className="relative z-10 pt-20">
      <Contact />
    </main>
  );
}
