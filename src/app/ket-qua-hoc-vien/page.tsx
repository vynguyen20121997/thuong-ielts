import type { Metadata } from "next";
import Testimonials from "../../components/Testimonials";

export const metadata: Metadata = {
  title: "Kết quả học viên | HNT.IELTS - Hồ Ngọc Thương",
};

export default function StudentResultsPage() {
  return (
    <main className="relative z-10">
      <Testimonials variant="full" />
    </main>
  );
}
