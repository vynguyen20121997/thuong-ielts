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
 * Ba thứ được chờ:
 *
 * - **Font** — chữ đổi font sau khi hiện là cả trang nhảy một cái.
 * - **Dữ liệu trên màn đầu** — component nào cần API mới vẽ đúng thì tự giữ
 *   chỗ bằng `useHoldPageReady`. Trang chủ là Hero (`/api/hero`). Những khối
 *   dưới màn đầu (cảm nhận, đánh giá) KHÔNG giữ: chúng nằm ngoài tầm mắt, chờ
 *   chúng là chờ thừa.
 * - **Ảnh — TẤT CẢ, kể cả ảnh dưới đáy trang.** Xem `waitForImages` bên dưới.
 *
 * Về ảnh: bản đầu chờ sự kiện `load` của window rồi bỏ, vì `load` giữ màn chờ
 * lại chỉ vì một tấm ảnh ở footer. Rồi bỏ chờ ảnh hẳn. Nay chờ lại, nhưng theo
 * yêu cầu là chờ **cho bằng hết** — và `load` vẫn không làm được việc đó: đo
 * trên trang chủ thì `load` bắn ở 371ms trong khi 21/26 ảnh còn chưa tải, vì
 * 22 ảnh mang `loading="lazy"` nên trình duyệt chưa thèm đụng tới. Muốn có đủ
 * ảnh thì phải tự đi ép tải, `load` chỉ là mốc bắt đầu.
 *
 * Đánh đổi phải biết trước: màn chờ giờ dài bằng tấm ảnh chậm nhất của trang,
 * không phải bằng lúc trang dựng xong. Mạng chậm thì `MAX_MS` là thứ cứu, và
 * ảnh nào chưa về kịp sẽ hiện dần sau khi màn chờ đã bỏ.
 *
 * `MAX_MS` là lưới đỡ trong JS. Trần thật vẫn nằm ở animation `.site-loader`
 * trong `globals.css` — CSS chạy cả khi bundle chưa tới.
 */

const MIN_MS = 500;
/**
 * Nới từ 2800 lên 7000 khi bắt đầu chờ hết ảnh: giữ 2800 thì phần lớn lượt tải
 * bị cắt ngang giữa chừng, tức là vẫn hiện trang khi ảnh chưa đủ — chờ mà như
 * không chờ. Vẫn phải NHỎ HƠN 8s của `.site-loader` và của khoá cuộn trong
 * `layout.tsx`, để đường JS (có cú bay của chữ) luôn chạy trước lưới CSS.
 */
const MAX_MS = 7000;
/** Nhịp quét lại: bắt ảnh mới do fetch xong hoặc do React vừa vẽ thêm. */
const IMAGE_POLL_MS = 120;

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

/**
 * Chờ mọi ảnh của trang tải xong: `<img>` (kể cả `loading="lazy"`, kể cả ảnh
 * chưa ai cuộn tới) và `background-image` trong CSS.
 *
 * Ba chỗ dễ sai, nên ghi lại:
 *
 * 1. **Ảnh lazy phải được ép tải.** Đổi `loading` sang `"eager"` là đủ để trình
 *    duyệt bắt đầu tải ngay, và làm vậy an toàn hơn đọc `src` ra rồi tự tải
 *    bằng `new Image()`: `srcset`/`sizes` sẽ chọn đúng bản mà chính thẻ đó cần,
 *    không phải mình đoán.
 * 2. **Ảnh xuất hiện muộn.** Chân dung Hero tới sau `/api/hero`, thẻ cảm nhận
 *    tới sau fetch của nó. Nên phải quét lại theo nhịp chứ không chụp một lần
 *    danh sách ảnh lúc mount.
 * 3. **Lỗi tải cũng là xong.** `error` phải kết thúc chờ y như `load`, không thì
 *    một ảnh 404 giữ màn chờ tới tận `MAX_MS`.
 *
 * Điều kiện dừng là hai lần quét liên tiếp không còn gì để chờ — một lần thì
 * trúng đúng khoảnh khắc React vừa tháo ảnh cũ chưa gắn ảnh mới.
 */
function waitForImages(onDone: () => void): () => void {
  let alive = true;
  let timer = 0;
  let quietRounds = 0;
  const seen = new WeakSet<Element>();
  // Phần tử đã soi `background-image` rồi thì không soi lại: `getComputedStyle`
  // trên cả cây, 120ms một lần, là bắt trình duyệt tính lại style liên tục.
  const bgChecked = new WeakSet<Element>();
  const bgSeen = new Set<string>();
  let waiting = 0;

  const track = (p: Promise<unknown>) => {
    waiting += 1;
    p.finally(() => {
      waiting -= 1;
    });
  };

  const settle = (el: HTMLImageElement) =>
    new Promise<void>((resolve) => {
      el.addEventListener("load", () => resolve(), { once: true });
      el.addEventListener("error", () => resolve(), { once: true });
    });

  const scan = () => {
    if (!alive) return;

    for (const img of Array.from(document.images)) {
      if (seen.has(img)) continue;
      seen.add(img);
      if (img.complete) continue;
      if (img.loading === "lazy") img.loading = "eager";
      track(settle(img));
    }

    // `background-image` không nằm trong `document.images`, phải tự quét. Chỉ
    // quét phần tử đang hiển thị trong cây, và mỗi URL chỉ tải một lần.
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      if (bgChecked.has(el)) continue;
      bgChecked.add(el);
      const bg = window.getComputedStyle(el).backgroundImage;
      if (!bg || bg === "none" || !bg.includes("url(")) continue;
      for (const m of bg.matchAll(/url\(["']?(.*?)["']?\)/g)) {
        const url = m[1];
        if (!url || url.startsWith("data:") || bgSeen.has(url)) continue;
        bgSeen.add(url);
        const probe = new Image();
        probe.src = url;
        if (probe.complete) continue;
        track(settle(probe));
      }
    }

    quietRounds = waiting === 0 ? quietRounds + 1 : 0;
    if (quietRounds >= 2) {
      onDone();
      return;
    }
    timer = window.setTimeout(scan, IMAGE_POLL_MS);
  };

  scan();

  return () => {
    alive = false;
    window.clearTimeout(timer);
  };
}

export function PageReadyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [holds, setHolds] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
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
    // `ready` trong deps để `MAX_MS` cắt ngang thì vòng quét cũng dừng theo.
    // Bỏ nó thì quét vẫn chạy sau khi màn chờ đã bỏ, và cú bay của chữ trong
    // `LoadingScreen` phải chia main thread với nó.
    if (ready) return;
    return waitForImages(() => setImagesReady(true));
  }, [ready]);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), MAX_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready || holds > 0 || !fontsReady || !imagesReady) return;
    // Sàn thời gian: trang nhẹ và đã cache thì mọi thứ xong gần như tức thì,
    // màn chờ chớp một cái rồi biến, nhìn như lỗi render chứ không như đang tải.
    const rest = Math.max(0, MIN_MS - (Date.now() - (startedAt.current ?? 0)));
    const t = window.setTimeout(() => setReady(true), rest);
    return () => window.clearTimeout(t);
  }, [ready, holds, fontsReady, imagesReady]);

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
