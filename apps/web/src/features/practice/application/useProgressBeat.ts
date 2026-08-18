"use client";

import { useEffect, useRef } from "react";

import type { ReadingAnswers } from "../domain/types";

/**
 * Nhịp tiến độ gửi lên cho màn theo dõi của cô.
 *
 * Ba luật, mỗi luật vì một lý do cụ thể:
 *
 * 1. **Mỗi 5 giây khi có thay đổi, và ít nhất mỗi 15 giây dù không có gì đổi.**
 *    30 học sinh × 1 nhịp/5 giây = 6 lượt ghi mỗi giây — Postgres không coi đó
 *    là tải. Gửi theo từng phím gõ thì mới thành vấn đề, và cũng chẳng để làm
 *    gì: cô nhìn số câu, không nhìn từng chữ.
 *
 *    Nhịp "dù không có gì đổi" là bắt buộc, không phải cho đẹp. Cô đọc trạng
 *    thái kết nối từ lần nhịp cuối: im quá 20 giây là "mất kết nối". Mà một em
 *    đọc kỹ bài Reading thì hai phút đầu chưa gõ chữ nào — không có nhịp rỗng
 *    thì em ấy hiện "mất kết nối" trong khi đang ngồi ngay đó đọc bài. Đã đo
 *    được đúng tình huống này.
 *
 * 2. **Không bao giờ chặn bài thi.** Mọi lỗi đều nuốt. Nhịp là thứ trang trí
 *    cho màn hình của cô; học sinh đang thi thì không được thấy một thông báo
 *    lỗi nào từ đường này.
 *
 * 3. **Server bảo ngừng thì ngừng.** Nhận 204 (lượt đã nộp, hết giờ, hoặc
 *    không phải của em này) là dừng hẳn, không thử lại. Không có luật này thì
 *    một tab bỏ quên sẽ gõ cửa server mãi mãi.
 */

const NHIP_MS = 5000;

/*
  Lâu nhất bao nhiêu thì phải gửi một nhịp, kể cả khi bài không đổi gì.

  10 giây, đặt cạnh ngưỡng 25 giây bên màn hình của cô — CHỊU ĐƯỢC MỘT NHỊP LỠ.
  Đã đo với 15 giây/20 giây: một nhịp trượt là khoảng lặng thành 30 giây, và cô
  thấy "Mất kết nối" nháy lên rồi tắt trong khi em ấy vẫn ngồi đó. Báo động giả
  còn tệ hơn không báo: vài lần là cô thôi không tin cái đèn đó nữa.
*/
const NHIP_RONG_MS = 10000;

export function useProgressBeat(
  attemptId: string | null,
  answers: ReadingAnswers,
  part?: string | null
) {
  // Đọc trong callback của interval, để interval không phải dựng lại mỗi lần
  // học sinh gõ một chữ — dựng lại là đồng hồ trôi.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const partRef = useRef(part);
  partRef.current = part;

  const daGuiRef = useRef<string>("");
  const lanGuiCuoiRef = useRef<number>(0);
  const ngungRef = useRef(false);

  useEffect(() => {
    if (!attemptId) return;
    ngungRef.current = false;

    const guiNhip = async () => {
      if (ngungRef.current) return;

      // So chuỗi JSON để biết có gì đổi không. Đơn giản và đủ: nội dung nhỏ,
      // và bỏ sót một nhịp cũng không sao vì nhịp sau mang trạng thái đầy đủ.
      const hienTai = JSON.stringify(answersRef.current);
      const quaLau = Date.now() - lanGuiCuoiRef.current >= NHIP_RONG_MS;
      if (hienTai === daGuiRef.current && !quaLau) return;

      try {
        const res = await fetch(`/api/practice/attempt/${attemptId}/beat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersRef.current, part: partRef.current ?? null }),
        });
        if (res.status === 204) {
          ngungRef.current = true;
          return;
        }
        if (res.ok) {
          daGuiRef.current = hienTai;
          lanGuiCuoiRef.current = Date.now();
        }
      } catch {
        // Mạng chập chờn: bỏ qua nhịp này, nhịp sau mang trạng thái đầy đủ nên
        // không mất gì. Cô sẽ thấy em ấy "mất kết nối" nếu im quá 20 giây.
      }
    };

    // Gửi ngay một nhịp lúc vào, đừng bắt cô đợi 5 giây mới thấy em ấy.
    lanGuiCuoiRef.current = Date.now();
    void guiNhip();

    const id = setInterval(guiNhip, NHIP_MS);
    return () => clearInterval(id);
  }, [attemptId]);
}
