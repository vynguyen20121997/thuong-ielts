"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Một nguồn sự thật cho câu hỏi "trang đã dựng xong chưa".
 *
 * Hai thứ cùng phụ thuộc vào câu trả lời đó, và trước đây chúng tự đoán riêng:
 *
 * 1. Màn chờ — che tới khi nào thì bỏ.
 * 2. Animation vào trang — Hero và mọi `Reveal` bắt đầu lúc nào.
 *
 * Để chúng tự đoán là hỏng: animation khởi động ngay khi mount, tức là chạy
 * **đằng sau lớp mờ**. Xong màn chờ thì chúng đã diễn hết, khách nhìn vào một
 * trang đứng im và không bao giờ thấy cái entrance mà mình bỏ công viết.
 *
 * Bản đầu còn chờ sự kiện `load` của window. Sai chỗ khác: `load` đợi **mọi**
 * ảnh, kể cả ảnh dưới đáy trang chưa ai cuộn tới. Trang dựng được rồi vẫn bị
 * che thêm vài giây vì một tấm ảnh ở footer. Giờ chỉ chờ đúng hai thứ cần để
 * DỰNG được trang:
 *
 * - **Font** — chữ đổi font sau khi hiện là cả trang nhảy một cái.
 * - **Dữ liệu trên màn đầu** — component nào cần API mới vẽ đúng thì tự giữ
 *   chỗ bằng `useHoldPageReady`. Trang chủ là Hero (`/api/hero`). Những khối
 *   dưới màn đầu (cảm nhận, đánh giá) KHÔNG giữ: chúng nằm ngoài tầm mắt, chờ
 *   chúng là chờ thừa.
 *
 * `MAX_MS` là lưới đỡ trong JS. Trần thật vẫn nằm ở animation `.site-loader`
 * trong `globals.css` — CSS chạy cả khi bundle chưa tới.
 */

const MIN_MS = 500;
const MAX_MS = 2800;

type PageReadyValue = {
  /** Trang đã được phép hiện và chạy animation chưa. */
  ready: boolean;
  /** Giữ màn chờ lại; gọi hàm trả về để nhả. */
  hold: () => () => void;
};

const PageReadyContext = createContext<PageReadyValue>({
  // Mặc định `true` cho trường hợp component nằm ngoài provider (test, storybook,
  // trang không bọc ClientShell): thà chạy animation ngay còn hơn đứng im mãi.
  ready: true,
  hold: () => () => {},
});

export function PageReadyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [holds, setHolds] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const startedAt = useRef<number | null>(null);
  if (startedAt.current === null) startedAt.current = Date.now();

  const hold = useCallback(() => {
    setHolds((n) => n + 1);
    let released = false;
    return () => {
      if (released) return; // nhả hai lần thì bộ đếm âm và màn chờ không bao giờ tắt
      released = true;
      setHolds((n) => n - 1);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    // `document.fonts.ready` không bao giờ reject; vẫn phòng trình duyệt cũ.
    document.fonts?.ready
      .then(() => alive && setFontsReady(true))
      .catch(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), MAX_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready || holds > 0 || !fontsReady) return;
    // Sàn thời gian: trang nhẹ và đã cache thì mọi thứ xong gần như tức thì,
    // màn chờ chớp một cái rồi biến, nhìn như lỗi render chứ không như đang tải.
    const rest = Math.max(0, MIN_MS - (Date.now() - (startedAt.current ?? 0)));
    const t = window.setTimeout(() => setReady(true), rest);
    return () => window.clearTimeout(t);
  }, [ready, holds, fontsReady]);

  const value = useMemo(() => ({ ready, hold }), [ready, hold]);

  return <PageReadyContext.Provider value={value}>{children}</PageReadyContext.Provider>;
}

/** Đọc trạng thái — dùng để hoãn animation cho tới khi khách thật sự nhìn thấy. */
export function usePageReady() {
  return useContext(PageReadyContext).ready;
}

/**
 * Giữ màn chờ trong lúc `active` còn true. Chỉ dùng cho dữ liệu của MÀN ĐẦU;
 * giữ vì một khối dưới đáy trang là bắt cả trang chờ một thứ không ai đang nhìn.
 */
export function useHoldPageReady(active: boolean) {
  const { hold } = useContext(PageReadyContext);
  useEffect(() => {
    if (!active) return;
    return hold();
  }, [active, hold]);
}
