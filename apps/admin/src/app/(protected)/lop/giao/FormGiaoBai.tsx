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
  // Cả lớp hay một bạn. Về kỹ thuật hai thứ giống nhau — đều là một link —
  // nhưng màn theo dõi tách chúng ra hai nhóm, và bảng điểm buổi học không
  // lẫn bài gửi riêng vào.
  const [choAi, setChoAi] = useState<"class" | "one">("class");
  // Học sinh thấy điểm / đáp án khi nào. Mặc định "ngay" để giữ nếp cũ; cô
  // nào muốn chữa chung cả lớp thì đổi sang "chờ cô mở".
  const [hienDiem, setHienDiem] = useState<"ngay" | "khi_co_mo" | "khong">("ngay");
  const [hienDapAn, setHienDapAn] = useState<"ngay" | "khi_co_mo" | "khong">("ngay");
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
          audience: choAi,
          showScore: hienDiem,
          showAnswers: hienDapAn,
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

      <label className="block text-xs font-bold text-[#1A1A1A]/50 mb-1.5">Gửi cho ai</label>
      <div className="flex gap-2 mb-4">
        {(
          [
            ["class", "Cả lớp"],
            ["one", "Một bạn"],
          ] as const
        ).map(([v, chu]) => (
          <button
            key={v}
            type="button"
            onClick={() => setChoAi(v)}
            className={`rounded-full px-4 py-2 text-sm font-bold cursor-pointer transition-colors ${
              choAi === v
                ? "bg-[#14532D] text-white"
                : "bg-black/[0.04] text-[#1A1A1A]/60 hover:bg-black/[0.07]"
            }`}
          >
            {chu}
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

      <label className="block text-xs font-bold text-[#1A1A1A]/50 mb-1.5">
        Sau khi nộp, học viên được xem
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <ChonHien nhan="Điểm" giaTri={hienDiem} doi={setHienDiem} />
        <ChonHien nhan="Đáp án đúng" giaTri={hienDapAn} doi={setHienDapAn} />
      </div>

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

/**
 * Ba mức: hiện ngay / chờ cô mở / không cho xem.
 *
 * "Chờ cô mở" là mức đáng dùng nhất mà cũng dễ bỏ quên nhất, nên ghi rõ nó làm
 * gì ngay dưới ô chọn thay vì để cô đoán.
 */
function ChonHien({
  nhan,
  giaTri,
  doi,
}: {
  nhan: string;
  giaTri: "ngay" | "khi_co_mo" | "khong";
  doi: (v: "ngay" | "khi_co_mo" | "khong") => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-[#1A1A1A]/60 mb-1">{nhan}</span>
      <select
        value={giaTri}
        onChange={(e) => doi(e.target.value as "ngay" | "khi_co_mo" | "khong")}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm cursor-pointer"
      >
        <option value="ngay">Hiện ngay khi nộp</option>
        <option value="khi_co_mo">Chờ cô mở</option>
        <option value="khong">Không cho xem</option>
      </select>
      {giaTri === "khi_co_mo" && (
        <span className="block text-[11px] text-[#1A1A1A]/45 mt-1">
          Chữa chung cả lớp xong, cô bấm mở ở bảng lớp.
        </span>
      )}
    </label>
  );
}
