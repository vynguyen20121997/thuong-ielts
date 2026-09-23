"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, Loader2, Search } from "lucide-react";

/**
 * Hộp "Kiến thức nền" dưới bảng gợi ý ý tưởng.
 *
 * ## Nội dung là của cô, không phải của máy
 *
 * Mọi đoạn chữ học sinh đọc ở đây đều nằm sẵn trong `writing_prompt_knowledge`.
 * Model chỉ làm đúng một việc: khi em gõ một câu hỏi tự do, nó CHỌN ghi chú
 * gần nhất trong danh sách. Nó không viết được một dòng nào — Jev chỉ trả về
 * giá trị có kiểu, không sinh chữ. Nhờ ràng buộc đó, học sinh không bao giờ
 * đọc phải một đoạn giải thích do máy bịa.
 *
 * ## Vì sao đóng sẵn
 *
 * Trang viết đã có đề, đồng hồ, bảng gợi ý. Mở sẵn thêm một khối chữ dài nữa
 * là mời học sinh đọc thay vì viết. Ai cần thì bấm; bấm là một hành động có
 * chủ đích, và chính nó nói cho mình biết em đang thiếu gì.
 */

type Note = { topic: string; body: string };

export default function KnowledgePanel({
  promptId,
  topics,
}: {
  promptId: string;
  topics: { id: string; topic: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const [miss, setMiss] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (topics.length === 0) return null;

  async function load(payload: { noteId?: string; question?: string }) {
    setBusy(true);
    setError(null);
    setMiss(false);
    try {
      const res = await fetch("/api/practice/writing/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, ...payload }),
      });
      if (!res.ok) throw new Error(`Không tải được (${res.status}).`);
      const data = (await res.json()) as { note: Note | null; reason?: string };
      if (data.note) setNote(data.note);
      // Không khớp được câu hỏi: nói thẳng và mời chọn tay, đừng đưa đại một
      // ghi chú không liên quan.
      else setMiss(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được kiến thức nền.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      /* Ghi chú kiến thức nền dài hơn màn hình — cùng lý do với bảng gợi ý. */
      data-lenis-prevent
      className="panel-scroll w-full lg:max-h-[38vh] rounded-2xl border border-black/5 bg-white p-5 md:p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xs font-bold uppercase tracking-[0.12em] text-ink/45 flex items-center gap-1.5">
          <BookOpen size={13} />
          Kiến thức nền
        </span>
        {note && (
          <button
            type="button"
            onClick={() => setNote(null)}
            className="flex items-center gap-1 text-2xs font-semibold text-ink/45 hover:text-brand cursor-pointer transition-colors"
          >
            <ArrowLeft size={12} />
            Chủ đề khác
          </button>
        )}
      </div>

      {!open ? (
        <>
          <p className="mt-2 text-[13px] text-ink/60 leading-relaxed">
            Chưa chắc dùng từ nào, lấy ví dụ ở đâu, hay viết đoạn phản biện kiểu gì? Có sẵn ghi
            chú cho đúng đề này.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 rounded-full border border-brand/35 bg-white px-4 py-2 text-[13px] font-semibold text-brand cursor-pointer transition-colors hover:bg-brand/[0.06] hover:border-brand/60"
          >
            Tôi muốn tìm hiểu
          </button>
        </>
      ) : note ? (
        <div className="hint-box mt-3 rounded-xl bg-mist p-4">
          <h3
            className="hint-step text-[13px] font-bold text-brand"
            style={{ "--i": 0 } as CSSProperties}
          >
            {note.topic}
          </h3>
          {/* `whitespace-pre-line` giữ các dòng gạch đầu dòng cô xuống hàng sẵn. */}
          <p
            className="hint-step mt-2 text-[13px] leading-relaxed text-ink/80 whitespace-pre-line"
            style={{ "--i": 1 } as CSSProperties}
          >
            {note.body}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={busy}
                onClick={() => load({ noteId: t.id })}
                className="rounded-full border border-brand/35 bg-white px-3.5 py-2 text-[13px] font-semibold text-brand cursor-pointer transition-colors hover:bg-brand/[0.06] hover:border-brand/60 disabled:opacity-50 disabled:cursor-wait"
              >
                {t.topic}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) load({ question: question.trim() });
            }}
            className="flex gap-2"
          >
            <label htmlFor="knowledge-question" className="sr-only">
              Hỏi một điều cụ thể về đề này
            </label>
            <input
              id="knowledge-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Hoặc hỏi: viết đoạn phản biện kiểu gì?"
              className="flex-1 min-w-0 rounded-full border border-black/10 bg-white px-4 py-2 text-[13px] text-ink placeholder:text-ink/30 focus:outline-none focus:border-brand/40 transition-colors"
            />
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-brand hover:bg-brand-deep disabled:bg-black/15 disabled:cursor-not-allowed px-4 py-2 text-2xs font-bold text-white cursor-pointer transition-colors"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Search size={13} />
              )}
              Tìm
            </button>
          </form>

          {miss && (
            <p className="text-2xs text-ink/50 leading-relaxed">
              Chưa có ghi chú nào cho câu hỏi đó. Thử chọn một chủ đề ở trên, hoặc hỏi cô trực
              tiếp — phần này chỉ có những gì cô đã soạn sẵn cho đề.
            </p>
          )}
          {error && <p className="text-2xs text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
