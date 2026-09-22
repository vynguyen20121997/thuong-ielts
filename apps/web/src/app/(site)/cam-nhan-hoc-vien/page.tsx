import type { Metadata } from "next";

import Feedback from "../../../components/Feedback";
import { listFeedbacks } from "../../../server/content";

export const metadata: Metadata = {
  title: "Cảm nhận học viên | HNT.IELTS - Hồ Ngọc Thương",
};

/* Lấy dữ liệu ở server — lý do đầy đủ ghi ở `ket-qua-hoc-vien/page.tsx`. */
export default async function StudentFeedbackPage() {
  const feedbacks = await listFeedbacks();

  return (
    <main className="relative z-10">
      <Feedback variant="full" initialItems={feedbacks} />
    </main>
  );
}
