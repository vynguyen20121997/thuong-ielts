"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Hộp cảnh báo trước khi rời bài đang làm.
 *
 * Nói thẳng cái mất: bài chưa nộp thì không được chấm, và những gì đã điền
 * mất hết. Nút "ở lại" là nút được focus sẵn — thoát giữa chừng là việc hiếm
 * và tốn kém, nên mặc định phải nghiêng về phía an toàn.
 */
export default function ExitWarningDialog({
  open,
  onStay,
  onLeave,
  detail,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  /** Câu mô tả thiệt hại, khác nhau giữa Reading và Listening. */
  detail: string;
}) {
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    stayRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onStay]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-warning-title"
      // Bấm ra nền là ở lại — hành vi ít hại hơn, đúng với mặc định an toàn.
      onClick={onStay}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 md:p-7 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle size={17} />
          </span>
          <div>
            <h2
              id="exit-warning-title"
              className="font-serif text-lg font-bold text-[#1A1A1A] leading-snug"
            >
              Thoát khỏi bài đang làm?
            </h2>
            <p className="mt-2 text-sm text-[#1A1A1A]/70 leading-relaxed">{detail}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onLeave}
            className="rounded-full border border-black/10 px-5 py-2.5 text-xs font-semibold text-[#1A1A1A]/60 hover:border-red-300 hover:text-red-600 cursor-pointer transition-colors"
          >
            Thoát, bỏ bài này
          </button>
          <button
            ref={stayRef}
            type="button"
            onClick={onStay}
            className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-xs font-semibold text-white cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D]/40"
          >
            Ở lại làm tiếp
          </button>
        </div>
      </div>
    </div>
  );
}
