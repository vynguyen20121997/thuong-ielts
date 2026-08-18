"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Hai cách vào: tài khoản Google, hoặc chỉ gõ tên.
 *
 * Gõ tên đặt ở dưới và trình bày nhẹ hơn — nó tiện nhưng không giữ được lịch
 * sử làm bài, nên ai có tài khoản thì nên dùng tài khoản. Không giấu đi, chỉ
 * không mời chào.
 */
export default function VaoBangTen({
  token,
  choKhach,
  duongDenBai,
}: {
  token: string;
  choKhach: boolean;
  duongDenBai: string;
}) {
  const [ten, setTen] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const vao = async () => {
    const sach = ten.trim();
    if (sach.length < 2) {
      setLoi("Nhập tên để thầy cô biết ai đang làm bài nhé.");
      return;
    }
    setDangGui(true);
    setLoi(null);

    // Thử lại với lỗi máy chủ (5xx) — DNS của RDS chập chờn, và đây là cửa đầu
    // tiên học sinh chạm vào. 4xx là câu trả lời dứt khoát (link đóng, buổi
    // này không cho khách), thử lại cũng vậy thôi.
    for (let lan = 1; lan <= 3; lan++) {
      try {
        const res = await fetch("/api/vao-bang-ten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ten: sach }),
        });

        if (res.ok) {
          window.location.href = duongDenBai;
          return;
        }

        if (res.status < 500) {
          const p = (await res.json().catch(() => null)) as { error?: string } | null;
          setLoi(p?.error ?? "Không vào được. Thử lại nhé.");
          setDangGui(false);
          return;
        }
      } catch {
        // Mạng hỏng — rơi xuống nhánh chờ rồi thử lại.
      }
      if (lan < 3) await new Promise((r) => setTimeout(r, 400 * lan));
    }

    setLoi("Máy chủ đang bận. Đợi vài giây rồi bấm lại giúp cô nhé.");
    setDangGui(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => signIn("google", { redirectTo: `/vao/${token}` })}
        className="flex items-center justify-center gap-3 w-full rounded-full border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-[#1A1A1A] hover:border-[#14532D]/40 cursor-pointer transition-colors"
      >
        Vào bằng tài khoản Google
      </button>

      {choKhach && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-2xs font-medium text-[#1A1A1A]/40">hoặc</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="ten" className="text-2xs font-medium text-[#1A1A1A]/50">
              Gõ tên để vào ngay — kết quả buổi này chỉ giữ trong 1 ngày
            </label>
            <input
              id="ten"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && vao()}
              placeholder="Nguyễn Thu Hà"
              maxLength={60}
              className="w-full rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm focus:outline-none focus:border-[#14532D]/50 transition-colors"
            />
            <button
              type="button"
              onClick={vao}
              disabled={dangGui}
              className="w-full rounded-full bg-[#14532D] hover:bg-[#052E16] disabled:cursor-wait px-4 py-3.5 text-sm font-semibold text-white cursor-pointer transition-colors"
            >
              {dangGui ? "Đang vào..." : "Vào làm bài"}
            </button>
          </div>
        </>
      )}

      {loi && <p className="text-[13px] text-[#C62828]">{loi}</p>}
    </div>
  );
}
