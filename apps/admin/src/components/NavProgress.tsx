"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thanh tiến trình mảnh trên đỉnh trang trong lúc chuyển trang.
 *
 * App Router giữ nguyên trang cũ trong lúc lấy trang mới (các trang admin đều
 * truy vấn DB AWS, mất vài trăm ms tới vài giây), nên bấm menu là màn hình
 * đứng im — cô không biết đã ăn cú bấm chưa. Cùng cách bắt với
 * `NavigationBusy` bên web: nghe click ở pha capture trên `document`, tắt khi
 * `pathname`/`searchParams` đổi. Khác bên web ở chỗ KHÔNG chặn thao tác: admin
 * là nơi làm việc, không cần lớp phủ.
 *
 * Hiện sau 120ms để điều hướng nhanh không nháy; tự tắt sau 10 giây phòng khi
 * cú bấm không dẫn tới điều hướng nào.
 */

const SHOW_AFTER_MS = 120;
const FAILSAFE_MS = 10000;

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (event.defaultPrevented) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || /^(mailto:|tel:|#)/i.test(href)) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return !(url.pathname === window.location.pathname && url.search === window.location.search);
}

export default function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (anchor && isInternalNavigation(anchor, event)) setPending(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }
    const show = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    const failsafe = window.setTimeout(() => setPending(false), FAILSAFE_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(failsafe);
    };
  }, [pending]);

  if (!visible) return null;
  return (
    <div
      role="progressbar"
      aria-label="Đang mở trang"
      className="fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-[#14532D]/15"
    >
      <div className="admin-nav-progress h-full w-1/3 bg-[#14532D]" />
    </div>
  );
}
