"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Nút "Mở kết quả cho cả lớp".
 *
 * Chỉ hiện khi cô đã đặt "chờ cô mở" cho điểm hoặc đáp án. Bấm một lần, không
 * đóng lại được — sau khi cả lớp đã nhìn thấy đáp án thì đóng lại chẳng giấu
 * được gì, chỉ làm học sinh bối rối. Vì không lui được nên phải hỏi lại.
 */
export default function MoKetQua({
  khoa,
  daMo,
  hienDiem,
  hienDapAn,
}: {
  khoa: string;
  daMo: boolean;
  hienDiem: string | null;
  hienDapAn: string | null;
}) {
  const router = useRouter();
  const [dangGui, setDangGui] = useState(false);
  const [hoi, setHoi] = useState(false);

  const coCho = hienDiem === "khi_co_mo" || hienDapAn === "khi_co_mo";
  if (!coCho) return null;

  if (daMo) {
    return (
      <span className="rounded-full bg-[#E3F4E8] px-3 py-1.5 text-xs font-bold text-[#157F3D]">
        Đã mở kết quả cho cả lớp
      </span>
    );
  }

  const mo = async () => {
    setDangGui(true);
    await fetch(`/api/lop/${khoa}/mo-ket-qua`, { method: "POST" });
    setDangGui(false);
    setHoi(false);
    router.refresh();
  };

  if (hoi) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-[#1A1A1A]/60">Mở rồi không đóng lại được.</span>
        <button
          type="button"
          onClick={mo}
          disabled={dangGui}
          className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
        >
          {dangGui ? "Đang mở..." : "Mở"}
        </button>
        <button
          type="button"
          onClick={() => setHoi(false)}
          className="text-xs font-bold text-[#1A1A1A]/45 hover:text-[#1A1A1A] cursor-pointer"
        >
          Thôi
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setHoi(true)}
      className="rounded-full border border-[#14532D]/30 px-3 py-1.5 text-xs font-bold text-[#14532D] hover:bg-[#14532D]/[0.06] cursor-pointer"
    >
      Mở kết quả cho cả lớp
    </button>
  );
}
