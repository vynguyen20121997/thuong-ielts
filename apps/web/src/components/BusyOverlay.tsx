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

export default function BusyOverlay({
  open,
  label,
  hint,
}: {
  open: boolean;
  /** Việc đang chạy, thì hiện tại: "Đang chấm bài…". Đây là phần được đọc lên. */
  label: string;
  /** Một câu dặn thêm, ví dụ đừng tắt trình duyệt. */
  hint?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Vào có trễ, ra có sàn. Hai nhánh dùng chung một `timer` nên đóng/mở liên
  // tiếp không chồng hẹn giờ lên nhau.
  useEffect(() => {
    let timer = 0;

    if (open) {
      if (visible) return;
      timer = window.setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
    } else if (visible) {
      const left = MIN_VISIBLE_MS - (Date.now() - shownAt.current);
      if (left <= 0) setVisible(false);
      else timer = window.setTimeout(() => setVisible(false), left);
    }

    return () => window.clearTimeout(timer);
  }, [open, visible]);

  useEffect(() => {
    if (!visible) return;
    const box = boxRef.current;
    if (!box) return;

    // Kéo focus ra khỏi ô đáp án đang gõ. Không có bước này thì con trỏ vẫn nằm
    // trong input bị che, gõ tiếp vẫn vào — đúng cái lớp phủ này muốn ngăn.
    const previous = document.activeElement as HTMLElement | null;
    box.focus();

    // Tab/Escape không đi đâu cả: sau lớp phủ không còn gì để thao tác, và
    // Escape ở đây mà đóng được thì hoá ra lớp phủ chỉ là trang trí.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key === "Escape") {
        event.preventDefault();
        box.focus();
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
      if (previous?.isConnected) previous.focus();
    };
  }, [visible]);

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
      className="fixed inset-0 z-[120] flex items-center justify-center overscroll-contain bg-brand-deep/45 px-4 backdrop-blur-sm focus:outline-none"
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
        {hint && <p className="text-2xs leading-relaxed text-ink/50">{hint}</p>}
      </div>
    </div>,
    document.body,
  );
}
