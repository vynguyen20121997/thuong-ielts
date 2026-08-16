"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Chặn thoát khi đang làm bài.
 *
 * Có ba đường ra khỏi phòng thi, và mỗi đường phải chặn một kiểu — đây là lý
 * do hook này dài hơn một dòng `beforeunload`:
 *
 * 1. **Đóng tab / tải lại / gõ URL khác** — chỉ `beforeunload` chặn được, và
 *    trình duyệt tự vẽ hộp thoại của nó. Không đổi được chữ trong đó; mọi
 *    trình duyệt hiện đại đều bỏ qua chuỗi mình truyền vào.
 * 2. **Bấm link trong trang** (nút quay lại, menu, footer) — `beforeunload`
 *    KHÔNG chạy vì Next chuyển trang bằng JS chứ không tải lại. Phải bắt cú
 *    click ở pha capture, chặn nó lại rồi tự hỏi.
 * 3. **Nút back của trình duyệt** — cũng không kích hoạt `beforeunload`. Đẩy
 *    thêm một mốc vào history rồi nghe `popstate`: back sẽ ăn mất cái mốc đó
 *    thay vì rời trang, mình hỏi xong mới cho đi tiếp.
 *
 * Trả về `pending` = đích đến đang chờ xác nhận; `null` là không có gì chờ.
 */
export function useExitGuard(active: boolean) {
  const [pending, setPending] = useState<string | null>(null);
  /** Đọc trong listener, nên giữ bằng ref để khỏi gắn lại listener mỗi lần đổi. */
  const activeRef = useRef(active);
  activeRef.current = active;
  /** Đã xác nhận rời đi: từ lúc này thôi chặn, để lần điều hướng sau đi thẳng. */
  const leavingRef = useRef(false);

  // (1) Đóng tab / tải lại.
  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      event.preventDefault();
      // Chuỗi trả về không còn được trình duyệt nào hiển thị, nhưng vài trình
      // duyệt cũ vẫn cần một giá trị khác `undefined` mới hiện hộp thoại.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  // (2) Bấm link trong trang.
  useEffect(() => {
    if (!active) return;

    const onClick = (event: MouseEvent) => {
      if (leavingRef.current || !activeRef.current) return;
      // Chuột giữa, Ctrl/Cmd+click… mở tab mới — không rời bài nên kệ.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;

      // Link ra ngoài miền thì để `beforeunload` lo.
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) return;

      const target = href.replace(window.location.origin, "");
      if (target === window.location.pathname) return;

      event.preventDefault();
      setPending(target);
    };

    // Pha capture: chặn trước khi Next kịp nghe cú click và chuyển trang.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);

  // (3) Nút back.
  useEffect(() => {
    if (!active) return;

    // Mốc giả để nút back có cái mà ăn thay vì rời trang ngay.
    window.history.pushState({ examGuard: true }, "");

    const onPopState = () => {
      if (leavingRef.current || !activeRef.current) return;
      // Đẩy lại mốc: nếu học sinh bấm "ở lại" thì lần back sau vẫn còn chặn.
      window.history.pushState({ examGuard: true }, "");
      setPending("back");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [active]);

  const stay = useCallback(() => setPending(null), []);

  const leave = useCallback(() => {
    leavingRef.current = true;
    const target = pending;
    setPending(null);

    if (target === "back") {
      // Lùi hai bước: một cho mốc giả vừa đẩy lại, một cho trang thật.
      window.history.go(-2);
      return;
    }
    if (target) window.location.href = target;
  }, [pending]);

  return { pending, stay, leave };
}
