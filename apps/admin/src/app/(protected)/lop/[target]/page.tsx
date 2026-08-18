import Link from "next/link";

import { biaLop, docLop } from "../../../../lib/lop";
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
  const [banDau, bia] = await Promise.all([docLop(target), biaLop(target)]);

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
      <div className="mt-2 mb-6">
        <span className="block text-[11px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/40 mb-1">
          {bia?.loai === "tu-luyen"
            ? "Học viên tự luyện"
            : bia?.choAi === "one"
              ? "Gửi riêng cho một bạn"
              : "Giao cho cả lớp"}
          {bia?.boDe ? ` · ${bia.boDe}` : ""} ·{" "}
          {bia?.kyNang === "listening" ? "Nghe" : "Đọc"}
        </span>
        <h1 className="font-serif text-3xl font-black text-[#1A1A1A]">
          {bia?.nhan ?? "Bảng lớp trực tiếp"}
        </h1>
        {/* Tên đề luôn hiện dưới tên buổi: cô giao cùng một đề cho ba lớp thì
            tên buổi phân biệt được lớp, còn tên đề nói đang làm bài gì. */}
        {bia && bia.nhan !== bia.title && (
          <p className="text-sm text-[#1A1A1A]/55 mt-1">{bia.title}</p>
        )}
        {bia && bia.chuDe.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {bia.chuDe.map((c) => (
              <span
                key={c}
                className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#1A1A1A]/55"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <BangLop target={target} banDau={banDau} />
    </div>
  );
}
