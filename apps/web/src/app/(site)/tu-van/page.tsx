import type { Metadata } from "next";
import Contact from "../../../components/Contact";

export const metadata: Metadata = {
  title: "Liên hệ | HNT.IELTS - Hồ Ngọc Thương",
};

export default function ContactPage() {
  return (
    <main className="relative z-10">
      {/*
        `h1` chỉ screen reader đọc. Trang này dùng lại khối `Contact` của trang
        chủ, mà ở đó nó là một mục cấp hai nằm dưới `h1` của Hero — đứng riêng
        thành một trang thì cả trang không còn heading cấp một nào, người dùng
        nhảy theo heading không biết mình đang ở đâu. Giao diện không đổi.
      */}
      <h1 className="sr-only">Liên hệ và đăng ký tư vấn</h1>
      <Contact />
    </main>
  );
}
