"use client";

import { useEffect, useState } from "react";

import { usePageReady } from "./PageReady";

/**
 * Màn chờ đầu trang: nền mờ, chữ, ba chấm nhảy. Xong thì ẩn chữ trước, xoá mờ sau.
 *
 * Component này KHÔNG tự quyết định lúc nào là xong — nó hỏi `PageReady`. Lý do
 * nằm ở chú thích trong `PageReady.tsx`: cùng một câu hỏi mà hai nơi tự đoán thì
 * animation vào trang sẽ chạy đằng sau lớp mờ rồi tắt trước khi ai kịp nhìn.
 *
 * `FADE_*` tách hai bước để đúng thứ tự: chữ mờ đi trước, rồi mới tới lớp mờ.
 * Gộp một bước thì chữ và nền cùng tan, mất nhịp.
 *
 * Không có JS thì `<noscript>` bên dưới ẩn hẳn lớp phủ. Thiếu nó, người tắt JS
 * nhận một trang mờ không bao giờ sáng lại — nội dung vẫn nằm trong HTML nhưng bị
 * che, tức là tự tay làm hỏng trang cho nhóm người dùng đó.
 */
const FADE_TEXT_MS = 280;
const FADE_VEIL_MS = 460;

type Phase = "loading" | "text-out" | "veil-out" | "gone";

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>("loading");
  const ready = usePageReady();

  useEffect(() => {
    if (ready) setPhase((p) => (p === "loading" ? "text-out" : p));
  }, [ready]);

  // Bước 2: chữ tan xong mới tới lượt lớp mờ, rồi tháo hẳn khỏi cây DOM.
  useEffect(() => {
    if (phase === "text-out") {
      const t = window.setTimeout(() => setPhase("veil-out"), FADE_TEXT_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "veil-out") {
      const t = window.setTimeout(() => setPhase("gone"), FADE_VEIL_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  // Khoá cuộn do script inline trong `layout.tsx` gắn từ lúc parse; ở đây chỉ nhả
  // sớm hơn cái hẹn 8s của nó. Nhả ngay khi lớp mờ bắt đầu tan, không đợi tan
  // hẳn: nửa giây nhìn thấy trang mà lăn chuột không nhúch là đủ để tưởng trang treo.
  useEffect(() => {
    if (phase !== "veil-out" && phase !== "gone") return;
    document.documentElement.classList.remove("site-loading");
  }, [phase]);

  // Lưới cuối: component bị tháo vì bất kỳ lý do gì thì cũng phải trả lại cuộn.
  useEffect(() => () => {
    document.documentElement.classList.remove("site-loading");
  }, []);

  if (phase === "gone") return null;

  const veilGone = phase === "veil-out";
  const textGone = phase === "text-out" || veilGone;

  return (
    <>
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: ".site-loader{display:none!important}",
          }}
        />
      </noscript>

      <div
        aria-hidden
        className={`site-loader fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-xl transition-opacity ease-out ${
          veilGone ? "opacity-0" : "opacity-100"
        }`}
        style={{ transitionDuration: `${FADE_VEIL_MS}ms` }}
      >
        <div
          className={`flex flex-col items-center gap-6 transition-opacity ease-out ${
            textGone ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${FADE_TEXT_MS}ms` }}
        >
          <span className="text-3xl font-bold uppercase tracking-[0.35em] text-brand md:text-4xl">
            {/* Lề trái bù cho khoảng giãn chữ thừa ra sau chữ S, nếu không khối
                chữ lệch trái so với hàng chấm bên dưới. */}
            <span className="ml-[0.35em]">THƯƠNG IELTS</span>
          </span>

          <span className="flex items-end gap-2.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="site-loader-dot h-2.5 w-2.5 rounded-full bg-leaf"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </span>
        </div>
      </div>
    </>
  );
}
