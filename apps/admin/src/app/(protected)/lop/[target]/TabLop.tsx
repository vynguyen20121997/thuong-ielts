"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Ba màn của một lớp, đặt cạnh nhau.
 *
 * Trước đây chúng là ba dòng chữ nhỏ nằm rời rạc: "Bảng điểm cả lớp" và
 * "Chữa câu nào trước" chỉ hiện ở màn bảng lớp, còn từ bảng điểm thì không
 * có đường sang Insights. Cô phải nhớ đường đi mới tới được — và màn đáng
 * giá nhất sau buổi học lại là màn khó tìm nhất.
 *
 * Đặt thành tab thì ở đâu cũng thấy đủ ba, và biết mình đang ở đâu.
 */
const TAB = [
  { duoi: "", nhan: "Bảng lớp trực tiếp" },
  { duoi: "/diem", nhan: "Bảng điểm cả lớp" },
  { duoi: "/kho", nhan: "Chữa câu nào trước" },
];

export default function TabLop({ khoa }: { khoa: string }) {
  const duong = usePathname();
  const goc = `/lop/${khoa}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-black/10 mb-6">
      {TAB.map((t) => {
        const href = goc + t.duoi;
        const dangO = duong === href;
        return (
          <Link
            key={t.duoi}
            href={href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              dangO
                ? "border-[#14532D] text-[#14532D]"
                : "border-transparent text-[#1A1A1A]/45 hover:text-[#1A1A1A]/70"
            }`}
          >
            {t.nhan}
          </Link>
        );
      })}
    </nav>
  );
}
