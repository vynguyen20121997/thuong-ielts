"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Scroll-reveal dùng chung: khối trồi lên + hiện dần khi cuộn tới, chạy MỘT
 * lần. Dùng spring cùng thông số với entrance của hero để cả trang một nhịp.
 * Server component nhét children vào đây được (client boundary).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 32,
  className,
}: {
  children: ReactNode;
  /** Trễ theo giây — dùng cho thẻ trong lưới nối đuôi nhau (i * 0.07) */
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px 0px" }}
      transition={{ type: "spring", stiffness: 150, damping: 22, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
