import { useEffect } from "react";
import Services from "../components/Services";

export default function CoursesPage() {
  useEffect(() => {
    document.title = "Khóa học | HNT.IELTS - Hồ Ngọc Thương";
  }, []);

  return (
    <main className="relative z-10 pt-20">
      <Services />
    </main>
  );
}
