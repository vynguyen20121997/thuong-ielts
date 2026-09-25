import type { Metadata } from "next";
import Services from "../../../components/Services";

export const metadata: Metadata = {
  title: "Khóa học | HNT.IELTS - Hồ Ngọc Thương",
};

export default function CoursesPage() {
  return (
    <main className="relative z-10">
      {/*
        `h1` chỉ screen reader đọc. Trang này dùng lại khối `Services` của trang
        chủ, mà ở đó nó là một mục cấp hai nằm dưới `h1` của Hero — đứng riêng
        thành một trang thì cả trang không còn heading cấp một nào, người dùng
        nhảy theo heading không biết mình đang ở đâu. Giao diện không đổi.
      */}
      <h1 className="sr-only">Khóa học IELTS của cô Hồ Ngọc Thương</h1>
      <Services />
    </main>
  );
}
