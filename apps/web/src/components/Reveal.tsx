"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { usePageReady } from "./PageReady";

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
  const ready = usePageReady();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      // Chưa `ready` thì không đưa đích tới: khối nằm yên ở trạng thái ẩn.
      // Không có dòng này, những khối đã nằm sẵn trong khung nhìn sẽ bật vào
      // ngay lúc mount — tức là diễn xong đằng sau lớp mờ.
      whileInView={ready ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-80px 0px" }}
      transition={{ type: "spring", stiffness: 150, damping: 22, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
