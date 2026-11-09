"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Send, Trash2 } from "lucide-react";

import type { DeWritingSoan } from "../../../../lib/deNoiBoKieu";

const o = "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:border-[#14532D] focus:outline-none";
const nhanO = "flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]";

/** Sửa đề Writing nội bộ. Bài đã nộp giữ nguyên đề lúc nộp, sửa ở đây không ảnh hưởng. */
export default function SoanDeWriting({ id, banDau, soBaiNop }: { id: string; banDau: DeWritingSoan; soBaiNop: number }) {
  const router = useRouter();
  const [de, setDe] = useState(banDau);
  const [thayDoi, setThayDoi] = useState(false);
  const [thongBao, setThongBao] = useState<{ loai: "ok" | "loi"; chu: string } | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const khoa = useRef(false);

  const sua = (p: Partial<DeWritingSoan>) => {
    setDe((d) => ({ ...d, ...p }));
    setThayDoi(true);
  };

  async function goi(method: "PATCH" | "DELETE") {
    const res = await fetch("/api/de-noi-bo", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(method === "PATCH" ? { id, de } : { id }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? null : data.error ?? "Không lưu được.";
  }

  async function luu() {
    if (khoa.current) return;
    khoa.current = true;
    setDangLuu(true);
    setThongBao(null);
    try {
      const loi = await goi("PATCH");
      if (loi) return setThongBao({ loai: "loi", chu: loi });
      setThayDoi(false);
      setThongBao({ loai: "ok", chu: "Đã lưu." });
      router.refresh();
    } catch {
      setThongBao({ loai: "loi", chu: "Mất mạng giữa chừng. Thử lại giúp cô." });
    } finally {
      khoa.current = false;
      setDangLuu(false);
    }
  }

  async function xoa() {
    if (!confirm("Xoá hẳn đề này? Không khôi phục được.")) return;
    const loi = await goi("DELETE");
    if (loi) return setThongBao({ loai: "loi", chu: loi });
    router.push("/de-noi-bo");
    router.refresh();
  }

  const soTu = de.prompt.trim() ? de.prompt.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
          <label className={nhanO}>
            Tên đề
            <input value={de.title} onChange={(e) => sua({ title: e.target.value })} className={o} />
          </label>
          <label className={nhanO}>
            Task
            <select value={de.task} onChange={(e) => sua({ task: Number(e.target.value) === 1 ? 1 : 2 })} className={o}>
              <option value={1}>Task 1</option>
              <option value={2}>Task 2</option>
            </select>
          </label>
          <label className={nhanO}>
            Số từ tối thiểu
            <input type="number" min={50} max={500} value={de.minWords} onChange={(e) => sua({ minWords: Number(e.target.value) })} className={o} />
          </label>
          <label className={nhanO}>
            Phút
            <input type="number" min={5} max={120} value={de.minutes} onChange={(e) => sua({ minutes: Number(e.target.value) })} className={o} />
          </label>
          <label className={`${nhanO} sm:col-span-4`}>
            Đề bài <span className="font-normal text-[#1A1A1A]/50">— {soTu} từ</span>
            <textarea value={de.prompt} onChange={(e) => sua({ prompt: e.target.value })} rows={8} className={`${o} leading-relaxed`} />
          </label>
        </div>
        <p className="mt-4 text-sm text-[#1A1A1A]/60">
          Bài nộp được chấm band bốn tiêu chí (TR/CC/LR/GRA) như màn luyện Writing.
          {soBaiNop > 0 && <> Đã có <b className="font-mono">{soBaiNop}</b> bài nộp — mỗi bài giữ nguyên đề lúc nộp.</>}
        </p>
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {thayDoi && <span className="text-sm font-semibold text-[#B45309]">Chưa lưu</span>}
        {thongBao && (
          <span role="status" className={`text-sm font-semibold ${thongBao.loai === "ok" ? "text-[#14532D]" : "text-red-600"}`}>
            {thongBao.chu}
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={xoa} className="flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
            <Trash2 size={16} aria-hidden /> Xoá đề
          </button>
          {!thayDoi && (
            <Link href="/lop/giao" className="flex items-center gap-1.5 rounded-full border border-[#14532D]/30 px-4 py-2.5 text-sm font-bold text-[#14532D] hover:bg-[#F3F4EF]">
              <Send size={16} aria-hidden /> Giao bài
            </Link>
          )}
          <button
            type="button"
            onClick={luu}
            disabled={dangLuu}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-60"
          >
            <Save size={16} aria-hidden /> {dangLuu ? "Đang lưu…" : "Lưu đề"}
          </button>
        </div>
      </div>
    </div>
  );
}
