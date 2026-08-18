"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface De {
  target: string;
  title: string;
}

/**
 * Form tạo link giao bài.
 *
 * Bốn lựa chọn, không hơn: đề nào, đặt tên buổi là gì, cho khách vào không,
 * mấy tiếng thì đóng. Mỗi thứ thêm vào đây là một thứ cô phải quyết định giữa
 * buổi dạy, nên chỉ giữ những gì thật sự đổi kết quả.
 */
export default function FormGiaoBai({
  reading,
  listening,
}: {
  reading: De[];
  listening: De[];
}) {
  const router = useRouter();
  const [kyNang, setKyNang] = useState<"reading" | "listening">("reading");
  const [target, setTarget] = useState(reading[0]?.target ?? "");
  const [nhan, setNhan] = useState("");
  const [choKhach, setChoKhach] = useState(true);
  const [gio, setGio] = useState(12);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const dsDe = kyNang === "reading" ? reading : listening;

  const doiKyNang = (k: "reading" | "listening") => {
    setKyNang(k);
    setTarget((k === "reading" ? reading : listening)[0]?.target ?? "");
  };

  const tao = async () => {
    if (!target) return;
    setDangGui(true);
    setLoi(null);
    try {
      const res = await fetch("/api/bai-giao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: kyNang,
          // Reading gộp cả bài; Listening vốn đã là cả bài.
          scope: "test",
          target,
          label: nhan.trim() || null,
          allowGuest: choKhach,
          dongSauGio: gio,
        }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => null)) as { error?: string } | null;
        setLoi(p?.error ?? "Không tạo được link. Thử lại.");
        return;
      }
      setNhan("");
      router.refresh();
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-6 max-w-2xl">
      <div className="flex gap-2 mb-5">
        {(["reading", "listening"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => doiKyNang(k)}
            className={`rounded-full px-4 py-2 text-sm font-bold cursor-pointer transition-colors ${
              kyNang === k
                ? "bg-[#14532D] text-white"
                : "bg-black/[0.04] text-[#1A1A1A]/60 hover:bg-black/[0.07]"
            }`}
          >
            {k === "reading" ? "Reading" : "Listening"}
          </button>
        ))}
      </div>

      <label className="block text-xs font-bold text-[#1A1A1A]/50 mb-1.5">Đề</label>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm mb-4 cursor-pointer"
      >
        {dsDe.map((d) => (
          <option key={d.target} value={d.target}>
            {d.title}
          </option>
        ))}
      </select>

      <label className="block text-xs font-bold text-[#1A1A1A]/50 mb-1.5">
        Tên buổi học <span className="font-medium text-[#1A1A1A]/35">— để trống thì lấy tên đề</span>
      </label>
      <input
        value={nhan}
        onChange={(e) => setNhan(e.target.value)}
        placeholder="Lớp 9A · thứ 3"
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm mb-4"
      />

      <div className="flex flex-wrap items-center gap-6 mb-5">
        <label className="flex items-center gap-2 text-sm text-[#1A1A1A]/70 cursor-pointer">
          <input
            type="checkbox"
            checked={choKhach}
            onChange={(e) => setChoKhach(e.target.checked)}
            className="accent-[#14532D] h-4 w-4 cursor-pointer"
          />
          Cho vào bằng cách gõ tên (không cần tài khoản)
        </label>

        <label className="flex items-center gap-2 text-sm text-[#1A1A1A]/70">
          Tự đóng sau
          <input
            type="number"
            min={1}
            max={720}
            value={gio}
            onChange={(e) => setGio(Number(e.target.value))}
            className="w-16 rounded-lg border border-black/10 px-2 py-1 text-sm tabular-nums"
          />
          giờ
        </label>
      </div>

      <button
        type="button"
        onClick={tao}
        disabled={dangGui || !target}
        className="rounded-full bg-[#14532D] hover:bg-[#052E16] disabled:opacity-50 disabled:cursor-wait px-5 py-2.5 text-sm font-bold text-white cursor-pointer transition-colors"
      >
        {dangGui ? "Đang tạo..." : "Tạo link"}
      </button>

      {loi && <p className="mt-3 text-sm text-[#C62828]">{loi}</p>}
    </div>
  );
}
