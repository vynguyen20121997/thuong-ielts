"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tạo lớp mới.
 *
 * Chỉ hỏi ba thứ: tên lớp, mức học phí, chu kỳ thu. Ngày bắt đầu/kết thúc và
 * ghi chú sửa sau trong trang lớp — bắt điền đủ tám ô trước khi được tạo lớp
 * là cách nhanh nhất để cô bỏ ngang và quay lại dùng sổ giấy.
 *
 * Mức học phí ĐỂ TRỐNG ĐƯỢC. Có lớp cô chốt tiền sau, và một con số 0 ghi bừa
 * vào đó còn tệ hơn một ô trống nói thật là chưa có.
 */
export default function TaoLop() {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  /* Chốt chống bấm lặp phải là ref: state chỉ có hiệu lực sau lần vẽ lại. */
  const dangLuuRef = useRef(false);

  async function luu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangLuuRef.current) return;
    dangLuuRef.current = true;
    setDangLuu(true);
    setLoi("");

    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/hoc-vien/lop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          tuitionAmount: f.get("tuitionAmount"),
          tuitionCycle: f.get("tuitionCycle"),
        }),
      });
      const data = (await res.json()) as { error?: string; data?: { id: string } };
      if (!res.ok) {
        setLoi(data.error ?? "Không lưu được.");
        return;
      }
      setMo(false);
      if (data.data?.id) router.push(`/hoc-vien/${data.data.id}`);
      else router.refresh();
    } catch {
      setLoi("Mất mạng giữa chừng. Thử lại giúp cô.");
    } finally {
      dangLuuRef.current = false;
      setDangLuu(false);
    }
  }

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => setMo(true)}
        className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
      >
        Tạo lớp mới
      </button>
    );
  }

  return (
    <form
      onSubmit={luu}
      className="w-full rounded-2xl border border-black/10 bg-white p-5"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
            Tên lớp
          </span>
          <input
            name="name"
            required
            maxLength={120}
            autoFocus
            placeholder="IELTS 6.5 — tối 2-4-6"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
            Học phí (đồng)
          </span>
          <input
            name="tuitionAmount"
            inputMode="numeric"
            placeholder="1.500.000"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm font-mono"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
            Thu theo
          </span>
          <select
            name="tuitionCycle"
            defaultValue="thang"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          >
            <option value="thang">Tháng</option>
            <option value="khoa">Trọn khoá</option>
            <option value="buoi">Buổi</option>
          </select>
        </label>
      </div>

      {loi && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
          {loi}
        </p>
      )}

      <div className="mt-4 flex gap-2.5">
        <button
          type="submit"
          disabled={dangLuu}
          className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
        >
          {dangLuu ? "Đang lưu…" : "Tạo lớp"}
        </button>
        <button
          type="button"
          onClick={() => setMo(false)}
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-bold text-[#1A1A1A]/70 cursor-pointer"
        >
          Huỷ
        </button>
      </div>

      <p className="mt-3 text-xs text-[#1A1A1A]/60">
        Chưa chốt học phí thì để trống — điền sau trong trang lớp.
      </p>
    </form>
  );
}
