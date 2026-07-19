import type { Metadata } from "next";
import Feedback from "../../../components/Feedback";

export const metadata: Metadata = {
  title: "Cảm nhận học viên | HNT.IELTS - Hồ Ngọc Thương",
};

export default function StudentFeedbackPage() {
  return (
    <main className="relative z-10">
      <Feedback variant="full" />
    </main>
  );
}
