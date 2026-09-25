"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/" },
  // Hai mục dạy học đứng trước các mục nội dung marketing: giữa buổi dạy thì
  // đây là thứ cô mở, còn sửa trang chủ thì để lúc rảnh.
  { label: "Giao bài", href: "/lop/giao" },
  { label: "Lớp đang làm", href: "/lop" },
  /*
    "Lớp đang làm" là PHÒNG THI trực tiếp, sống một buổi. "Học viên & học phí"
    là lớp học thật, sống nhiều tháng. Hai nhãn phải khác nhau rõ, vì trong
    code cả hai đều từng gọi là "lớp".
  */
  { label: "Học viên & học phí", href: "/hoc-vien" },
  { label: "Từ vựng", href: "/noi-dung/tu-vung" },
  { label: "Đề Writing", href: "/noi-dung/writing" },
  { label: "Kiểm tra nền", href: "/chan-doan" },
  /*
    Bỏ "Trang chủ (Hero)" khỏi thanh điều hướng theo yêu cầu. Trang
    `/hero` VẪN CÒN và vẫn mở được bằng địa chỉ trực tiếp — chỉ là không
    chiếm chỗ trên thanh nữa, vì đây là thứ sửa vài tháng một lần còn thanh
    này là chỗ cô bấm giữa buổi dạy.
  */
  { label: "Kết quả học viên", href: "/testimonials" },
  { label: "Cảm nhận học viên", href: "/feedbacks" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <span className="font-bold text-lg text-[#1A1A1A]">
            HNT<span className="text-[#14532D]">.</span>Admin
          </span>
          <nav className="hidden sm:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition-colors ${
                  pathname === item.href
                    ? "text-[#14532D]"
                    : "text-[#1A1A1A]/60 hover:text-[#14532D]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 hover:text-red-600 transition-colors cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
