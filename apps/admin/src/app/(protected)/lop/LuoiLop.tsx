"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

import type { TheLop } from "../../../lib/lop";

/**
 * Lưới lớp ở màn chính, tự cập nhật.
 *
 * Socket ở đây chỉ chở TÓM TẮT ("lớp này vừa có động tĩnh, ai đang làm") chứ
 * không chở dải 40 ô của từng em — màn này không vẽ chúng, mà nhận thì tốn
 * đường truyền cho cả lớp nhân cả trường. Chi tiết để dành cho màn trong.
 *
 * Khi có lớp HOÀN TOÀN MỚI xuất hiện (mã đề chưa có trên màn), gọi
 * `router.refresh()` để server đọc lại — chỉ lúc đó mới cần, vì lớp mới kéo
 * theo tên đề, bộ đề, chủ đề mà tóm tắt không mang.
 */

interface Nhom {
  bo: string;
  targets: string[];
}

interface TomTat {
  lop: string;
  loai: "vao" | "nhip" | "nop";
  a: string;
  ten: string;
  khach: boolean;
}

export default function LuoiLop({
  banDau,
  nhomBanDau,
  tongMatKetNoi,
}: {
  banDau: TheLop[];
  nhomBanDau: Nhom[];
  tongDangLam: number;
  tongMatKetNoi: number;
}) {
  const router = useRouter();
  const [lop, setLop] = useState(banDau);
  const [noi, setNoi] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  /*
    Danh sách mã lớp đang có trên màn, giữ trong ref.

    Cần nó để biết một tóm tắt là "lớp đã biết" hay "lớp hoàn toàn mới" mà
    KHÔNG phải đọc state bên trong hàm cập nhật state. Trước đây tôi gọi
    `router.refresh()` ngay trong `setLop(...)`, và React kêu đúng: hàm cập
    nhật chạy lúc render, gọi router ở đó là cập nhật component này trong lúc
    đang dựng component kia.
  */
  const dangCoRef = useRef<Set<string>>(new Set(banDau.map((l) => l.target)));

  // Đồng bộ lại khi server trả dữ liệu mới (sau `router.refresh()`).
  useEffect(() => {
    setLop(banDau);
    dangCoRef.current = new Set(banDau.map((l) => l.target));
  }, [banDau]);

  useEffect(() => {
    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setNoi(true);
      socket.emit("xem-tat-ca");
    });
    socket.on("disconnect", () => setNoi(false));
    socket.on("connect_error", () => setNoi(false));

    socket.on("tom-tat", (t: TomTat) => {
      // Lớp hoàn toàn mới: tóm tắt không mang theo tên đề, bộ, chủ đề — phải
      // hỏi lại server. Quyết định ở ĐÂY, ngoài hàm cập nhật state.
      if (!dangCoRef.current.has(t.lop)) {
        dangCoRef.current.add(t.lop);
        router.refresh();
        return;
      }

      setLop((truoc) => {
        const i = truoc.findIndex((l) => l.target === t.lop);
        if (i < 0) return truoc;

        const cu = truoc[i];
        const sau = [...truoc];

        if (t.loai === "nop") {
          sau[i] = {
            ...cu,
            dangLam: Math.max(0, cu.dangLam - 1),
            daNop: cu.daNop + 1,
            tenDangLam: cu.tenDangLam.filter((n) => n !== t.ten),
          };
          return sau;
        }

        if (t.loai === "vao" && !cu.tenDangLam.includes(t.ten)) {
          sau[i] = {
            ...cu,
            dangLam: cu.dangLam + 1,
            tenDangLam: [t.ten, ...cu.tenDangLam].slice(0, 6),
          };
          return sau;
        }

        // Nhịp bình thường: em ấy còn đó. Chỉ cần chắc chắn tên có trong danh sách.
        if (cu.tenDangLam.includes(t.ten)) return truoc;
        sau[i] = { ...cu, tenDangLam: [t.ten, ...cu.tenDangLam].slice(0, 6) };
        return sau;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  const nhom = useMemo(() => {
    const m = new Map<string, TheLop[]>();
    for (const n of nhomBanDau) {
      const ds = n.targets
        .map((t) => lop.find((l) => l.target === t))
        .filter(Boolean) as TheLop[];
      if (ds.length) m.set(n.bo, ds);
    }
    return [...m.entries()];
  }, [lop, nhomBanDau]);

  const dangLam = lop.reduce((t, l) => t + l.dangLam, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-7 rounded-2xl border border-black/10 bg-white px-6 py-4">
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${noi ? "bg-[#157F3D]" : "bg-[#B26A00]"}`}
            aria-hidden
          />
          <span className="text-xs font-bold text-[#1A1A1A]/60">
            {noi ? "Đang nhận trực tiếp" : "Mất kết nối"}
          </span>
        </span>
        <So so={dangLam} nhan="Đang làm" mau="text-[#157F3D]" />
        <So so={lop.length} nhan="Lớp mở" />
        {tongMatKetNoi > 0 && <So so={tongMatKetNoi} nhan="Mất kết nối" mau="text-[#B26A00]" />}
      </div>

      {nhom.length === 0 && (
        <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
          <p className="font-bold text-[#1A1A1A] mb-1">Chưa có ai đang làm bài</p>
          <p className="text-sm text-[#1A1A1A]/50 mb-5">
            Giao một đề cho lớp rồi gửi link — học viên vào là hiện ở đây ngay, không phải tải lại
            trang.
          </p>
          <Link
            href="/lop/giao"
            className="inline-block rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white transition-colors"
          >
            Giao bài
          </Link>
        </div>
      )}

      {nhom.map(([bo, ds]) => (
        <section key={bo} className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/40">
            {bo}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ds.map((l) => (
              <Link
                key={l.target}
                href={`/lop/${encodeURIComponent(l.target)}`}
                className="group block rounded-2xl border border-black/10 bg-white p-5 hover:border-[#14532D]/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 mr-auto">
                    <span className="flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide bg-black/[0.05] text-[#1A1A1A]/50">
                        {l.kyNang === "listening" ? "Nghe" : "Đọc"}
                      </span>
                      <span className="font-serif text-base font-black text-[#1A1A1A] truncate">
                        {l.title}
                      </span>
                    </span>

                    {l.chuDe.length > 0 && (
                      <p className="text-xs text-[#1A1A1A]/45 mt-1.5 line-clamp-1">
                        {l.chuDe.join(" · ")}
                      </p>
                    )}
                  </div>

                  <span className="text-right shrink-0">
                    <b
                      className={`block font-serif text-3xl font-black tabular-nums leading-none ${
                        l.dangLam > 0 ? "text-[#157F3D]" : "text-[#1A1A1A]/20"
                      }`}
                    >
                      {l.dangLam}
                    </b>
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/40 mt-1">
                      đang làm
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-4">
                  {l.tenDangLam.map((ten) => (
                    <span
                      key={ten}
                      className="rounded-full bg-[#E3F4E8] px-2.5 py-1 text-[11px] font-semibold text-[#157F3D]"
                    >
                      {ten}
                    </span>
                  ))}
                  {l.dangLam > l.tenDangLam.length && (
                    <span className="text-[11px] text-[#1A1A1A]/40">
                      +{l.dangLam - l.tenDangLam.length} em nữa
                    </span>
                  )}
                  {l.dangLam === 0 && (
                    <span className="text-[11px] text-[#1A1A1A]/35">Không còn ai đang làm</span>
                  )}

                  <span className="ml-auto flex items-center gap-3 text-[11px] text-[#1A1A1A]/45">
                    {l.matKetNoi > 0 && (
                      <span className="font-bold text-[#B26A00]">{l.matKetNoi} mất kết nối</span>
                    )}
                    <span>{l.daNop} đã nộp</span>
                    <span className="font-bold text-[#14532D] group-hover:underline">Xem →</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function So({ so, nhan, mau = "" }: { so: number; nhan: string; mau?: string }) {
  return (
    <span className="block">
      <b className={`block font-serif text-xl font-black tabular-nums leading-tight ${mau}`}>
        {so}
      </b>
      <span className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/40">
        {nhan}
      </span>
    </span>
  );
}
