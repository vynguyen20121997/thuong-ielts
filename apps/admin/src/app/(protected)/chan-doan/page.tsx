"use client";

import { useCallback, useEffect, useState } from "react";

type Diem = { Listening: number; Reading: number; Grammar: number } | null;

type Luot = {
  id: string;
  ten: string | null;
  email: string | null;
  mucTieu: string | null;
  nopLuc: string;
  tuNop: boolean;
  diem: Diem;
  phienBanDe: string;
  phienBanQuyTac: string | null;
  soLanChamLai: number;
  lacHau: boolean;
};

type LichSu = {
  id: number;
  luc: string;
  giaoVien: string;
  lyDo: string;
  deTruoc: string | null;
  deSau: string | null;
  quyTacTruoc: string | null;
  quyTacSau: string | null;
  diemTruoc: Diem;
  diemSau: Diem;
};

type ChiTiet = {
  id: string;
  hoSo: Record<string, string | number | boolean | null>;
  nopLuc: string;
  tuNop: boolean;
  diem: Diem;
  boTrong: number;
  phienBanDe: string;
  phienBanQuyTac: string | null;
  deHienHanh: string;
  quyTacHienHanh: string;
  lichSu: LichSu[];
};

const gio = (iso: string) => new Date(iso).toLocaleString("vi-VN");
const bangDiem = (d: Diem) =>
  d ? `L ${d.Listening}/20 · R ${d.Reading}/13 · G ${d.Grammar}/20` : "—";

function ChiTietLuot({ id, onDoi }: { id: string; onDoi: () => void }) {
  const [data, setData] = useState<ChiTiet | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [dangCham, setDangCham] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<string | null>(null);

  const tai = useCallback(() => {
    fetch(`/api/chan-doan/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setLoi("Không tải được lượt làm."));
  }, [id]);

  useEffect(tai, [tai]);

  if (loi && !data) return <p className="mt-4 text-sm text-red-600">{loi}</p>;
  if (!data) return <p className="mt-4 text-sm text-[#1A1A1A]/50">Đang tải…</p>;

  const lacHau =
    data.phienBanDe !== data.deHienHanh ||
    data.phienBanQuyTac !== data.quyTacHienHanh;

  const chamLai = async () => {
    setDangCham(true);
    setLoi(null);
    setKetQua(null);
    const res = await fetch(`/api/chan-doan/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: lyDo }),
    });
    const body = await res.json().catch(() => ({}));
    setDangCham(false);
    if (!res.ok) {
      setLoi(body.error ?? "Chấm lại thất bại.");
      return;
    }
    const lac = (body.cauLac ?? []) as string[];
    setKetQua(
      (body.doiDiem
        ? `Điểm đã đổi: ${bangDiem(body.diemTruoc)} → ${bangDiem(body.diemSau)}`
        : "Chấm lại xong, điểm không đổi.") +
        (lac.length ? ` (${lac.length} câu không còn trong đề: ${lac.join(", ")})` : ""),
    );
    setLyDo("");
    tai();
    onDoi();
  };

  return (
    <div className="mt-4 space-y-5 border-t border-black/10 pt-4">
      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {[
          ["Email", data.hoSo.email],
          ["Điện thoại", data.hoSo.phone || "—"],
          ["Trình độ tự khai", data.hoSo.level],
          ["Mục tiêu", data.hoSo.target],
          ["Dự kiến thi", data.hoSo.examMonth || data.hoSo.examTiming],
          ["Tự học mỗi ngày", `${data.hoSo.dailyMinutes || "?"} phút`],
          ["Nhận tư vấn", data.hoSo.contactOptIn ? "Có" : "Không"],
          ["Câu bỏ trống", data.boTrong],
        ].map(([nhan, giaTri]) => (
          <div key={String(nhan)} className="flex gap-2">
            <dt className="text-[#1A1A1A]/50">{nhan}:</dt>
            <dd className="font-medium">{String(giaTri ?? "—")}</dd>
          </div>
        ))}
      </dl>

      <div
        className={`rounded-xl border p-4 ${
          lacHau ? "border-amber-300 bg-amber-50" : "border-black/10 bg-black/[0.02]"
        }`}
      >
        <p className="text-sm">
          Chấm theo đề <b>{data.phienBanDe}</b>, quy tắc{" "}
          <b>{data.phienBanQuyTac ?? "chưa ghi"}</b>.{" "}
          {lacHau
            ? `Hiện hành là ${data.deHienHanh} / ${data.quyTacHienHanh}.`
            : "Đang khớp bản hiện hành."}
        </p>
        {/*
          Chấm lại là thao tác duy nhất đổi được kết quả đã trả cho học sinh, nên
          nó phải là một hành động có chủ đích: gõ lý do trước, rồi mới bấm.
        */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
            placeholder="Lý do chấm lại (bắt buộc)"
            className="min-w-64 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-[#14532D] focus:outline-none"
          />
          <button
            onClick={chamLai}
            disabled={dangCham || lyDo.trim().length < 5}
            className="cursor-pointer rounded-lg bg-[#14532D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {dangCham ? "Đang chấm lại…" : "Chấm lại theo đề hiện hành"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#1A1A1A]/50">
          Chấm lại chỉ áp đề hiện hành lên đúng những gì học viên đã gõ. Đáp án
          của em không bị sửa, và bản kết quả cũ được giữ lại trong lịch sử.
        </p>
        {loi && <p className="mt-2 text-sm text-red-600">{loi}</p>}
        {ketQua && <p className="mt-2 text-sm font-semibold text-[#14532D]">{ketQua}</p>}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50">
          Lịch sử chấm lại
        </h4>
        {data.lichSu.length === 0 ? (
          <p className="text-sm text-[#1A1A1A]/50">
            Chưa chấm lại lần nào — kết quả vẫn đúng như lúc học viên nộp.
          </p>
        ) : (
          <ol className="space-y-2">
            {data.lichSu.map((m) => (
              <li key={m.id} className="rounded-xl border border-black/10 p-3 text-sm">
                <p className="font-semibold">
                  {gio(m.luc)} · {m.giaoVien}
                </p>
                <p className="mt-1">{m.lyDo}</p>
                <p className="mt-1 text-xs text-[#1A1A1A]/60">
                  Điểm {bangDiem(m.diemTruoc)} → {bangDiem(m.diemSau)} · Đề{" "}
                  {m.deTruoc ?? "?"} → {m.deSau ?? "?"} · Quy tắc{" "}
                  {m.quyTacTruoc ?? "chưa ghi"} → {m.quyTacSau ?? "?"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function TrangChanDoan() {
  const [luot, setLuot] = useState<Luot[]>([]);
  const [hienHanh, setHienHanh] = useState({ de: "", quyTac: "" });
  const [dangTai, setDangTai] = useState(true);
  const [mo, setMo] = useState<string | null>(null);
  const [chiLacHau, setChiLacHau] = useState(false);

  const tai = useCallback(() => {
    fetch("/api/chan-doan")
      .then((r) => r.json())
      .then((d) => {
        setLuot(d.luot ?? []);
        setHienHanh({ de: d.deHienHanh, quyTac: d.quyTacHienHanh });
      })
      .catch(() => setLuot([]))
      .finally(() => setDangTai(false));
  }, []);

  useEffect(tai, [tai]);

  const danhSach = chiLacHau ? luot.filter((l) => l.lacHau) : luot;
  const soLacHau = luot.filter((l) => l.lacHau).length;

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-[#1A1A1A]">
        Bài kiểm tra nền IELTS
      </h1>
      <p className="mb-6 text-sm text-[#1A1A1A]/50">
        Đề hiện hành {hienHanh.de || "…"} · quy tắc nhận xét{" "}
        {hienHanh.quyTac || "…"}. Sửa đề hay đáp án không tự làm đổi kết quả cũ;
        muốn đổi thì chấm lại từng lượt và ghi lý do.
      </p>

      {soLacHau > 0 && (
        <label className="mb-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={chiLacHau}
            onChange={(e) => setChiLacHau(e.target.checked)}
          />
          Chỉ hiện {soLacHau} lượt đang chấm theo bản cũ
        </label>
      )}

      {dangTai ? (
        <p className="text-sm text-[#1A1A1A]/50">Đang tải…</p>
      ) : danhSach.length === 0 ? (
        <p className="text-sm text-[#1A1A1A]/50">Chưa có lượt nào đã nộp.</p>
      ) : (
        <div className="space-y-3">
          {danhSach.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-black/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">
                    {l.ten ?? "Không tên"}{" "}
                    {l.mucTieu && (
                      <span className="text-sm font-medium text-[#1A1A1A]/50">
                        · mục tiêu {l.mucTieu}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/50">
                    {gio(l.nopLuc)}
                    {l.tuNop && " · tự nộp khi hết giờ"}
                    {l.soLanChamLai > 0 && ` · đã chấm lại ${l.soLanChamLai} lần`}
                  </p>
                  <p className="mt-1 font-mono text-sm">{bangDiem(l.diem)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {l.lacHau && (
                    <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                      Bản cũ
                    </span>
                  )}
                  <button
                    onClick={() => setMo(mo === l.id ? null : l.id)}
                    className="cursor-pointer rounded-lg border border-black/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-black/5"
                  >
                    {mo === l.id ? "Đóng" : "Mở"}
                  </button>
                </div>
              </div>
              {mo === l.id && <ChiTietLuot id={l.id} onDoi={tai} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
