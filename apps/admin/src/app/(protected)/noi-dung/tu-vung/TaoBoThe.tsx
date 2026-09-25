"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tạo bộ thẻ mới.
 *
 * Chỉ hỏi tên và chủ đề. Chủ đề KHÔNG bắt buộc nhưng nên có: màn luyện Writing
 * lấy từ gợi ý bằng cách khớp chủ đề của bộ thẻ với chủ đề của đề bài, nên bộ
 * không có chủ đề thì không bao giờ được gợi ý ở đó.
 */
export default function TaoBoThe() {
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
      const res = await fetch("/api/noi-dung/bo-the", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          topic: f.get("topic"),
          description: f.get("description"),
        }),
      });
      const data = (await res.json()) as { error?: string; data?: { id: string } };
      if (!res.ok) {
        setLoi(data.error ?? "Không lưu được.");
        return;
      }
      setMo(false);
      if (data.data?.id) router.push(`/noi-dung/tu-vung/${data.data.id}`);
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
        className="cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#052E16]"
      >
        Tạo bộ thẻ
      </button>
    );
  }

  return (
    <form onSubmit={luu} className="w-full rounded-2xl border border-black/10 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Tên bộ thẻ</span>
          <input
            name="name"
            required
            maxLength={120}
            autoFocus
            placeholder="Education — từ vựng cốt lõi"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Chủ đề</span>
          <input
            name="topic"
            maxLength={80}
            placeholder="Education"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Mô tả</span>
        <input
          name="description"
          maxLength={500}
          placeholder="Dùng cho lớp 6.5, học trước khi vào Writing chủ đề giáo dục"
          className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
        />
      </label>

      {loi && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
          {loi}
        </p>
      )}

      <div className="mt-4 flex gap-2.5">
        <button
          type="submit"
          disabled={dangLuu}
          className="cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-50"
        >
          {dangLuu ? "Đang lưu…" : "Tạo bộ thẻ"}
        </button>
        <button
          type="button"
          onClick={() => setMo(false)}
          className="cursor-pointer rounded-full border border-black/15 px-5 py-2.5 text-sm font-bold text-[#1A1A1A]/70"
        >
          Huỷ
        </button>
      </div>
      <p className="mt-3 text-xs text-[#1A1A1A]/60">
        Chủ đề để trống cũng được, nhưng đặt rồi thì từ trong bộ này mới được
        gợi ý ở màn luyện Writing cùng chủ đề.
      </p>
    </form>
  );
}
