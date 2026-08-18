import Link from "next/link";

import { docLop } from "../../../../lib/lop";
import BangLop from "./BangLop";

export const dynamic = "force-dynamic";

/**
 * Bảng lớp trực tiếp.
 *
 * Server đọc DB trước rồi mới giao cho client nối socket — nhờ vậy cô mở trang
 * giữa buổi là thấy đủ ngay lập tức, không phải ngồi chờ nhịp kế tiếp của từng
 * em. Socket chỉ chở phần cập nhật về sau.
 */
export default async function TrangLop({
  params,
}: {
  params: Promise<{ target: string }>;
}) {
  const { target } = await params;
  const banDau = await docLop(target);

  return (
    <div>
      <div className="flex items-center gap-4">
        <Link href="/lop" className="text-xs font-bold text-[#1A1A1A]/50 hover:text-[#14532D]">
          ← Tất cả lớp
        </Link>
        <Link
          href={`/lop/${encodeURIComponent(target)}/diem`}
          className="text-xs font-bold text-[#14532D] hover:underline"
        >
          Bảng điểm cả lớp →
        </Link>
      </div>
      {/*
        Tiêu đề KHÔNG đổi theo số học sinh.

        Trước đây nó hiện "Chưa có ai vào" khi `banDau` rỗng — nhưng đó là ảnh
        chụp lúc server dựng trang, còn học sinh thì vào sau qua socket. Cô mở
        trang trước giờ học rồi cả lớp vào, tiêu đề vẫn nói không có ai trong
        khi bên dưới là sáu em đang làm bài. Chuyện "có ai chưa" thuộc về phần
        sống, nên để `BangLop` nói.
      */}
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mt-2 mb-6">
        Bảng lớp trực tiếp
        <span className="block text-sm font-sans font-medium text-[#1A1A1A]/45 mt-1">{target}</span>
      </h1>

      <BangLop target={target} banDau={banDau} />
    </div>
  );
}
