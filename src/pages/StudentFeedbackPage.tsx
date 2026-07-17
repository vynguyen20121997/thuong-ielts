import { useEffect } from "react";
import Feedback from "../components/Feedback";

export default function StudentFeedbackPage() {
  useEffect(() => {
    document.title = "Cảm nhận học viên | HNT.IELTS - Hồ Ngọc Thương";
  }, []);

  return (
    <main className="relative z-10">
      <Feedback variant="full" />
    </main>
  );
}
