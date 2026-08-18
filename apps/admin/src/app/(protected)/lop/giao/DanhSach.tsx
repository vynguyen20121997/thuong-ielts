"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  nhan: string;
  token: string;
  moCua: boolean;
  dongLuc: string | null;
  choKhach: boolean;
  motLan: boolean;
  daVao: number;
  daNop: number;
  /** Khoá lớp `bg-<id>` — bảng lớp của ĐÚNG buổi này, không phải của đề. */
  khoaLop: string;
}

/**
 * Danh sách bài đã giao, kèm nút chép link.
 *
 * Link dựng từ `NEXT_PUBLIC_WEB_URL` chứ không từ `location.origin`: trang này
 * chạy ở tên miền quản trị, mà link phải trỏ sang trang học sinh. Lấy nhầm gốc
 * là cả lớp bấm vào một địa chỉ đòi mật khẩu quản trị.
 */
const GOC_WEB = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:2000";

export default function DanhSach({ items }: { items: Item[] }) {
  const router = useRouter();
  const [daChep, setDaChep] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#1A1A1A]/45 bg-white border border-black/10 rounded-2xl p-8 text-center">
        Chưa giao bài nào. Tạo link ở trên rồi gửi vào nhóm lớp.
      </p>
    );
  }

  const chep = async (token: string) => {
    const url = `${GOC_WEB}/vao/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setDaChep(token);
      setTimeout(() => setDaChep(null), 2000);
    } catch {
      // Trình duyệt chặn clipboard (thường vì không phải HTTPS). Chọn sẵn text
      // trong ô để cô Ctrl+C — vẫn hơn là không làm gì rồi để cô tưởng đã chép.
      const o = document.getElementById(`link-${token}`) as HTMLInputElement | null;
      o?.select();
    }
  };

  const dong = async (id: string) => {
    await fetch(`/api/bai-giao/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((b) => (
        <div key={b.id} className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <div className="mr-auto min-w-0">
              <span className="block font-serif text-base font-black text-[#1A1A1A]">{b.nhan}</span>
              <span className="block text-xs text-[#1A1A1A]/45 mt-0.5">
                {b.daVao} lượt vào · {b.daNop} đã nộp
                {b.choKhach && " · cho khách gõ tên"}
                {b.motLan && " · một lần"}
              </span>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                b.moCua ? "bg-[#E3F4E8] text-[#157F3D]" : "bg-black/[0.05] text-[#1A1A1A]/45"
              }`}
            >
              {b.moCua ? "Đang mở" : "Đã đóng"}
            </span>

            <Link
              href={`/lop/${b.khoaLop}`}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-bold text-[#1A1A1A]/70 hover:border-[#14532D]/40"
            >
              Xem bảng lớp
            </Link>

            {b.moCua && (
              <button
                type="button"
                onClick={() => dong(b.id)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-bold text-[#1A1A1A]/50 hover:text-[#C62828] hover:border-[#C62828]/40 cursor-pointer"
              >
                Đóng
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              id={`link-${b.token}`}
              readOnly
              value={`${GOC_WEB}/vao/${b.token}`}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 rounded-lg border border-black/10 bg-[#FBFBF9] px-3 py-2 text-xs font-mono text-[#1A1A1A]/70"
            />
            <button
              type="button"
              onClick={() => chep(b.token)}
              className="rounded-lg bg-[#14532D] hover:bg-[#052E16] px-4 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap transition-colors"
            >
              {daChep === b.token ? "Đã chép" : "Chép link"}
            </button>
          </div>

          {b.dongLuc && b.moCua && (
            <p className="text-[11px] text-[#1A1A1A]/40 mt-2">
              Tự đóng lúc {new Date(b.dongLuc).toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
