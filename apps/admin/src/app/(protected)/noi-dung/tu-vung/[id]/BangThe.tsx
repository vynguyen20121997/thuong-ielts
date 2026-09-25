"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { The } from "../../../../../lib/noiDungKieu";

/**
 * Soạn thẻ.
 *
 * Một hàng nhập nằm NGAY TRÊN bảng, không phải một hộp thoại. Cô nhập từ vựng
 * theo mạch — gõ từ, Tab, gõ nghĩa, Enter, gõ tiếp từ sau — nên mỗi lần mở và
 * đóng một hộp thoại là một lần cắt mạch đó.
 *
 * Sau mỗi lần lưu gọi `router.refresh()`: server đọc lại DB rồi vẽ lại. Giữ
 * một bản sao trong state và tự sửa cho nhanh là mở đường cho ngày màn hình
 * nói một đằng còn DB một nẻo.
 */
export default function BangThe({
  boId,
  suaDuoc,
  giaoCaLop,
  the,
}: {
  boId: string;
  suaDuoc: boolean;
  giaoCaLop: boolean;
  the: The[];
}) {
  const router = useRouter();
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const dangLuuRef = useRef(false);
  const oTu = useRef<HTMLInputElement>(null);

  async function goi(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    duongDan = "/api/noi-dung/the",
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

  const thieuNghia = the.filter((t) => !t.vietnamese.trim()).length;

  return (
    <div className="flex flex-col gap-5">
      {loi && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {loi}
        </p>
      )}

      {/*
        CÔNG TẮC QUAN TRỌNG NHẤT của trang này.

        Bộ chưa giao thì học viên không thấy một thẻ nào — `ensureReviews` bên
        web chỉ lấy thẻ từ bộ đã giao. Soạn xong mà quên bật là soạn cho không
        ai đọc, nên nó phải nằm trên cùng và nói rõ trạng thái bằng chữ, không
        phải bằng một cái nút xám.
      */}
      {suaDuoc && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4 ${
            giaoCaLop
              ? "border-[#14532D]/25 bg-[#14532D]/[0.04]"
              : "border-[#B45309]/30 bg-[#FFFBEB]"
          }`}
        >
          <span className="text-sm font-bold text-[#1A1A1A]">
            {giaoCaLop
              ? "Đã giao cho cả lớp — học viên thấy bộ này"
              : "Chưa giao — học viên chưa thấy thẻ nào"}
          </span>
          <button
            type="button"
            disabled={dangLuu}
            onClick={() => {
              if (
                giaoCaLop &&
                !window.confirm(
                  "Thu bộ này lại? Học viên sẽ không thấy thẻ mới nữa. Lịch ôn các em đã tích luỹ vẫn giữ nguyên, giao lại là học tiếp từ chỗ đang dở.",
                )
              )
                return;
              void goi(
                "PATCH",
                { deckId: boId, giaoCaLop: !giaoCaLop },
                "/api/noi-dung/bo-the",
              );
            }}
            className={`ml-auto cursor-pointer rounded-full px-5 py-2 text-sm font-bold disabled:opacity-50 ${
              giaoCaLop
                ? "border border-black/15 text-[#1A1A1A]/70"
                : "bg-[#14532D] text-white hover:bg-[#052E16]"
            }`}
          >
            {giaoCaLop ? "Thu lại" : "Giao cho cả lớp"}
          </button>
        </div>
      )}

      {suaDuoc && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const xong = await goi("POST", {
              deckId: boId,
              word: f.get("word"),
              ipa: f.get("ipa"),
              vietnamese: f.get("vietnamese"),
              examples: f.get("examples"),
            });
            if (xong) {
              (e.target as HTMLFormElement).reset();
              /* Con trỏ về ô từ để cô gõ tiếp, không phải với chuột. */
              oTu.current?.focus();
            }
          }}
          className="rounded-2xl border border-black/10 bg-white p-5"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
            Thêm thẻ
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">Từ</span>
              <input
                ref={oTu}
                name="word"
                required
                maxLength={120}
                autoFocus
                placeholder="scrutiny"
                className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                Phiên âm
              </span>
              <input
                name="ipa"
                maxLength={120}
                placeholder="/ˈskruːtəni/"
                className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 font-mono text-sm"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                Nghĩa tiếng Việt
              </span>
              <input
                name="vietnamese"
                maxLength={300}
                placeholder="sự xem xét kỹ lưỡng"
                className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block lg:col-span-4">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                Câu ví dụ — mỗi dòng một câu, tối đa 3
              </span>
              <textarea
                name="examples"
                rows={2}
                className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
                placeholder="The policy came under intense scrutiny from the press."
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={dangLuu}
              className="cursor-pointer rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16] disabled:opacity-50"
            >
              {dangLuu ? "Đang lưu…" : "Thêm thẻ"}
            </button>
            {/*
              Nói thẳng luật: thẻ chưa có nghĩa đứng ngoài lịch ôn. Không chặn,
              vì cô hay nhập một loạt từ trước rồi điền nghĩa sau.
            */}
            <span className="text-xs text-[#1A1A1A]/60">
              Để trống nghĩa cũng lưu được, nhưng thẻ đó chưa vào lịch ôn của
              học viên.
            </span>
          </div>
        </form>
      )}

      {thieuNghia > 0 && (
        <p className="rounded-xl bg-[#FFFBEB] px-4 py-3 text-sm font-semibold text-[#B45309]">
          {thieuNghia} thẻ chưa có nghĩa — chúng chưa vào lịch ôn. Điền nghĩa là
          học viên thấy ngay.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-[#1A1A1A]/60">
              <th className="px-4 py-3 font-bold">Từ</th>
              <th className="px-4 py-3 font-bold">Phiên âm</th>
              <th className="px-4 py-3 font-bold">Nghĩa</th>
              <th className="px-4 py-3 font-bold">Ví dụ</th>
              {suaDuoc && <th className="px-4 py-3 font-bold" />}
            </tr>
          </thead>
          <tbody>
            {the.length === 0 && (
              <tr>
                <td
                  colSpan={suaDuoc ? 5 : 4}
                  className="px-4 py-10 text-center text-[#1A1A1A]/60"
                >
                  Bộ này chưa có thẻ nào.
                </td>
              </tr>
            )}
            {the.map((t) => (
              <tr key={t.id} className="border-b border-black/5">
                <td className="px-4 py-3">
                  <b className="text-[#1A1A1A]">{t.word}</b>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#1A1A1A]/70">
                  {t.ipa || "—"}
                </td>
                <td className="px-4 py-3">
                  {t.vietnamese ? (
                    t.vietnamese
                  ) : (
                    <span className="font-semibold text-[#B45309]">
                      chưa có nghĩa
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[#1A1A1A]/60">
                  {t.examples.length ? `${t.examples.length} câu` : "—"}
                </td>
                {suaDuoc && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={dangLuu}
                      onClick={() => {
                        const nghia = window.prompt(
                          `Nghĩa tiếng Việt của "${t.word}":`,
                          t.vietnamese,
                        );
                        if (nghia === null) return;
                        void goi("PATCH", { cardId: t.id, vietnamese: nghia });
                      }}
                      className="cursor-pointer text-xs font-bold text-[#14532D] hover:underline disabled:opacity-50"
                    >
                      Sửa nghĩa
                    </button>
                    <button
                      type="button"
                      disabled={dangLuu}
                      onClick={() => {
                        const canhBao = t.daCoNguoiOn
                          ? `Thẻ "${t.word}" đã có học viên ôn — xoá là mất lịch ôn của thẻ này.\n\nVẫn xoá?`
                          : `Xoá thẻ "${t.word}"?`;
                        if (!window.confirm(canhBao)) return;
                        void goi("DELETE", { cardId: t.id });
                      }}
                      className="ml-3 cursor-pointer text-xs font-bold text-[#1A1A1A]/50 hover:text-red-600 disabled:opacity-50"
                    >
                      Xoá
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
