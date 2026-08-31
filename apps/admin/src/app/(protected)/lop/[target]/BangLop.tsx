"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type { HocSinhTrongLop } from "../../../../lib/lop";

/**
 * Bảng lớp — nhận nhịp qua socket và vẽ lại.
 *
 * `banDau` do server đọc thẳng DB rồi truyền xuống. Socket chỉ chở phần cập
 * nhật sau đó. Mất socket thì bảng đứng yên chứ không trắng, và tải lại trang
 * là đúng ngay — sự thật nằm ở DB, không nằm trong đường truyền.
 */

interface GoiNhip {
  loai: "vao" | "nhip" | "nop";
  a: string;
  target: string;
  /** Mã lớp — mọi em cùng đề đều mang cùng mã này. */
  lop: string;
  phan?: string | null;
  pham?: "paper" | "test";
  ten: string;
  khach: boolean;
  d: number;
  c: number;
  t: number;
  marks: (boolean | null)[];
  conLai: number;
  band?: number | null;
}

const NHAN: Record<HocSinhTrongLop["trangThai"], string> = {
  "dang-lam": "Đang làm",
  "mat-ket-noi": "Mất kết nối",
  "da-nop": "Đã nộp",
  "da-roi": "Đã rời",
};

const MAU: Record<HocSinhTrongLop["trangThai"], string> = {
  "dang-lam": "text-[#157F3D]",
  "mat-ket-noi": "text-[#B26A00]",
  "da-nop": "text-[#3D5AFE]",
  "da-roi": "text-[#1A1A1A]/40",
};

/*
  Mất kết nối là thứ SUY RA, không phải thứ được báo.

  Học sinh rớt mạng thì không có ai gửi lên "em vừa rớt mạng" — cái duy nhất
  xảy ra là nhịp ngừng tới.

  25 giây chứ không phải 20: học sinh gửi nhịp rỗng mỗi 10 giây, nên biên này
  chịu được một nhịp lỡ. Đo với 20 giây thì một nhịp trượt là "Mất kết nối"
  nháy lên rồi tắt trong khi em ấy vẫn ngồi đọc bài. Không đếm thì dòng của em ấy nằm mãi ở "Đang làm",
  và cô tưởng em ấy vẫn đang làm bài trong khi đã đóng máy từ lâu. Server đã
  suy ra đúng như vậy lúc dựng trang (`docLop`); màn hình sống phải tự làm lấy
  giữa hai lần tải trang.
*/
const NGUONG_MAT_KET_NOI_MS = 25_000;
const NGUONG_DA_ROI_MS = 60_000;

const THU_TU: Record<HocSinhTrongLop["trangThai"], number> = {
  "mat-ket-noi": 0,
  "dang-lam": 1,
  "da-nop": 2,
  "da-roi": 3,
};

function dongHo(giay: number): string {
  const g = Math.max(0, giay);
  return `${String(Math.floor(g / 60)).padStart(2, "0")}:${String(g % 60).padStart(2, "0")}`;
}

export default function BangLop({
  target,
  banDau,
}: {
  target: string;
  banDau: HocSinhTrongLop[];
}) {
  const [lop, setLop] = useState<HocSinhTrongLop[]>(banDau);
  const [noi, setNoi] = useState(false);
  // Socket nối được chỉ chứng minh tới được tiến trình admin. Cầu nối
  // LISTEN phía sau còn sống hay không là chuyện khác, và server nói cho biết.
  const [cauNoi, setCauNoi] = useState(true);
  const [hienKQ, setHienKQ] = useState(true);
  const [chon, setChon] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // attemptId -> lúc nhận nhịp gần nhất (ms). Khởi tạo từ ảnh chụp của server.
  const nhipCuoiRef = useRef<Map<string, number>>(
    new Map(
      banDau
        .filter((h) => h.lanCuoi)
        .map((h) => [h.attemptId, new Date(h.lanCuoi as string).getTime()])
    )
  );

  useEffect(() => {
    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setNoi(true);
      socket.emit("xem", target);
    });
    socket.on("disconnect", () => setNoi(false));
    socket.on("connect_error", () => setNoi(false));
    socket.on("cau-noi", (song: boolean) => setCauNoi(song));

    socket.on("nhip", (goi: GoiNhip) => {
      // So theo MÃ LỚP, không theo `target`: em làm passage lẻ có `target`
      // riêng nhưng vẫn thuộc lớp này.
      if ((goi.lop ?? goi.target) !== target) return;
      setLop((truoc) => {
        const dong: HocSinhTrongLop = {
          attemptId: goi.a,
          ten: goi.ten,
          khach: goi.khach,
          trangThai: goi.loai === "nop" ? "da-nop" : "dang-lam",
          daLam: goi.d,
          dung: goi.c,
          tong: goi.t,
          marks: goi.marks ?? [],
          conLai: goi.conLai,
          band: goi.band ?? null,
          phan: goi.phan ?? null,
          phamVi: goi.pham ?? "test",
          lanCuoi: new Date().toISOString(),
        };
        // Mốc nhịp cuối, để bộ đếm bên dưới biết em nào đã im lặng bao lâu.
        nhipCuoiRef.current.set(goi.a, Date.now());
        const i = truoc.findIndex((h) => h.attemptId === goi.a);
        if (i < 0) return [...truoc, dong];
        const sau = [...truoc];
        sau[i] = dong;
        return sau;
      });
    });

    return () => {
      socket.emit("thoi-xem", target);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [target]);

  /*
    Đồng hồ đếm lùi tại chỗ, mỗi giây, giữa hai nhịp.

    Không phải nguồn sự thật — nhịp kế tiếp mang con số từ `expires_at` của
    server về và ghi đè. Đây chỉ để số trên màn hình không đứng im 5 giây một
    lần rồi nhảy cóc.
  */
  useEffect(() => {
    const id = setInterval(() => {
      const bayGio = Date.now();
      setLop((truoc) =>
        truoc.map((h) => {
          if (h.trangThai === "da-nop") return h;

          const imLang = bayGio - (nhipCuoiRef.current.get(h.attemptId) ?? bayGio);
          const trangThai: HocSinhTrongLop["trangThai"] =
            imLang >= NGUONG_DA_ROI_MS
              ? "da-roi"
              : imLang >= NGUONG_MAT_KET_NOI_MS
                ? "mat-ket-noi"
                : "dang-lam";

          const conLai = h.conLai > 0 ? h.conLai - 1 : 0;
          if (trangThai === h.trangThai && conLai === h.conLai) return h;
          return { ...h, trangThai, conLai };
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const sapXep = useMemo(
    () => [...lop].sort((a, b) => THU_TU[a.trangThai] - THU_TU[b.trangThai]),
    [lop]
  );

  const dangLam = lop.filter((h) => h.trangThai === "dang-lam" || h.trangThai === "mat-ket-noi").length;
  const daNop = lop.filter((h) => h.trangThai === "da-nop");
  const trungBinh = daNop.length
    ? (daNop.reduce((t, h) => t + h.dung, 0) / daNop.length).toFixed(1).replace(".", ",")
    : "—";

  const emDangChon = chon ? lop.find((h) => h.attemptId === chon) : null;

  /*
    Bài làm chi tiết — nạp RIÊNG khi cô bấm mở một em.

    Không đi kèm dữ liệu bảng lớp vì hai lý do: bảng lớp cập nhật mỗi 5 giây
    còn đáp án thì không đổi, và đây là đường duy nhất trong cả dự án mà
    `answer_key` đi ra khỏi server — càng ít chỗ chạm vào nó càng tốt.
  */
  const [baiLam, setBaiLam] = useState<
    { so: number; daGo: string | null; dapAn: string | null }[] | null
  >(null);
  const [dangTaiBai, setDangTaiBai] = useState(false);

  useEffect(() => {
    if (!chon) {
      setBaiLam(null);
      return;
    }
    let con = true;
    setDangTaiBai(true);
    setBaiLam(null);
    fetch(`/api/luot/${chon}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (con && d) setBaiLam(d.cau);
      })
      .catch(() => {
        /* xem chi tiết hỏng thì bảng lớp vẫn phải chạy */
      })
      .finally(() => con && setDangTaiBai(false));
    return () => {
      con = false;
    };
  }, [chon]);

  /*
    Đếm thẳng từ `marks`, KHÔNG lấy hiệu số.

    "Sai = đã làm − đúng" nghe thì đúng, nhưng với bài đã nộp thì `daLam` bằng
    tổng số câu (chấm cả bài), nên câu bỏ trống bị cộng vào ô "Sai" và ô "Chưa
    làm" luôn bằng 0. Đo được: một em trả lời 20/40 câu hiện thành "16 đúng,
    24 sai, 0 chưa làm".

    Về điểm thì bỏ trống cũng không được điểm, nhưng trên màn hình của cô hai
    thứ đó khác hẳn: sai là hiểu nhầm, bỏ trống là không kịp giờ.
  */
  const dem = useMemo(() => {
    const marks = emDangChon?.marks ?? [];
    const tong = emDangChon?.tong ?? 0;
    const dung = marks.filter((m) => m === true).length;
    const sai = marks.filter((m) => m === false).length;
    return { dung, sai, trong: Math.max(0, tong - dung - sai) };
  }, [emDangChon]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-end gap-6 px-5 py-4 border-b border-black/5">
          <div className="mr-auto flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${noi && cauNoi ? "bg-[#157F3D]" : "bg-[#B26A00]"}`}
              aria-hidden
            />
            <span className="text-xs font-bold text-[#1A1A1A]/60">
              {!noi
                ? "Mất kết nối — tải lại trang để xem số mới nhất"
                : !cauNoi
                  ? "Đường tới máy chủ dữ liệu đang đứt — số trên bảng có thể cũ"
                  : "Đang nhận trực tiếp"}
            </span>
          </div>
          <Stat so={String(dangLam)} nhan="Đang làm" />
          <Stat so={String(daNop.length)} nhan="Đã nộp" />
          <Stat so={trungBinh} nhan="Đúng TB" />
          <label className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]/60 cursor-pointer">
            <input
              type="checkbox"
              checked={hienKQ}
              onChange={(e) => setHienKQ(e.target.checked)}
              className="accent-[#14532D] h-4 w-4 cursor-pointer"
            />
            Hiện đúng / sai
          </label>
        </div>

        {sapXep.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#1A1A1A]/45">
            Chưa có học viên nào vào làm đề này.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/40">
                <th className="text-left font-bold px-5 py-2.5 w-[30%]">Học viên</th>
                <th className="text-left font-bold px-5 py-2.5 whitespace-nowrap">Trạng thái</th>
                <th className="text-left font-bold px-5 py-2.5 w-full">Từng câu</th>
                <th className="text-right font-bold px-5 py-2.5">Đúng</th>
                <th className="text-right font-bold px-5 py-2.5">Còn lại</th>
              </tr>
            </thead>
            <tbody>
              {sapXep.map((h) => (
                <tr
                  key={h.attemptId}
                  onClick={() => setChon(chon === h.attemptId ? null : h.attemptId)}
                  className={`border-t border-black/5 cursor-pointer hover:bg-black/[0.02] ${
                    chon === h.attemptId ? "bg-black/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <span className="block text-sm font-bold text-[#1A1A1A] whitespace-nowrap">
                      {h.ten}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {h.khach && (
                        <span className="text-[10px] uppercase font-bold tracking-wide text-[#1A1A1A]/40">
                          Khách
                        </span>
                      )}
                      {/*
                        Nói rõ em ấy làm CẢ BÀI hay một passage lẻ.

                        Không có dòng này thì hai em cùng lớp, một em 40 câu một
                        em 13 câu, nhìn giống hệt nhau — mà "11/14" với "27/40"
                        thì không so được với nhau. Cô nhìn vào tưởng dữ liệu sai.
                      */}
                      <span className="text-[10px] text-[#1A1A1A]/45 whitespace-nowrap">
                        {h.phamVi === "paper" ? `Chỉ ${h.phan ?? "1 phần"}` : "Cả bài"} ·{" "}
                        {h.tong} câu
                        {/* "Đang ở đâu" chỉ có nghĩa khi em ấy còn đang làm. Nộp
                            rồi mà vẫn ghi "đang ở Passage 3" là nói sai. */}
                        {h.trangThai !== "da-nop" && h.phamVi === "test" && h.phan
                          ? ` · ${h.phan}`
                          : ""}
                      </span>
                    </span>
                  </td>
                  <td className={`px-5 py-3 text-xs font-bold ${MAU[h.trangThai]}`}>
                    {NHAN[h.trangThai]}
                  </td>
                  <td className="px-5 py-3">
                    <Dai marks={h.marks} tong={h.tong} hienKQ={hienKQ} mo={h.trangThai === "mat-ket-noi"} />
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold tabular-nums whitespace-nowrap">
                    {h.trangThai === "da-nop" ? (
                      <>
                        {h.dung}
                        <span className="text-[#1A1A1A]/40 font-medium">/{h.tong}</span>
                        {h.band !== null && (
                          <span className="ml-2 rounded bg-[#E6EAFF] px-1.5 py-0.5 text-[11px] text-[#3D5AFE]">
                            {h.band.toFixed(1)}
                          </span>
                        )}
                      </>
                    ) : hienKQ ? (
                      <>
                        {h.dung}
                        <span className="text-[#1A1A1A]/40 font-medium">/{h.daLam}</span>
                      </>
                    ) : (
                      <>
                        {h.daLam}
                        <span className="text-[#1A1A1A]/40 font-medium">/{h.tong}</span>
                      </>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold tabular-nums whitespace-nowrap">
                    {h.trangThai === "da-nop" ? (
                      <span className="text-[#1A1A1A]/35">—</span>
                    ) : (
                      <span className={h.conLai < 300 ? "text-[#C62828]" : ""}>{dongHo(h.conLai)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        {!emDangChon ? (
          <p className="text-center text-xs text-[#1A1A1A]/45 py-8">
            Bấm một dòng để xem em ấy làm từng câu ra sao.
          </p>
        ) : (
          <>
            <h2 className="font-serif text-lg font-black text-[#1A1A1A]">{emDangChon.ten}</h2>
            <p className="text-[11px] text-[#1A1A1A]/45 mb-4">
              {emDangChon.khach ? "Khách vãng lai" : "Tài khoản"} · {NHAN[emDangChon.trangThai]}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Stat so={String(dem.dung)} nhan="Đúng" />
              <Stat so={String(dem.sai)} nhan="Sai" />
              <Stat so={String(dem.trong)} nhan="Chưa làm" />
            </div>
            {dangTaiBai && <p className="text-xs text-[#1A1A1A]/40">Đang tải bài làm...</p>}

            {baiLam ? (
              <div className="-mx-1">
                {baiLam.map((c, i) => {
                  const m = emDangChon.marks[i] ?? null;
                  return (
                    <div
                      key={c.so}
                      className="grid grid-cols-[26px_1fr_20px] gap-2 items-baseline px-1 py-1.5 border-b border-black/5 text-[13px]"
                    >
                      <span className="tabular-nums text-[11px] font-bold text-[#1A1A1A]/35">
                        {c.so}
                      </span>
                      <span className="min-w-0 break-words">
                        {c.daGo ?? <em className="not-italic text-[#1A1A1A]/35">chưa trả lời</em>}
                        {/* Đáp án đúng chỉ hiện khi em ấy sai — em làm đúng rồi
                            thì nhắc lại đáp án chỉ tổ chiếm chỗ. */}
                        {m === false && c.dapAn && (
                          <span className="block text-[11px] text-[#157F3D] mt-0.5">
                            đáp án: {c.dapAn}
                          </span>
                        )}
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-black ${
                          m === null
                            ? "bg-black/[0.04] text-[#1A1A1A]/30"
                            : m
                              ? "bg-[#E3F4E8] text-[#157F3D]"
                              : "bg-[#FBE6E6] text-[#C62828]"
                        }`}
                      >
                        {m === null ? "–" : m ? "✓" : "✕"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Chưa tải xong thì vẫn vẽ dải ô, để cô không nhìn vào khoảng trống.
              <div className="grid grid-cols-[repeat(8,1fr)] gap-1">
                {Array.from({ length: emDangChon.tong }, (_, i) => {
                  const m = emDangChon.marks[i] ?? null;
                  return (
                    <span
                      key={i}
                      className={`flex h-7 items-center justify-center rounded text-[11px] font-bold ${
                        m === null
                          ? "bg-black/5 text-[#1A1A1A]/35"
                          : m
                            ? "bg-[#E3F4E8] text-[#157F3D]"
                            : "bg-[#FBE6E6] text-[#C62828]"
                      }`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ so, nhan }: { so: string; nhan: string }) {
  return (
    <span className="block">
      <b className="block font-serif text-2xl font-black text-[#1A1A1A] tabular-nums leading-tight">
        {so}
      </b>
      <span className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/40">
        {nhan}
      </span>
    </span>
  );
}

/** Dải ô, mỗi câu một ô. Con số nói được bao nhiêu; dải nói được ở chỗ nào. */
function Dai({
  marks,
  tong,
  hienKQ,
  mo,
}: {
  marks: (boolean | null)[];
  tong: number;
  hienKQ: boolean;
  mo: boolean;
}) {
  /*
    Ô có bề rộng CỐ ĐỊNH, không kéo giãn cho vừa cột.

    Trước đây mỗi dải đều giãn ra bằng nhau, nên bài 13 câu và bài 40 câu dài
    y hệt — chỉ khác độ mập của ô, mà mắt thì không đọc ra điều đó. Cô nhìn hai
    dòng thấy giống nhau nhưng con số một bên là 11/14 còn bên kia 27/40, và
    kết luận là màn hình hiển thị sai.

    Cố định bề rộng thì độ dài dải CHÍNH LÀ số câu: nhìn một cái là biết em nào
    làm cả bài, em nào làm một passage.
  */
  return (
    <span
      className={`grid gap-[2px] ${mo ? "opacity-40" : ""}`}
      style={{ gridTemplateColumns: `repeat(${Math.max(1, tong)}, 6px)` }}
    >
      {Array.from({ length: tong }, (_, i) => {
        const m = marks[i] ?? null;
        const mau =
          m === null
            ? "bg-black/15"
            : hienKQ
              ? m
                ? "bg-[#157F3D]"
                : "bg-[#C62828]"
              : "bg-[#1A1A1A]/60";
        return <span key={i} className={`block h-4 rounded-[2px] ${mau}`} />;
      })}
    </span>
  );
}
