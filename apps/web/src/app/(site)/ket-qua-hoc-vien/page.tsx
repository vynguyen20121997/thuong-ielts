import type { Metadata } from "next";

import Testimonials from "../../../components/Testimonials";
import { listTestimonials } from "../../../server/content";

export const metadata: Metadata = {
  title: "Kết quả học viên | HNT.IELTS - Hồ Ngọc Thương",
};

/*
  Lấy dữ liệu ở SERVER, không để component tự fetch sau khi mount.

  Trước đây trang này commit ngay rồi mới gọi `/api/testimonials`, nên thứ tự là:
  khung rỗng hiện ra → hiệu ứng vào trang chạy trên cái khung rỗng đó → dữ liệu
  về → nội dung nhảy vào giữa chừng. Người dùng thấy đúng một cú giật.

  Để trang `async` thì Next giữ nguyên trang CŨ cho tới khi truy vấn xong mới
  commit. Không còn khung rỗng nào, và hiệu ứng vào trang chạy đúng một lần trên
  nội dung thật.

  Lớp phủ "Đang mở trang…" lo phần chờ này — nó tan ngay lúc route commit
  (`holdMs={0}` trong `NavigationBusy`), nên KHÔNG đè lên hiệu ứng vào trang.
*/
export default async function StudentResultsPage() {
  const testimonials = await listTestimonials();

  return (
    <main className="relative z-10">
      <Testimonials variant="full" initialItems={testimonials} />
    </main>
  );
}
