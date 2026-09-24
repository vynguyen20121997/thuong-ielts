"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Lớp phủ toàn trang có spinner, dùng cho thao tác **không huỷ được**: nộp bài
 * chấm điểm. Khác hẳn `LoadingScreen` — cái kia chỉ che lúc vào site và cố ý
 * `pointer-events-none`; cái này sinh ra để CHẶN.
 *
 * ## Vì sao phải chặn
 *
 * Nộp bài là một cú POST rồi hết lượt. Trong lúc chờ, nút "Nộp bài" đã
 * `disabled` nhưng phần còn lại của phòng thi thì không: vẫn gõ được vào ô đáp
 * án, vẫn chuyển passage, vẫn bấm được "Thoát". Những thao tác đó không đi vào
 * đâu cả vì payload đã chốt ở `answersRef.current` lúc gọi — học sinh gõ thêm
 * một câu rồi thấy kết quả không có câu đó thì không hiểu tại sao. Che lại là
 * cách nói thật: lúc này bài đã rời khỏi tay bạn.
 *
 * ## Hai cái hẹn giờ, và vì sao cần cả hai
 *
 * `SHOW_DELAY_MS`: mạng nhà cô thường trả trong ~120ms. Bật lớp phủ ngay thì
 * mỗi lần nộp là một cú nháy trắng — nhìn như lỗi. Chờ một nhịp rồi mới hiện,
 * nên đường mạng tốt sẽ không bao giờ thấy lớp phủ này.
 *
 * `MIN_VISIBLE_MS`: đã hiện rồi thì phải ở lại đủ lâu để mắt kịp nhận ra có
 * chuyện gì đang xảy ra. Hiện 40ms rồi tắt còn tệ hơn không hiện.
 *
 * ## `data-exam`
 *
 * Portal ra `document.body` để không dính `transform`/`overflow` của cây cha.
 * Nhưng trang thi Listening bật `body.exam-mode`, mà luật trong `globals.css`
 * là `body.exam-mode > *:not([data-exam]) { display: none }` — thiếu thuộc
 * tính này thì lớp phủ portal ra body sẽ bị ẩn sạch, đúng ở màn cần nó nhất.
 */

const SHOW_DELAY_MS = 180;
const MIN_VISIBLE_MS = 450;
/* Thời gian tan. Đủ để mắt thấy là "mờ dần", chưa đủ để thành một bước chờ. */
const FADE_OUT_MS = 160;

export default function BusyOverlay({
  open,
  label,
  hint,
  holdMs = MIN_VISIBLE_MS,
}: {
  open: boolean;
  /** Việc đang chạy, thì hiện tại: "Đang chấm bài…". Đây là phần được đọc lên. */
  label: string;
  /** Một câu dặn thêm, ví dụ đừng tắt trình duyệt. */
  hint?: string;
  /**
   * Đã hiện rồi thì ở lại ít nhất bấy nhiêu mili giây.
   *
   * Mặc định 450ms cho các thao tác KHÔNG đổi màn hình (nộp bài, đăng nhập):
   * ở đó, sau lớp phủ vẫn là trang cũ, nên giữ lâu một chút chỉ có lợi.
   *
   * Nhưng chuyển trang thì phải truyền `0`. Trang mới chạy animation vào ngay
   * khi route commit; giữ lớp phủ thêm 450ms là animation ấy chạy hết đằng sau
   * lớp mờ, tới lúc lớp mờ tan thì mọi thứ đã nằm yên vị — nhìn ra thành một cú
   * giật, đúng nguyên văn cái bẫy đã chép trong `PageReady.tsx`.
   */
  holdMs?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  /* Đang tan: vẫn còn trong cây để chạy hết transition, nhưng thôi chặn. */
  const [leaving, setLeaving] = useState(false);
  const shownAt = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Vào có trễ, ra có sàn. Hai nhánh dùng chung một `timer` nên đóng/mở liên
  // tiếp không chồng hẹn giờ lên nhau.
  useEffect(() => {
    let timer = 0;

    if (open) {
      if (visible) {
        // Quay lại bận trong lúc đang tan: bỏ dở cú tan, đừng dựng lại từ đầu.
        setLeaving(false);
        return;
      }
      timer = window.setTimeout(() => {
        shownAt.current = Date.now();
        setLeaving(false);
        setVisible(true);
      }, SHOW_DELAY_MS);
    } else if (visible && !leaving) {
      const left = holdMs - (Date.now() - shownAt.current);
      if (left <= 0) setLeaving(true);
      else timer = window.setTimeout(() => setLeaving(true), left);
    }

    return () => window.clearTimeout(timer);
  }, [open, visible, leaving, holdMs]);

  /* Tan xong mới rời khỏi cây. */
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, FADE_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    if (!visible || leaving) return;
    const box = boxRef.current;
    if (!box) return;

    // Kéo focus ra khỏi ô đáp án đang gõ. Không có bước này thì con trỏ vẫn nằm
    // trong input bị che, gõ tiếp vẫn vào — đúng cái lớp phủ này muốn ngăn.
    const previous = document.activeElement as HTMLElement | null;
    // `preventScroll` ở cả hai đầu: `focus()` mặc định cuộn phần tử vào tầm
    // nhìn, mà ở đây là giành quyền cuộn với Lenis đúng lúc trang mới đang vào.
    box.focus({ preventScroll: true });

    // Tab/Escape không đi đâu cả: sau lớp phủ không còn gì để thao tác, và
    // Escape ở đây mà đóng được thì hoá ra lớp phủ chỉ là trang trí.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key === "Escape") {
        event.preventDefault();
        box.focus({ preventScroll: true });
      }
    };

    // Phải là listener gốc với `passive: false`. React gắn `wheel`/`touchmove`
    // ở root dưới dạng passive, nên `onWheel` của React gọi `preventDefault()`
    // sẽ bị trình duyệt bỏ qua — trang vẫn trôi sau lớp mờ, nhìn như hỏng.
    //
    // Cố ý KHÔNG khoá bằng `body { overflow: hidden }`: site chạy Lenis, khoá
    // kiểu đó là giành quyền cuộn với nó, và mỗi lần mở/đóng trang lại nhảy về
    // đầu. Chặn ngay tại lớp phủ thì Lenis không bao giờ nhận được sự kiện.
    const stop = (event: Event) => event.preventDefault();

    document.addEventListener("keydown", onKey, true);
    box.addEventListener("wheel", stop, { passive: false });
    box.addEventListener("touchmove", stop, { passive: false });

    return () => {
      document.removeEventListener("keydown", onKey, true);
      box.removeEventListener("wheel", stop);
      box.removeEventListener("touchmove", stop);
      // Trả focus về chỗ cũ, trừ khi trong lúc chờ nó đã bị gỡ khỏi cây (nộp
      // xong là cả phòng thi được thay bằng bảng kết quả).
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [visible, leaving]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      ref={boxRef}
      data-exam
      tabIndex={-1}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={label}
      /*
        Đang tan thì `pointer-events-none`: nếu còn ăn cú bấm trong lúc đã mờ đi
        thì người dùng bấm vào trang mới mà không có gì xảy ra — khó chịu hơn hẳn
        so với lúc nó còn đục và rõ ràng là đang chặn.

        Chỉ animate `opacity` (và `backdrop-filter` tắt theo nó). Gỡ thẳng phần
        tử ra khỏi cây là nền mờ biến mất trong đúng một frame, mắt đọc ra thành
        một cú giật giữa lúc trang mới đang chạy animation vào.
      */
      className={`fixed inset-0 z-[120] flex items-center justify-center overscroll-contain bg-brand-deep/45 px-4 transition-opacity duration-150 ease-out focus:outline-none ${
        leaving
          ? // Bỏ `backdrop-blur` ngay khi bắt đầu tan, không chờ tan xong.
            // `backdrop-filter` bắt trình duyệt làm mờ lại toàn bộ nội dung phía
            // sau MỖI khung hình — mà đúng lúc này nội dung phía sau là trang mới
            // đang chạy animation vào, tức là khung nào cũng khác khung nào.
            "pointer-events-none opacity-0"
          : "opacity-100 backdrop-blur-sm"
      }`}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-white px-7 py-8 text-center shadow-xl">
        <span
          aria-hidden
          // `motion-reduce` bỏ vòng xoay chứ không bỏ chỉ báo: nhãn dưới đây mới
          // là thứ mang nghĩa, spinner chỉ là hình.
          className="h-10 w-10 rounded-full border-[3px] border-brand/15 border-t-brand animate-spin motion-reduce:animate-none"
        />
        {/* `aria-live` nằm ở đây, không ở thẻ ngoài: thẻ ngoài mang `aria-label`
            nên trình đọc màn hình đã đọc một lần lúc lớp phủ hiện ra. */}
        <p className="text-sm font-semibold text-ink" aria-live="polite">
          {label}
        </p>
        {hint && <p className="text-2xs leading-relaxed text-ink/65">{hint}</p>}
      </div>
    </div>,
    document.body,
  );
}
