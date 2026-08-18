"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

import type { TheLop } from "../../../lib/lop";

/**
 * Lưới lớp ở màn chính, tự cập nhật.
 *
 * Ba nhóm, đúng ba tình huống thật của cô:
 *
 *   "Giao cho cả lớp"   — bài cô giao cho cả lớp
 *   "Gửi riêng"         — bài cô gửi cho một bạn; tách ra để không lẫn bảng điểm
 *   "Học viên tự luyện" — không ai giao; cô xem cho biết, không phải lớp của cô
 *
 * Socket chỉ chở TÓM TẮT ("lớp này vừa có động tĩnh, ai đang làm") chứ không
 * chở dải ô của từng em — màn này không vẽ chúng. Chi tiết để dành màn trong.
 */

interface TomTat {
  lop: string;
  loai: "vao" | "nhip" | "nop";
  a: string;
  ten: string;
  khach: boolean;
}

const TIEU_DE_NHOM: Record<string, string> = {
  class: "Giao cho cả lớp",
  one: "Gửi riêng cho một bạn",
  "tu-luyen": "Học viên tự luyện",
};

const MO_TA_NHOM: Record<string, string> = {
  class: "Cô gửi một link cho cả lớp — mọi em làm chung một đề.",
  one: "Link cô gửi riêng. Tách khỏi lớp để không lẫn vào bảng điểm buổi học.",
  "tu-luyen": "Các em tự vào luyện, không ai giao. Xem cho biết, không tính vào buổi dạy.",
};

export default function LuoiLop({ banDau }: { banDau: TheLop[] }) {
  const router = useRouter();
  const [lop, setLop] = useState(banDau);
  const [noi, setNoi] = useState(false);
  const [cauNoi, setCauNoi] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  /*
    Khoá lớp đang có trên màn, giữ trong ref.

    Cần nó để biết một tóm tắt là "lớp đã biết" hay "lớp hoàn toàn mới" mà
    KHÔNG phải đọc state bên trong hàm cập nhật state — gọi router ở đó là cập
    nhật component này trong lúc đang dựng component kia, React kêu ngay.
  */
  const dangCoRef = useRef<Set<string>>(new Set(banDau.map((l) => l.khoa)));

  useEffect(() => {
    setLop(banDau);
    dangCoRef.current = new Set(banDau.map((l) => l.khoa));
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
    socket.on("cau-noi", (song: boolean) => setCauNoi(song));

    socket.on("tom-tat", (t: TomTat) => {
      // Lớp hoàn toàn mới: tóm tắt không mang tên buổi, bộ đề, chủ đề — phải
      // hỏi lại server. Quyết định ở ĐÂY, ngoài hàm cập nhật state.
      if (!dangCoRef.current.has(t.lop)) {
        dangCoRef.current.add(t.lop);
        router.refresh();
        return;
      }

      setLop((truoc) => {
        const i = truoc.findIndex((l) => l.khoa === t.lop);
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
    const g = (l: TheLop) => (l.loai === "tu-luyen" ? "tu-luyen" : (l.choAi ?? "class"));
    return (["class", "one", "tu-luyen"] as const)
      .map((k) => [k, lop.filter((l) => g(l) === k)] as const)
      .filter(([, ds]) => ds.length > 0);
  }, [lop]);

  const dangLam = lop.reduce((t, l) => t + l.dangLam, 0);
  const soLopCo = lop.filter((l) => l.loai === "bai-giao").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-7 rounded-2xl border border-black/10 bg-white px-6 py-4">
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${noi && cauNoi ? "bg-[#157F3D]" : "bg-[#B26A00]"}`}
            aria-hidden
          />
          <span className="text-xs font-bold text-[#1A1A1A]/60">
            {!noi
              ? "Mất kết nối"
              : !cauNoi
                ? "Đường tới máy chủ dữ liệu đang đứt — số có thể cũ"
                : "Đang nhận trực tiếp"}
          </span>
        </span>
        <So so={dangLam} nhan="Đang làm" mau="text-[#157F3D]" />
        <So so={soLopCo} nhan="Bài cô giao" />
      </div>

      {lop.length === 0 && (
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

      {nhom.map(([khoaNhom, ds]) => (
        <section key={khoaNhom} className="flex flex-col gap-3">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#1A1A1A]/45">
              {TIEU_DE_NHOM[khoaNhom]}
            </h2>
            <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{MO_TA_NHOM[khoaNhom]}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ds.map((l) => (
              <Link
                key={l.khoa}
                href={`/lop/${l.khoa}`}
                className={`group block rounded-2xl border bg-white p-5 hover:shadow-sm transition-all ${
                  l.loai === "tu-luyen"
                    ? "border-dashed border-black/15 hover:border-[#1A1A1A]/30"
                    : "border-black/10 hover:border-[#14532D]/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 mr-auto">
                    <span className="flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide bg-black/[0.05] text-[#1A1A1A]/50">
                        {l.kyNang === "listening" ? "Nghe" : "Đọc"}
                      </span>
                      <span className="font-serif text-base font-black text-[#1A1A1A] truncate">
                        {l.nhan}
                      </span>
                      {!l.conMo && l.loai === "bai-giao" && (
                        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-bold text-[#1A1A1A]/45">
                          Đã đóng
                        </span>
                      )}
                    </span>

                    {/* Tên đề hiện dưới tên buổi — cô giao cùng một đề cho ba
                        lớp thì tên buổi phân biệt lớp, tên đề nói đang làm bài
                        gì. Bỏ khi hai cái trùng nhau (nhóm tự luyện). */}
                    {l.nhan !== l.title && (
                      <p className="text-xs text-[#1A1A1A]/50 mt-1 truncate">{l.title}</p>
                    )}
                    {l.chuDe.length > 0 && (
                      <p className="text-[11px] text-[#1A1A1A]/35 mt-0.5 truncate">
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
                  {l.dangLam === 0 && l.daNop === 0 && (
                    <span className="text-[11px] text-[#1A1A1A]/35">Chưa có ai vào</span>
                  )}
                  {l.dangLam === 0 && l.daNop > 0 && (
                    <span className="text-[11px] text-[#1A1A1A]/35">Cả lớp đã xong</span>
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
