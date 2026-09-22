"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import BusyOverlay from "./BusyOverlay";

/**
 * Lớp phủ trong lúc chuyển trang.
 *
 * Vì sao cần: App Router giữ nguyên trang cũ trong lúc đi lấy trang mới. Bấm
 * "Kiểm tra nền tảng IELTS" trên header là màn hình đứng im vài trăm mili giây
 * tới vài giây — không có gì báo là đã ăn cú bấm. Học sinh bấm lại lần hai, và
 * lần hai đó huỷ lần đầu rồi bắt đầu lại từ đầu.
 *
 * `BusyOverlay` chỉ hiện sau 180ms nên điều hướng nhanh (trang đã prefetch) sẽ
 * không thấy gì cả — đúng ý: lớp phủ chỉ xuất hiện khi thật sự có chờ.
 *
 * ## Bắt bằng click, không bằng router event
 *
 * Next không cho nghe "navigation bắt đầu". Có `useLinkStatus()` nhưng nó chỉ
 * nói về đúng một `<Link>` bọc quanh nó, tức là phải sửa mọi link trong site.
 * Nghe click ở pha capture trên `document` thì một chỗ lo hết, kể cả link nằm
 * trong Header, Footer hay giữa bài viết.
 *
 * ## Tắt bằng `pathname` + `searchParams`
 *
 * Hai giá trị này chỉ đổi khi route MỚI đã commit, nên lớp phủ tan đúng lúc nội
 * dung mới bắt đầu vẽ. Với route có `loading.tsx` thì skeleton tiếp quản ngay
 * sau đó — lớp phủ lo đoạn "chưa có gì để vẽ", skeleton lo đoạn "đang vẽ".
 *
 * ## Vì sao KHÔNG hỏi `event.defaultPrevented`
 *
 * Đã thử và sai hẳn. Ý tưởng là "đợi một nhịp rồi xem cú bấm có bị huỷ không",
 * nhưng đo ra thì `<Link>` của Next **luôn** gọi `preventDefault()` — đó chính
 * là cách nó chuyển trang bằng JS thay vì để trình duyệt tải lại. Sau một
 * macrotask, link bình thường và link bị chặn trông y hệt nhau (`true` cả hai),
 * nên bộ lọc đó bịt luôn mọi điều hướng thật: không link nào hiện lớp phủ nữa.
 *
 * Nên chỗ duy nhất huỷ điều hướng thật sự — `useExitGuard` trong phòng thi —
 * phải tự nói ra bằng `NAV_CANCELLED`. Rõ ràng hơn đoán, và ai thêm một chỗ
 * chặn điều hướng mới sẽ thấy ngay là phải bắn sự kiện này.
 *
 * ## Cái chốt quan trọng nhất: hết giờ thì tự nhả
 *
 * Lớp phủ này CHẶN thao tác. Một cú bấm không dẫn tới điều hướng nào (link bị
 * `preventDefault`, route trùng chính nó, lỗi mạng giữa đường) mà không có
 * `FAILSAFE_MS` thì cả trang chết cứng, và người dùng không còn cách nào thoát
 * ngoài tải lại. Thà nhả sớm một lớp phủ còn đúng hơn là khoá nhầm cả trang.
 */

const FAILSAFE_MS = 8000;

/**
 * Bắn ra khi một cú bấm link bị chặn lại thay vì cho đi (hiện chỉ có
 * `useExitGuard`). Không có tín hiệu này thì lớp phủ đứng chặn tới
 * `FAILSAFE_MS`, che mất đúng cái hộp thoại vừa hỏi.
 */
export const NAV_CANCELLED = "nav:cancelled";

/** Link nào là "đi sang trang khác trong site này". */
function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  // Chuột giữa / Ctrl / Cmd / Shift = mở tab mới: trang hiện tại không đi đâu cả.
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (event.defaultPrevented) return false;

  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href) return false;
  // `mailto:`, `tel:`, và link neo trong trang — Lenis lo phần neo.
  if (/^(mailto:|tel:|#)/i.test(href)) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  // Cùng đường dẫn, chỉ khác `#`: không có điều hướng nào xảy ra.
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }

  return true;
}

export default function NavigationBusy() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as
        | HTMLAnchorElement
        | null;
      if (!anchor) return;
      if (!isInternalNavigation(anchor, event)) return;
      setPending(true);
    };

    // Pha capture vì hai lẽ: chạy trước khi `<Link>` kịp `preventDefault()` (lúc
    // đó `defaultPrevented` còn nói đúng sự thật), và không bị một handler giữa
    // đường gọi `stopPropagation()` cắt mất.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* Có chỗ vừa chặn một cú bấm — thôi chờ, đừng che hộp thoại của họ. */
  useEffect(() => {
    const onCancelled = () => setPending(false);
    window.addEventListener(NAV_CANCELLED, onCancelled);
    return () => window.removeEventListener(NAV_CANCELLED, onCancelled);
  }, []);

  /* Route mới đã commit — thôi chờ. */
  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  /* Quay lại từ bfcache: trang dựng lại nguyên trạng, kể cả lớp phủ đang chặn. */
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setPending(false), FAILSAFE_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  /*
    `holdMs={0}`: route vừa commit là trang mới bắt đầu chạy animation vào ngay.
    Giữ lớp phủ thêm nửa giây nữa thì animation ấy diễn ra hết sau lớp mờ, tới
    lúc mờ tan thì trang đã nằm yên — nhìn thành một cú giật thay vì một cú vào
    trang. Đây đúng là bài học đã chép sẵn trong `PageReady.tsx`.
  */
  return <BusyOverlay open={pending} label="Đang mở trang…" holdMs={0} />;
}
