"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { DeWriting, KienThuc, YTuong } from "../../../../../lib/noiDungKieu";
import { NHAN_PHIA } from "../../../../../lib/noiDungKieu";

/**
 * Soạn ngân hàng ý và kiến thức nền cho một đề Writing.
 *
 * Một luận điểm gồm bốn phần theo đúng khung P-E-E học sinh thấy: tên luận
 * điểm, câu mở ý (Point), câu giải thích (Explain), câu ví dụ (Example). Cộng
 * thêm câu gợi mở để em ấy tự biến ý đó thành ý của mình — nếu không thì các
 * em chép nguyên câu mẫu vào bài và cả lớp nộp giống nhau.
 */

type Tab = "y" | "kien-thuc" | "de";

export default function SoanDe({
  de,
  y,
  kienThuc,
}: {
  de: DeWriting;
  y: YTuong[];
  kienThuc: KienThuc[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("y");
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const dangLuuRef = useRef(false);

  async function goi(
    duongDan: string,
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ): Promise<boolean> {
    if (dangLuuRef.current) return false;
    dangLuuRef.current = true;
    setDangLuu(true);
    setLoi("");
    try {
      const res = await fetch(duongDan, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoi(data.error ?? "Không lưu được.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setLoi("Mất mạng giữa chừng. Thử lại giúp cô.");
      return false;
    } finally {
      dangLuuRef.current = false;
      setDangLuu(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {(
          [
            ["y", `Luận điểm · ${y.length}`],
            ["kien-thuc", `Kiến thức nền · ${kienThuc.length}`],
            ["de", "Sửa đề"],
          ] as [Tab, string][]
        ).map(([id, nhan]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === id
                ? "bg-[#14532D] text-white"
                : "bg-black/5 text-[#1A1A1A]/70 hover:bg-black/10"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {loi && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {loi}
        </p>
      )}

      {tab === "y" && (
        <div className="flex flex-col gap-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const xong = await goi("/api/noi-dung/y-tuong", "POST", {
                promptId: de.id,
                side: f.get("side"),
                label: f.get("label"),
                starter: f.get("starter"),
                frameExplain: f.get("frameExplain"),
                frameExample: f.get("frameExample"),
                probe: f.get("probe"),
                questions: f.get("questions"),
              });
              if (xong) (e.target as HTMLFormElement).reset();
            }}
            className="rounded-2xl border border-black/10 bg-white p-5"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
              Thêm luận điểm
            </p>
            <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Phía</span>
                <select
                  name="side"
                  defaultValue="pos"
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                >
                  <option value="pos">Ủng hộ</option>
                  <option value="neg">Phản đối</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                  Tên luận điểm
                </span>
                <input
                  name="label"
                  required
                  maxLength={200}
                  placeholder="Trẻ nhỏ tiếp thu phát âm nhanh hơn"
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                  Point — câu mở ý
                </span>
                <input
                  name="starter"
                  maxLength={500}
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                  Explain — câu giải thích
                </span>
                <input
                  name="frameExplain"
                  maxLength={500}
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                  Example — câu ví dụ
                </span>
                <input
                  name="frameExample"
                  maxLength={500}
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                  Câu tự hỏi — mỗi dòng một câu, để em ấy biến thành ý của mình
                </span>
                <textarea
                  name="questions"
                  rows={2}
                  className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                  placeholder={"Em từng học ngoại ngữ từ mấy tuổi?\nLúc đó em thấy dễ hay khó hơn bây giờ?"}
                />
              </label>
              <input type="hidden" name="probe" value="" />
            </div>

            <button
              type="submit"
              disabled={dangLuu}
              className="mt-4 cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-50"
            >
              {dangLuu ? "Đang lưu…" : "Thêm luận điểm"}
            </button>
          </form>

          {y.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/15 px-6 py-10 text-center text-sm text-[#1A1A1A]/60">
              Chưa có luận điểm nào — học viên mở đề này ra sẽ thấy mục Idea
              Development báo “cô chưa soạn”.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {y.map((i) => (
                <li key={i.id} className="rounded-2xl border border-black/10 bg-white p-5">
                  <p className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        i.side === "pos"
                          ? "bg-[#14532D]/10 text-[#14532D]"
                          : "bg-[#B45309]/10 text-[#B45309]"
                      }`}
                    >
                      {NHAN_PHIA[i.side]}
                    </span>
                    <b className="text-[#1A1A1A]">{i.label}</b>
                    <button
                      type="button"
                      disabled={dangLuu}
                      onClick={() => {
                        if (!window.confirm(`Xoá luận điểm "${i.label}"?`)) return;
                        void goi("/api/noi-dung/y-tuong", "DELETE", { ideaId: i.id });
                      }}
                      className="ml-auto cursor-pointer text-xs font-bold text-[#1A1A1A]/50 hover:text-red-600 disabled:opacity-50"
                    >
                      Xoá
                    </button>
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm">
                    {(
                      [
                        ["Point", i.starter],
                        ["Explain", i.frameExplain],
                        ["Example", i.frameExample],
                      ] as [string, string][]
                    ).map(([nhan, giaTri]) => (
                      <div key={nhan}>
                        <dt className="text-[11px] font-bold text-[#1A1A1A]/50">{nhan}</dt>
                        <dd className="mt-0.5 text-[#1A1A1A]/80">{giaTri || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                  {i.questions.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 rounded-xl bg-[#EFEFEA] px-6 py-3 text-sm text-[#1A1A1A]/75">
                      {i.questions.map((q, n) => (
                        <li key={n}>{q}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "kien-thuc" && (
        <div className="flex flex-col gap-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const xong = await goi("/api/noi-dung/kien-thuc", "POST", {
                promptId: de.id,
                topic: f.get("topic"),
                summary: f.get("summary"),
                body: f.get("body"),
              });
              if (xong) (e.target as HTMLFormElement).reset();
            }}
            className="rounded-2xl border border-black/10 bg-white p-5"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
              Thêm kiến thức nền
            </p>
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Tiêu đề</span>
                <input
                  name="topic"
                  required
                  maxLength={200}
                  placeholder="Độ tuổi vàng để học ngoại ngữ"
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                  Tóm tắt một dòng
                </span>
                <input
                  name="summary"
                  maxLength={500}
                  className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Nội dung</span>
                <textarea
                  name="body"
                  required
                  rows={4}
                  maxLength={4000}
                  className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-3 text-sm leading-relaxed"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={dangLuu}
              className="mt-4 cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-50"
            >
              {dangLuu ? "Đang lưu…" : "Thêm mục"}
            </button>
          </form>

          <ul className="flex flex-col gap-3">
            {kienThuc.map((k) => (
              <li key={k.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="flex flex-wrap items-baseline gap-2">
                  <b className="text-[#1A1A1A]">{k.topic}</b>
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      if (!window.confirm(`Xoá mục "${k.topic}"?`)) return;
                      void goi("/api/noi-dung/kien-thuc", "DELETE", { knowledgeId: k.id });
                    }}
                    className="ml-auto cursor-pointer text-xs font-bold text-[#1A1A1A]/50 hover:text-red-600 disabled:opacity-50"
                  >
                    Xoá
                  </button>
                </p>
                {k.summary && (
                  <p className="mt-1 text-sm text-[#1A1A1A]/60">{k.summary}</p>
                )}
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#1A1A1A]/80">
                  {k.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "de" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await goi("/api/noi-dung/de-writing", "PATCH", {
              promptId: de.id,
              topic: f.get("topic"),
              title: f.get("title"),
              prompt: f.get("prompt"),
              published: f.get("published") === "on",
            });
          }}
          className="rounded-2xl border border-black/10 bg-white p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Chủ đề</span>
              <input
                name="topic"
                required
                defaultValue={de.topic}
                maxLength={80}
                className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Tên đề</span>
              <input
                name="title"
                required
                defaultValue={de.title}
                maxLength={200}
                className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Đề bài</span>
            <textarea
              name="prompt"
              required
              rows={5}
              defaultValue={de.prompt}
              maxLength={4000}
              className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-3 text-sm leading-relaxed"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={de.published}
              className="size-4"
            />
            Cho học viên thấy
          </label>
          <button
            type="submit"
            disabled={dangLuu}
            className="mt-4 cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-50"
          >
            {dangLuu ? "Đang lưu…" : "Lưu đề"}
          </button>
          {/*
            Không có nút xoá ở đây. Xoá đề đã có người làm là kết quả cũ hết
            đọc được — tầng ghi chặn, và tắt "cho học viên thấy" là đủ.
          */}
          <p className="mt-3 text-xs text-[#1A1A1A]/60">
            Muốn gỡ đề khỏi trang học sinh thì bỏ tick, đừng xoá — xoá là kết
            quả cũ của các em hết đọc được.
          </p>
        </form>
      )}
    </div>
  );
}
