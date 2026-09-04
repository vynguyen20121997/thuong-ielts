"use client";

import { useEffect, useRef, useState } from "react";

import { usePageReady } from "./PageReady";

/**
 * Màn chờ đầu trang: nền mờ, chữ, ba chấm nhảy. Xong thì chữ **bay về đúng chỗ
 * wordmark trên header**, hạ cánh rồi lớp mờ mới tan.
 *
 * Component này KHÔNG tự quyết định lúc nào là xong — nó hỏi `PageReady`. Lý do
 * nằm ở chú thích trong `PageReady.tsx`: cùng một câu hỏi mà hai nơi tự đoán thì
 * animation vào trang sẽ chạy đằng sau lớp mờ rồi tắt trước khi ai kịp nhìn.
 *
 * ## Cú bay: FLIP từng ký tự, và chỉ bằng `transform`
 *
 * Bản đầu bay cả khối chữ rồi cho `letter-spacing` co từ `0.18em` về
 * `tracking-tight`. Nhìn thì đúng nhưng **giật**: `letter-spacing` là thuộc tính
 * layout, mỗi frame trình duyệt phải dựng lại cả dòng chữ chứ không chỉ đẩy
 * pixel — việc đó nằm trên main thread, đúng lúc main thread vừa hydrate xong và
 * đang chạy entrance animation của cả trang.
 *
 * Nên giờ mỗi ký tự là một `inline-block` riêng và tự bay bằng `transform` của
 * chính nó. Chữ giãn co lại là do 17 ký tự đi 17 quãng khác nhau, không phải do
 * đổi `letter-spacing`. `transform` và `opacity` là hai thứ compositor lo được:
 * main thread có bận cũng không kéo animation xuống theo.
 *
 * Toạ độ đích đo bằng `Range` trên chính text node của header — không nhân bản,
 * không tách chữ, không đụng gì vào `Header`. Header vẫn là một dòng chữ liền.
 *
 * Mỗi ký tự để `inline-block` còn vì hình học: hộp `inline-block` cao bằng
 * `line-height`, nên **mọi** ký tự có `top` và `height` như nhau. Nhờ vậy một
 * `dy` chung là đủ, và `transform-origin: left top` không làm chữ có dấu (ồ, ư)
 * lệch dọc so với chữ có chân (g, s) sau khi scale.
 *
 * Cỡ chữ không hard-code: `scale` = cỡ header / cỡ màn chờ, đọc từ
 * `getComputedStyle`. Đổi `text-4xl` hay `text-lg` ở một trong hai chỗ thì cú bay
 * vẫn hạ cánh đúng.
 *
 * ## Thứ tự: nền tan ngay trong lúc chữ còn đang hạ cánh
 *
 * Nền đứng yên nửa đầu cú bay rồi bắt đầu tan khi chữ đã đi được một đoạn
 * (`VEIL_START_MS`), nên hai chuyển động gối nhau chứ không nối đuôi. Nối đuôi
 * thì nhìn thành hai màn rời: chữ đáp xuống, đứng chờ, xong trang mới hiện.
 *
 * Vẫn để nền yên ở nửa đầu vì hai lý do: mắt kịp bắt lấy chữ trước khi cả khung
 * sáng dần, và `backdrop-filter` tĩnh thì trình duyệt blur một lần rồi dùng lại —
 * vừa blur vừa đổi `opacity` là blur lại mỗi frame.
 *
 * Lớp phủ chỉ đi khi **cả hai** đã xong (`max` của hai mốc), nên đổi
 * `VEIL_START_MS` hay `FLIGHT_MS` cũng không bao giờ tháo lớp phủ khi chữ còn
 * đang bay.
 *
 * Chữ trên header bị ẩn từ lúc cất cánh tới khi lớp phủ đi hẳn: hai bản cùng nội
 * dung chồng nhau nhìn ra ngay. Lúc đổi vai thì chữ bay và chữ header cùng nội
 * dung, cùng chỗ, cùng cỡ, nên không ai thấy gì.
 *
 * Không có JS thì `<noscript>` bên dưới ẩn hẳn lớp phủ. Thiếu nó, người tắt JS
 * nhận một trang mờ không bao giờ sáng lại — nội dung vẫn nằm trong HTML nhưng bị
 * che, tức là tự tay làm hỏng trang cho nhóm người dùng đó.
 */
const FLIGHT_MS = 760;
/** Chậm dần về cuối để lúc hạ cánh chữ như được đặt xuống, không như phanh gấp. */
const FLIGHT_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Nhịp nghỉ sau khi hạ cánh, trước khi tháo lớp phủ. */
const LANDED_HOLD_MS = 90;
/**
 * Hoãn cất cánh một nhịp. Đo được frame đầu tiên sau khi `PageReady` bật kéo dài
 * ~83ms: đó là frame React commit, Lenis khởi động và entrance của cả trang cùng
 * chen vào. Bắt đầu bay ngay tại frame đó thì cái nấc rơi đúng lúc mắt bắt đầu
 * theo chữ — chỗ dễ thấy nhất. Đứng yên cho nó qua rồi mới đi.
 */
const TAKEOFF_DELAY_MS = 90;
/**
 * Nền tan đúng bằng thời lượng cú bay, và dùng luôn `FLIGHT_EASE`: hai chuyển
 * động đi cùng nhịp thì mắt đọc thành một động tác. Lệch nhau thì thành hai thứ
 * rời nhau cùng chạy. Buộc vào `FLIGHT_MS` chứ không chép số, để sau này đổi tốc
 * độ bay là nền theo ngay.
 */
const VEIL_MS = FLIGHT_MS;
/** Chữ bay được chừng nửa đường thì nền bắt đầu tan — tính từ lúc cất cánh. */
const VEIL_START_MS = 300;
const DOTS_MS = 160;
/** Đường lùi khi không đo được header (hoặc khách tắt hiệu ứng): chỉ tan chữ. */
const FADE_TEXT_MS = 280;
const LOADING_TEXT = "Thương Hồ's Class";
const LOADING_CHARS = Array.from(LOADING_TEXT);
const LOADING_TRACKING = "0.18em";
const TARGET_ID = "logo-wordmark";

type Phase = "loading" | "flying" | "text-out" | "veil-out" | "gone";

/** Text node đầu tiên bên trong `el`, để đo từng ký tự bằng `Range`. */
function firstTextNode(el: HTMLElement): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

export default function LoadingScreen() {
  const [phase, setPhase] = useState<Phase>("loading");
  const textRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Cờ "đã cất cánh" phải là ref, không phải `phase`: `setPhase("flying")` là một
  // lần render nữa, mà `phase` nằm trong deps thì effect chạy lại và cleanup của
  // nó huỷ luôn cú bay vừa bắt đầu.
  const tookOff = useRef(false);
  // Chữ trên header do effect bay ẩn đi; phase cuối là nơi trả lại. Giữ tham
  // chiếu để hai chỗ không phải tự đi tìm lại phần tử.
  const hiddenTarget = useRef<HTMLElement | null>(null);
  // Tách khỏi `phase` vì nó gối lên `flying`: chữ vẫn đang bay mà nền đã tan.
  const [veilFading, setVeilFading] = useState(false);
  const ready = usePageReady();

  // Bước 1: xong thì bay, không bay được thì tan.
  useEffect(() => {
    if (!ready || tookOff.current) return;
    tookOff.current = true;

    const el = textRef.current;
    const target = document.getElementById(TARGET_ID);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = charRefs.current;

    if (!el || !target || reduceMotion || typeof el.animate !== "function") {
      setPhase("text-out");
      return;
    }

    // Đích: từng ký tự của dòng chữ trên header, đo bằng `Range`.
    const node = firstTextNode(target);
    const offset = node ? node.data.indexOf(LOADING_TEXT) : -1;
    if (!node || offset < 0 || chars.length !== LOADING_CHARS.length || chars.some((c) => !c)) {
      // Chữ hai bên lệch nhau (đổi text một chỗ mà quên chỗ kia) thì thà tan như
      // cũ, còn hơn bay tới một toạ độ đoán bừa.
      setPhase("text-out");
      return;
    }

    const range = document.createRange();
    const from = chars.map((c) => c!.getBoundingClientRect());
    const to = LOADING_CHARS.map((_, i) => {
      range.setStart(node, offset + i);
      range.setEnd(node, offset + i + 1);
      return range.getBoundingClientRect();
    });

    const fromSize = parseFloat(window.getComputedStyle(el).fontSize);
    const toSize = parseFloat(window.getComputedStyle(target).fontSize);
    const scale = fromSize > 0 ? toSize / fromSize : 1;
    // Canh theo tâm dọc, không theo mép trên: hai cỡ chữ có `line-height` khác
    // nhau nên mép trên lệch, còn tâm thì trùng. Một `dy` cho cả dòng — xem chú
    // thích `inline-block` ở đầu file.
    const dy = to[0].top + to[0].height / 2 - (from[0].top + (from[0].height * scale) / 2);

    // CSS đã ẩn chữ header từ frame đầu (`html.site-loading` trong
    // `globals.css`). Inline style ở đây là để **nối tiếp**: class kia bị gỡ ngay
    // khi nền bắt đầu tan, mà lúc ấy chữ bay còn đứng trên chỗ đó — hiện chữ
    // header lên là hai bản chồng nhau, nét chữ dày lên rồi mỏng lại.
    target.style.opacity = "0";
    hiddenTarget.current = target;

    const anims = chars.map((c, i) =>
      c!.animate(
        [
          { transform: "none" },
          { transform: `translate(${to[i].left - from[i].left}px, ${dy}px) scale(${scale})` },
        ],
        { duration: FLIGHT_MS, delay: TAKEOFF_DELAY_MS, easing: FLIGHT_EASE, fill: "forwards" }
      )
    );

    setPhase("flying");

    // Hai mốc chạy song song: nền bắt đầu tan khi chữ còn đang bay, còn lớp phủ
    // chỉ đi khi cả hai đã xong. Lấy `max` chứ không cộng dồn — thứ nào lâu hơn
    // thì thứ đó quyết định, đổi hằng số nào cũng không tháo lớp phủ giữa cú bay.
    const fadeAt = TAKEOFF_DELAY_MS + VEIL_START_MS;
    const endAt = TAKEOFF_DELAY_MS + Math.max(FLIGHT_MS + LANDED_HOLD_MS, VEIL_START_MS + VEIL_MS);
    const fade = window.setTimeout(() => setVeilFading(true), fadeAt);
    const end = window.setTimeout(() => {
      // Trả lại chữ trên header đúng lúc lớp phủ đi, đừng để dành cho cleanup:
      // `phase === "gone"` chỉ `return null`, component vẫn còn mounted nên
      // cleanup không bao giờ chạy và header sẽ trống chữ mãi.
      target.style.opacity = "";
      setPhase("gone");
    }, endAt);

    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(end);
      anims.forEach((a) => a.cancel());
      target.style.opacity = "";
      hiddenTarget.current = null;
    };
  }, [ready]);

  // Bước 2: chỉ dành cho đường lùi (không bay được) — chữ tan trước, xong tới
  // nền, rồi tháo khỏi cây DOM. Đường bay tự lo hai mốc của nó ở effect trên.
  useEffect(() => {
    if (phase === "text-out") {
      const t = window.setTimeout(() => setPhase("veil-out"), FADE_TEXT_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "veil-out") {
      const t = window.setTimeout(() => {
        // Trả lại chữ trên header đúng lúc lớp phủ đi, đừng để dành cho cleanup:
        // `phase === "gone"` chỉ `return null`, component vẫn còn mounted nên
        // cleanup không bao giờ chạy và header sẽ trống chữ mãi.
        if (hiddenTarget.current) hiddenTarget.current.style.opacity = "";
        setPhase("gone");
      }, VEIL_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  // Khoá cuộn do script inline trong `layout.tsx` gắn từ lúc parse; ở đây chỉ nhả
  // sớm hơn cái hẹn 8s của nó. Nhả ngay khi lớp mờ bắt đầu tan, không đợi tan
  // hẳn: nửa giây nhìn thấy trang mà lăn chuột không nhúch là đủ để tưởng trang treo.
  useEffect(() => {
    if (veilFading || phase === "veil-out" || phase === "gone") {
      document.documentElement.classList.remove("site-loading");
    }
  }, [veilFading, phase]);

  // Lưới cuối: component bị tháo vì bất kỳ lý do gì thì cũng phải trả lại cuộn.
  useEffect(() => () => {
    document.documentElement.classList.remove("site-loading");
  }, []);

  if (phase === "gone") return null;

  const flying = phase === "flying";
  const veilGone = veilFading || phase === "veil-out";
  const textGone = phase === "text-out";

  return (
    <>
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html: ".site-loader{display:none!important}",
          }}
        />
      </noscript>

      {/* `.site-loader` phải ở ngoài cùng: lối thoát bằng CSS trong `globals.css`
          hạ `opacity` của chính class này, và nó cần tắt được cả nền lẫn chữ. */}
      <div
        aria-hidden
        className="site-loader pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Nền mờ là một lớp riêng, không phải background của thẻ ngoài: nếu để
            chung thì chữ là con của thẻ đang tan, và cú bay sẽ nhoè dần rồi mất
            trước khi kịp hạ cánh. Tách ra thì nền tan mà chữ vẫn đậm. */}
        <div
          className={`absolute inset-0 bg-white/80 backdrop-blur-xl transition-opacity ${
            veilGone ? "opacity-0" : "opacity-100"
          }`}
          style={{
            transitionDuration: `${VEIL_MS}ms`,
            transitionTimingFunction: FLIGHT_EASE,
            willChange: "opacity",
          }}
        />

        <div className="relative flex flex-col items-center gap-6">
          <span
            ref={textRef}
            // Cùng họ chữ, cùng độ đậm, không viết hoa — y như wordmark trên
            // header, chỉ to hơn và giãn hơn. Khác một nét thôi là lúc hạ cánh
            // chữ nháy một cái.
            className={`ml-[0.18em] flex whitespace-nowrap font-bold tracking-tight text-brand transition-opacity ease-out text-3xl md:text-4xl ${
              textGone ? "opacity-0" : "opacity-100"
            }`}
            style={{
              letterSpacing: LOADING_TRACKING,
              // Chữ đã hạ cánh thì KHÔNG tan theo nền: chữ header còn đang ẩn, tan
              // theo là wordmark nhoè đi rồi bật lại. Cứ để đậm, tới lúc tháo lớp
              // phủ mới đổi vai — hai bản trùng khít nên không ai thấy.
              transitionDuration: `${FADE_TEXT_MS}ms`,
            }}
          >
            {LOADING_CHARS.map((c, i) => (
              <span
                key={i}
                ref={(node) => {
                  charRefs.current[i] = node;
                }}
                className="inline-block"
                // `will-change` khai báo sẵn từ lúc còn đứng yên: khai lúc
                // animation đã chạy thì trình duyệt phải tách layer giữa đường,
                // đúng cái nấc đầu tiên mà mắt nhìn ra.
                style={{ willChange: "transform", transformOrigin: "left top" }}
              >
                {/* Khoảng trắng thường bị gộp mất giữa các `inline-block`. */}
                {c === " " ? " " : c}
              </span>
            ))}
          </span>

          <span
            className={`flex items-end gap-2.5 transition-opacity ease-out ${
              flying || textGone || veilGone ? "opacity-0" : "opacity-100"
            }`}
            // Chấm tan ngay lúc cất cánh, không đợi nhịp hoãn: chấm còn nhảy mà
            // chữ đã đi thì hai chuyển động cãi nhau.
            style={{ transitionDuration: `${flying ? DOTS_MS : FADE_TEXT_MS}ms` }}
          >
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
