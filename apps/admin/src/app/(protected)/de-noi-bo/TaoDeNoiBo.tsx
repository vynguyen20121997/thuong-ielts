"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { MAC_DINH_TASK } from "../../../lib/deNoiBoKieu";

/**
 * "Tạo mới" — giống hộp thoại Tạo đề mới của LMS.
 *
 * Reading: mã đề, tên, thời gian, mô tả; nội dung soạn ở trang kế tiếp.
 * Writing: một đề là một câu hỏi, nên nhập luôn đề bài ở đây.
 *
 * Bỏ hai ô của LMS, có lý do:
 * - "Loại đề": ở đây chỉ có đề nội bộ (đề hẹn test không phải luồng của cô).
 * - "Xem chi tiết kết quả": thuộc về TỪNG LẦN GIAO, không thuộc đề — cùng một
 *   đề, buổi kiểm tra thì che, buổi luyện thì mở. Chỉnh ở trang Giao bài.
 */
export default function TaoDeNoiBo() {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [kyNang, setKyNang] = useState<"reading" | "writing">("reading");
  const [task, setTask] = useState<1 | 2>(2);
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const khoa = useRef(false);

  async function luu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (khoa.current) return;
    khoa.current = true;
    setDangLuu(true);
    setLoi("");
    const f = new FormData(e.currentTarget);
    const body =
      kyNang === "writing"
        ? {
            skill: "writing",
            title: f.get("title"),
            task,
            prompt: f.get("prompt"),
            minWords: Number(f.get("minWords")),
            minutes: Number(f.get("minutes")),
          }
        : {
            code: f.get("code"),
            title: f.get("title"),
            minutes: Number(f.get("minutes")),
            description: f.get("description"),
          };
    try {
      const res = await fetch("/api/de-noi-bo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; data?: { id: string } };
      if (!res.ok || !data.data) {
        setLoi(data.error ?? "Không lưu được.");
        return;
      }
      router.push(`/de-noi-bo/${data.data.id}`);
    } catch {
      setLoi("Mất mạng giữa chừng. Thử lại giúp cô.");
    } finally {
      khoa.current = false;
      setDangLuu(false);
    }
  }

  const o = "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:border-[#14532D] focus:outline-none";
  const nhan = "flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]";
  const chip = (dangChon: boolean) =>
    `cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors ${
      dangChon ? "bg-[#14532D] text-white" : "bg-black/[0.04] text-[#1A1A1A]/65 hover:bg-black/[0.07]"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#052E16]"
      >
        <Plus size={18} aria-hidden /> Tạo mới
      </button>

      {mo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => setMo(false)}>
          <form
            onSubmit={luu}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tao-de-tieu-de"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <h2 id="tao-de-tieu-de" className="text-lg font-bold text-[#1A1A1A]">Tạo đề mới</h2>
              <button type="button" onClick={() => setMo(false)} aria-label="Đóng" className="cursor-pointer rounded-lg p-1.5 text-[#1A1A1A]/60 hover:bg-black/5">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="flex gap-2 sm:col-span-2" role="group" aria-label="Kỹ năng">
                <button type="button" className={chip(kyNang === "reading")} aria-pressed={kyNang === "reading"} onClick={() => setKyNang("reading")}>
                  Reading
                </button>
                <button type="button" className={chip(kyNang === "writing")} aria-pressed={kyNang === "writing"} onClick={() => setKyNang("writing")}>
                  Writing
                </button>
              </div>

              {kyNang === "reading" ? (
                <>
                  <label className={nhan}>
                    Mã đề
                    <input name="code" required autoFocus placeholder="vd. IT209-BUOI5" className={o} />
                  </label>
                  <label className={nhan}>
                    Thời gian (phút)
                    <input name="minutes" type="number" min={1} max={180} defaultValue={20} required className={o} />
                  </label>
                  <label className={`${nhan} sm:col-span-2`}>
                    Tên đề
                    <input name="title" required placeholder="vd. IT209 – Vocabulary gap-fill buổi 5/11" className={o} />
                  </label>
                  <label className={`${nhan} sm:col-span-2`}>
                    Mô tả <span className="font-normal text-[#1A1A1A]/50">— chỉ cô thấy</span>
                    <textarea name="description" rows={3} className={o} />
                  </label>
                </>
              ) : (
                <>
                  <div className="flex gap-2 sm:col-span-2" role="group" aria-label="Task">
                    {([1, 2] as const).map((t) => (
                      <button key={t} type="button" className={chip(task === t)} aria-pressed={task === t} onClick={() => setTask(t)}>
                        Task {t}
                      </button>
                    ))}
                  </div>
                  <label className={`${nhan} sm:col-span-2`}>
                    Tên đề
                    <input name="title" required autoFocus placeholder="vd. IT209 – Task 2 Remote work" className={o} />
                  </label>
                  {/* `key` theo task: đổi Task thì số từ / số phút về đúng chuẩn của Task đó. */}
                  <label className={nhan}>
                    Số từ tối thiểu
                    <input key={`w${task}`} name="minWords" type="number" min={50} max={500} defaultValue={MAC_DINH_TASK[task].minWords} required className={o} />
                  </label>
                  <label className={nhan}>
                    Thời gian (phút)
                    <input key={`m${task}`} name="minutes" type="number" min={5} max={120} defaultValue={MAC_DINH_TASK[task].minutes} required className={o} />
                  </label>
                  <label className={`${nhan} sm:col-span-2`}>
                    Đề bài <span className="font-normal text-[#1A1A1A]/50">— dán nguyên văn như học sinh sẽ đọc</span>
                    <textarea name="prompt" required minLength={20} rows={6} className={o} />
                  </label>
                </>
              )}

              {loi && <p role="alert" className="text-sm font-semibold text-red-600 sm:col-span-2">{loi}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-black/10 px-6 py-4">
              <button type="button" onClick={() => setMo(false)} className="cursor-pointer rounded-full px-5 py-2.5 text-sm font-bold text-[#1A1A1A]/70 hover:bg-black/5">
                Huỷ
              </button>
              <button type="submit" disabled={dangLuu} className="cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-60">
                {dangLuu ? "Đang tạo…" : kyNang === "writing" ? "Tạo đề" : "Tạo và soạn đề"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
