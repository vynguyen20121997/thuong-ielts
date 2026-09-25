"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tạo đề Writing.
 *
 * Dán nguyên đề vào ô lớn, không tách thành nhiều ô nhỏ: đề Task 2 là một khối
 * chữ có dòng dẫn và dòng câu hỏi, cô thường copy từ tài liệu ra. Bắt tách ra
 * là bắt cô làm việc cho máy.
 *
 * Phần phân tích đề (dạng đề, bẫy hay gặp, từ khoá) KHÔNG phải nhập tay —
 * `domain/taskAnalysis.ts` suy ra bằng luật ngay từ chữ trong đề.
 */
export default function TaoDe() {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const dangLuuRef = useRef(false);

  async function luu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangLuuRef.current) return;
    dangLuuRef.current = true;
    setDangLuu(true);
    setLoi("");
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/noi-dung/de-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: Number(f.get("task")),
          topic: f.get("topic"),
          title: f.get("title"),
          prompt: f.get("prompt"),
          published: f.get("published") === "on",
        }),
      });
      const data = (await res.json()) as { error?: string; data?: { id: string } };
      if (!res.ok) {
        setLoi(data.error ?? "Không lưu được.");
        return;
      }
      setMo(false);
      if (data.data?.id) router.push(`/noi-dung/writing/${data.data.id}`);
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
        Thêm đề
      </button>
    );
  }

  return (
    <form onSubmit={luu} className="w-full rounded-2xl border border-black/10 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Task</span>
          <select
            name="task"
            defaultValue="2"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          >
            <option value="2">Task 2</option>
            <option value="1">Task 1</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Chủ đề</span>
          <input
            name="topic"
            required
            maxLength={80}
            placeholder="Education"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Tên đề</span>
          <input
            name="title"
            required
            maxLength={200}
            placeholder="Học ngoại ngữ từ tiểu học"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
          Đề bài — dán nguyên văn tiếng Anh
        </span>
        <textarea
          name="prompt"
          required
          rows={5}
          maxLength={4000}
          placeholder={
            "Some people think that students should be required to learn a foreign language at primary school.\n\nTo what extent do you agree or disagree?"
          }
          className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-3 text-sm leading-relaxed"
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked className="size-4" />
        Cho học viên thấy ngay
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
          {dangLuu ? "Đang lưu…" : "Thêm đề"}
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
        Dạng đề, bẫy hay gặp và từ khoá thì máy tự suy ra từ chữ trong đề — cô
        không phải nhập.
      </p>
    </form>
  );
}
