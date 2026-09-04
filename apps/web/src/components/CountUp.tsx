"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";
import { usePageReady } from "./PageReady";

/**
 * Số đếm tăng dần, dùng chung cho các con số lớn ngoài trang (giống các ô ở
 * `Stats`). Ở đây con số tới từ fetch nên `value` nhảy 0 → N sau khi trang đã
 * dựng: animation chạy theo `value` chứ không theo lúc mount, và luôn đếm tiếp
 * từ số đang hiện chứ không giật về 0 khi giá trị đổi giữa chừng.
 *
 * Cũng chờ `usePageReady` như Hero và `Reveal`: mount xong mà đếm ngay là đếm
 * sau lớp màn chờ, tới lúc bỏ màn thì số đã nằm ở giá trị cuối và khách chỉ
 * thấy một dải số đứng im.
 */
export default function CountUp({
  value,
  duration = 2,
  delay = 0,
  overshoot,
  className,
}: {
  value: number;
  /** Giây */
  duration?: number;
  /** Chờ trước khi bắt đầu đếm, tính bằng giây. */
  delay?: number;
  /** Mốc chạy quá đà trước khi quay về giá trị cuối. */
  overshoot?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const reduce = useReducedMotion();
  const pageReady = usePageReady();

  useEffect(() => {
    const node = ref.current;
    if (!node || !pageReady) return;

    if (reduce || value === shown.current) {
      node.textContent = String(value);
      shown.current = value;
      return;
    }

    const state = { val: shown.current };
    const update = () => {
      node.textContent = String(Math.round(state.val));
    };
    const tween = gsap.timeline({ delay });

    if (overshoot !== undefined && overshoot !== value) {
      tween
        .to(state, { val: overshoot, duration: duration * 0.72, ease: "power2.out", onUpdate: update })
        .to(state, { val: value, duration: duration * 0.28, ease: "power2.inOut", onUpdate: update });
    } else {
      tween.to(state, { val: value, duration, ease: "power2.out", onUpdate: update });
    }

    return () => {
      // Giữ lại số đang hiện để lần đổi giá trị sau đếm tiếp, không nhảy về 0
      shown.current = Math.round(state.val);
      tween.kill();
    };
  }, [value, duration, delay, overshoot, reduce, pageReady]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
