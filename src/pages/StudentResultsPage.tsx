import { useEffect } from "react";
import Testimonials from "../components/Testimonials";

export default function StudentResultsPage() {
  useEffect(() => {
    document.title = "Kết quả học viên | HNT.IELTS - Hồ Ngọc Thương";
  }, []);

  return (
    <main className="relative z-10">
      <Testimonials variant="full" />
    </main>
  );
}
