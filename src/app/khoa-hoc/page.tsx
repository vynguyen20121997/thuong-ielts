import type { Metadata } from "next";
import Services from "../../components/Services";

export const metadata: Metadata = {
  title: "Khóa học | HNT.IELTS - Hồ Ngọc Thương",
};

export default function CoursesPage() {
  return (
    <main className="relative z-10 pt-20">
      <Services />
    </main>
  );
}
