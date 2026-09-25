"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  HocVienTrongLop,
  LanDong,
  Lop,
  NhanXet,
  TaiKhoanNhan,
} from "../../../../lib/hocVienKieu";
import { NGAN_HANG, NHAN_HINH_THUC } from "../../../../lib/hocVienKieu";
import { dinhDangTien, nhanKy } from "../../../../lib/tien";

/**
 * Ruột của trang lớp: sổ điểm danh, học phí, nhận xét.
 *
 * Một component chứ không ba, vì ba tab dùng chung đúng một danh sách học
 * viên và một cơ chế lưu. Tách ra thì mỗi lần thêm người phải nhớ làm mới cả
 * ba chỗ.
 *
 * Sau mỗi lần lưu gọi `router.refresh()` — server đọc lại DB rồi vẽ lại. Giữ
 * một bản sao trong state và tự sửa cho nhanh là mở đường cho ngày màn hình
 * nói một đằng còn DB một nẻo, mà ở đây con số là TIỀN.
 */

type Tab = "so" | "tien" | "nhan-xet";

export default function BangLopHoc({
  lop,
  ky,
  theoKy,
  hocVien,
  lanDong,
  chuaVao,
  nhanXet,
  taiKhoan,
}: {
  lop: Lop;
  ky: string | null;
  theoKy: boolean;
  hocVien: HocVienTrongLop[];
  lanDong: LanDong[];
  chuaVao: { id: string; ten: string; email: string | null }[];
  nhanXet: NhanXet[];
  taiKhoan: TaiKhoanNhan;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("so");
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const dangLuuRef = useRef(false);
  const [dangXem, setDangXem] = useState<string | null>(
    hocVien[0]?.studentId ?? null,
  );

  async function goi(
    duongDan: string,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ): Promise<boolean> {
    if (dangLuuRef.current) return false;
    dangLuuRef.current = true;
    setDangLuu(true);
    setLoi("");
    try {
      const res = await fetch(duongDan, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoi(data.error ?? "Không lưu được.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setLoi("Mất mạng giữa chừng. Thử lại giúp cô.");
      return false;
    } finally {
      dangLuuRef.current = false;
      setDangLuu(false);
    }
  }

  const tomTatChoXacNhan = lanDong.filter((d) => d.status === "cho_xac_nhan").length;
  const dangHoc = hocVien.filter((h) => !h.leftOn);
  const daNghi = hocVien.filter((h) => h.leftOn);
  const emDangXem = hocVien.find((h) => h.studentId === dangXem) ?? null;
  const nhanXetCuaEm = nhanXet.filter((n) => n.studentId === dangXem);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist">
        {(
          [
            ["so", `Sổ lớp · ${dangHoc.length}`],
            [
              "tien",
              tomTatChoXacNhan > 0
                ? `Học phí · ${tomTatChoXacNhan} chờ duyệt`
                : "Học phí",
            ],
            ["nhan-xet", `Nhận xét · ${nhanXet.length}`],
          ] as [Tab, string][]
        ).map(([id, nhan]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors cursor-pointer ${
              tab === id
                ? "bg-[#14532D] text-white"
                : "bg-black/5 text-[#1A1A1A]/70 hover:bg-black/10"
            }`}
          >
            {nhan}
          </button>
        ))}

        {theoKy && (
          <label className="ml-auto flex items-center gap-2 text-xs font-bold text-[#1A1A1A]/70">
            Kỳ
            <input
              type="month"
              defaultValue={ky ?? ""}
              onChange={(e) => {
                /* Kỳ nằm trên URL: xem ghi chú ở page.tsx. */
                if (e.target.value)
                  router.push(`/hoc-vien/${lop.id}?ky=${e.target.value}`);
              }}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm font-mono font-normal"
            />
          </label>
        )}
      </div>

      {loi && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {loi}
        </p>
      )}

      {tab === "so" && (
        <SoLop
          lop={lop}
          ky={ky}
          theoKy={theoKy}
          dangHoc={dangHoc}
          daNghi={daNghi}
          chuaVao={chuaVao}
          dangLuu={dangLuu}
          goi={goi}
        />
      )}

      {tab === "tien" && (
        <HocPhi
          lop={lop}
          ky={ky}
          theoKy={theoKy}
          dangHoc={dangHoc}
          lanDong={lanDong}
          taiKhoan={taiKhoan}
          dangLuu={dangLuu}
          goi={goi}
        />
      )}

      {tab === "nhan-xet" && (
        <NhanXetTab
          lop={lop}
          hocVien={hocVien}
          dangXem={dangXem}
          setDangXem={setDangXem}
          emDangXem={emDangXem}
          danhSach={nhanXetCuaEm}
          dangLuu={dangLuu}
          goi={goi}
        />
      )}
    </div>
  );
}

type Goi = (
  duongDan: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) => Promise<boolean>;

/* ── Sổ lớp ──────────────────────────────────────────────────────────────── */

function SoLop({
  lop,
  ky,
  theoKy,
  dangHoc,
  daNghi,
  chuaVao,
  dangLuu,
  goi,
}: {
  lop: Lop;
  ky: string | null;
  theoKy: boolean;
  dangHoc: HocVienTrongLop[];
  daNghi: HocVienTrongLop[];
  chuaVao: { id: string; ten: string; email: string | null }[];
  dangLuu: boolean;
  goi: Goi;
}) {
  const [them, setThem] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-[#1A1A1A]/60">
              <th className="px-4 py-3 font-bold">Học viên</th>
              <th className="px-4 py-3 font-bold">Học phí (đ)</th>
              {theoKy && (
                <th className="px-4 py-3 font-bold">{nhanKy(ky)}</th>
              )}
              <th className="px-4 py-3 font-bold">Đã đóng (đ)</th>
              <th className="px-4 py-3 font-bold">Luyện đề</th>
              <th className="px-4 py-3 font-bold" />
            </tr>
          </thead>
          <tbody>
            {dangHoc.length === 0 && (
              <tr>
                <td
                  colSpan={theoKy ? 6 : 5}
                  className="px-4 py-10 text-center text-[#1A1A1A]/60"
                >
                  Lớp chưa có học viên nào.
                </td>
              </tr>
            )}
            {dangHoc.map((h) => (
              <tr key={h.studentId} className="border-b border-black/5">
                <td className="px-4 py-3">
                  <b className="block text-[#1A1A1A]">{h.ten}</b>
                  <span className="text-xs text-[#1A1A1A]/60">
                    {h.email ?? h.phone ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">
                  {dinhDangTien(h.hocPhi)}
                  {h.tuitionOverride !== null && (
                    <span className="ml-1.5 rounded bg-[#14532D]/10 px-1.5 py-0.5 text-[10px] font-sans font-bold text-[#14532D]">
                      riêng
                    </span>
                  )}
                </td>
                {theoKy && (
                  <td className="px-4 py-3">
                    {h.daDongKyNay ? (
                      <span className="font-bold text-[#14532D]">Đã đóng</span>
                    ) : (
                      <span className="font-bold text-[#B45309]">Chưa</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-[#1A1A1A]/70">
                  {dinhDangTien(h.daDong)}
                </td>
                <td className="px-4 py-3 text-xs text-[#1A1A1A]/70">
                  {h.soLuotLam > 0 ? (
                    <>
                      {h.soLuotLam} lượt
                      {h.lanLamCuoi && (
                        <span className="block text-[#1A1A1A]/50">
                          {new Date(h.lanLamCuoi).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </>
                  ) : (
                    /* Chưa luyện lần nào là thông tin cô CẦN, không phải ô trống. */
                    <span className="text-[#B45309]">Chưa làm bài nào</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      const so = window.prompt(
                        `Mức học phí riêng cho ${h.ten} (để trống = theo lớp):`,
                        h.tuitionOverride === null ? "" : String(h.tuitionOverride),
                      );
                      if (so === null) return;
                      void goi(
                        `/api/hoc-vien/lop/${lop.id}/thanh-vien`,
                        "PATCH",
                        { studentId: h.studentId, tuitionOverride: so || null },
                      );
                    }}
                    className="text-xs font-bold text-[#14532D] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    Mức riêng
                  </button>
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Cho ${h.ten} nghỉ lớp này? Học phí đã đóng và nhận xét cũ vẫn giữ nguyên.`,
                        )
                      )
                        return;
                      void goi(
                        `/api/hoc-vien/lop/${lop.id}/thanh-vien`,
                        "PATCH",
                        {
                          studentId: h.studentId,
                          leftOn: new Date().toISOString().slice(0, 10),
                        },
                      );
                    }}
                    className="ml-3 text-xs font-bold text-[#1A1A1A]/50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                  >
                    Cho nghỉ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
          Thêm học viên vào lớp
        </p>
        {chuaVao.length === 0 ? (
          <p className="text-sm text-[#1A1A1A]/70">
            Mọi học viên có tài khoản đều đã ở trong lớp này. Học viên mới phải
            tự đăng nhập một lần trên trang chính thì mới có tài khoản để thêm.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            <select
              value={them}
              onChange={(e) => setThem(e.target.value)}
              className="min-w-[240px] flex-1 rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
            >
              <option value="">— Chọn học viên —</option>
              {chuaVao.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ten}
                  {s.email ? ` · ${s.email}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!them || dangLuu}
              onClick={async () => {
                const xong = await goi(
                  `/api/hoc-vien/lop/${lop.id}/thanh-vien`,
                  "POST",
                  { studentId: them },
                );
                if (xong) setThem("");
              }}
              className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
            >
              Thêm vào lớp
            </button>
          </div>
        )}
      </div>

      {daNghi.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/50">
            Đã nghỉ · {daNghi.length}
          </p>
          <ul className="flex flex-col gap-1.5">
            {daNghi.map((h) => (
              <li
                key={h.studentId}
                className="flex flex-wrap items-baseline gap-3 rounded-xl border border-black/10 px-4 py-2.5 text-sm"
              >
                <b className="text-[#1A1A1A]/70">{h.ten}</b>
                <span className="text-xs text-[#1A1A1A]/50">
                  nghỉ {h.leftOn} · đã đóng {dinhDangTien(h.daDong)} đ
                </span>
                <button
                  type="button"
                  disabled={dangLuu}
                  onClick={() =>
                    void goi(`/api/hoc-vien/lop/${lop.id}/thanh-vien`, "PATCH", {
                      studentId: h.studentId,
                      leftOn: null,
                    })
                  }
                  className="ml-auto text-xs font-bold text-[#14532D] hover:underline cursor-pointer"
                >
                  Nhận lại
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Học phí ─────────────────────────────────────────────────────────────── */

function HocPhi({
  lop,
  ky,
  theoKy,
  dangHoc,
  lanDong,
  taiKhoan,
  dangLuu,
  goi,
}: {
  lop: Lop;
  ky: string | null;
  theoKy: boolean;
  dangHoc: HocVienTrongLop[];
  lanDong: LanDong[];
  taiKhoan: TaiKhoanNhan;
  dangLuu: boolean;
  goi: Goi;
}) {
  const [em, setEm] = useState("");
  const chon = dangHoc.find((h) => h.studentId === em);

  return (
    <div className="flex flex-col gap-6">
      <TaiKhoan taiKhoan={taiKhoan} dangLuu={dangLuu} goi={goi} />

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const xong = await goi(`/api/hoc-vien/lop/${lop.id}/hoc-phi`, "POST", {
            studentId: f.get("studentId"),
            amount: f.get("amount"),
            paidOn: f.get("paidOn"),
            period: theoKy ? f.get("period") : null,
            method: f.get("method"),
            note: f.get("note"),
          });
          if (xong) {
            (e.target as HTMLFormElement).reset();
            setEm("");
          }
        }}
        className="rounded-2xl border border-black/10 bg-white p-5"
      >
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
          Ghi nhận đóng học phí
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
              Học viên
            </span>
            <select
              name="studentId"
              required
              value={em}
              onChange={(e) => setEm(e.target.value)}
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
            >
              <option value="">— Chọn —</option>
              {dangHoc.map((h) => (
                <option key={h.studentId} value={h.studentId}>
                  {h.ten}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
              Số tiền (đ)
            </span>
            {/*
              Điền sẵn đúng mức của em ấy — mức riêng nếu có, không thì mức
              lớp. Cô vẫn sửa được: có buổi thu thiếu, có buổi đóng bù.
            */}
            <input
              key={em}
              name="amount"
              required
              inputMode="numeric"
              defaultValue={chon?.hocPhi ?? lop.tuitionAmount ?? ""}
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm font-mono"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
              Ngày đóng
            </span>
            <input
              type="date"
              name="paidOn"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
            />
          </label>
          {theoKy ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
                Cho kỳ
              </span>
              <input
                type="month"
                name="period"
                defaultValue={ky ?? ""}
                className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm font-mono"
              />
            </label>
          ) : (
            <p className="self-end text-xs text-[#1A1A1A]/60">
              Lớp thu trọn khoá nên không ghi kỳ.
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
              Hình thức
            </span>
            <select
              name="method"
              defaultValue="chuyen_khoan"
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
            >
              {Object.entries(NHAN_HINH_THUC).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
              Ghi chú
            </span>
            <input
              name="note"
              maxLength={300}
              placeholder="Đóng bù buổi nghỉ, giảm 10%…"
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={dangLuu}
          className="mt-4 rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
        >
          {dangLuu ? "Đang lưu…" : "Ghi nhận"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-[#1A1A1A]/60">
              <th className="px-4 py-3 font-bold">Ngày</th>
              <th className="px-4 py-3 font-bold">Học viên</th>
              <th className="px-4 py-3 font-bold">Số tiền (đ)</th>
              <th className="px-4 py-3 font-bold">Cho kỳ</th>
              <th className="px-4 py-3 font-bold">Hình thức</th>
              <th className="px-4 py-3 font-bold" />
            </tr>
          </thead>
          <tbody>
            {lanDong.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#1A1A1A]/60">
                  Chưa ghi nhận lần đóng nào.
                </td>
              </tr>
            )}
            {lanDong.map((d) => (
              <tr key={d.id} className="border-b border-black/5">
                <td className="px-4 py-3 font-mono text-xs">{d.paidOn}</td>
                <td className="px-4 py-3 font-bold text-[#1A1A1A]">{d.ten}</td>
                <td className="px-4 py-3 font-mono">
                  <span
                    className={
                      d.status === "da_xac_nhan"
                        ? "text-[#14532D]"
                        : "text-[#B45309]"
                    }
                  >
                    {dinhDangTien(d.amount)}
                  </span>
                  {d.status === "cho_xac_nhan" && (
                    <span className="mt-0.5 block font-sans text-[10px] font-bold text-[#B45309]">
                      {d.declaredBy === "hoc_vien" ? "HV báo" : "Chờ"} · chưa vào sổ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[#1A1A1A]/70">
                  {nhanKy(d.period)}
                </td>
                <td className="px-4 py-3 text-xs text-[#1A1A1A]/70">
                  {NHAN_HINH_THUC[d.method]}
                  {d.note && (
                    <span className="block text-[#1A1A1A]/50">{d.note}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {d.status === "cho_xac_nhan" && (
                    /*
                      Chỉ bấm sau khi đã NHÌN THẤY tiền trong sao kê. Nút này
                      là lời của con người, không phải của máy — không có
                      đường nối nào tới ngân hàng ở đây.
                    */
                    <button
                      type="button"
                      disabled={dangLuu}
                      onClick={() => {
                        const so = window.prompt(
                          `${d.ten} báo đã chuyển ${dinhDangTien(d.amount)} đ.

Sửa lại nếu sao kê ghi số khác, rồi bấm OK để xác nhận:`,
                          String(d.amount),
                        );
                        if (so === null) return;
                        void goi(`/api/hoc-vien/lop/${lop.id}/hoc-phi`, "PATCH", {
                          paymentId: d.id,
                          amount: so,
                        });
                      }}
                      className="mr-3 rounded-full bg-[#14532D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#052E16] disabled:opacity-50 cursor-pointer"
                    >
                      Xác nhận
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Xoá lần đóng ${dinhDangTien(d.amount)} đ của ${d.ten}? Thao tác này không hoàn lại được.`,
                        )
                      )
                        return;
                      void goi(`/api/hoc-vien/lop/${lop.id}/hoc-phi`, "DELETE", {
                        paymentId: d.id,
                      });
                    }}
                    className="text-xs font-bold text-[#1A1A1A]/50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Nhận xét ────────────────────────────────────────────────────────────── */

function NhanXetTab({
  lop,
  hocVien,
  dangXem,
  setDangXem,
  emDangXem,
  danhSach,
  dangLuu,
  goi,
}: {
  lop: Lop;
  hocVien: HocVienTrongLop[];
  dangXem: string | null;
  setDangXem: (v: string) => void;
  emDangXem: HocVienTrongLop | null;
  danhSach: NhanXet[];
  dangLuu: boolean;
  goi: Goi;
}) {
  if (hocVien.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center text-sm text-[#1A1A1A]/60">
        Thêm học viên vào lớp trước đã.
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <nav aria-label="Chọn học viên" className="flex flex-col gap-1">
        {hocVien.map((h) => (
          <button
            key={h.studentId}
            type="button"
            aria-current={dangXem === h.studentId}
            onClick={() => setDangXem(h.studentId)}
            className={`rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors cursor-pointer ${
              dangXem === h.studentId
                ? "bg-[#14532D] text-white"
                : "text-[#1A1A1A]/70 hover:bg-black/5"
            }`}
          >
            {h.ten}
            <span
              className={`block text-xs font-normal ${
                dangXem === h.studentId ? "text-white/70" : "text-[#1A1A1A]/50"
              }`}
            >
              {h.soNhanXet} nhận xét
              {h.leftOn ? " · đã nghỉ" : ""}
            </span>
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const xong = await goi("/api/hoc-vien/nhan-xet", "POST", {
              studentId: dangXem,
              classId: lop.id,
              body: f.get("body"),
            });
            if (xong) (e.target as HTMLFormElement).reset();
          }}
          className="rounded-2xl border border-black/10 bg-white p-5"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
            Nhận xét về {emDangXem?.ten ?? "học viên"}
          </p>
          <textarea
            name="body"
            required
            rows={4}
            maxLength={4000}
            placeholder="Em nắm ngữ pháp cơ bản tốt nhưng đọc dài là nản, cần luyện skimming trước khi lên đề Cam 15…"
            className="w-full resize-y rounded-xl border border-black/15 px-3.5 py-3 text-sm leading-relaxed"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={dangLuu || !dangXem}
              className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
            >
              {dangLuu ? "Đang lưu…" : "Lưu nhận xét"}
            </button>
            {/*
              Nói thẳng mặc định là riêng tư, ngay cạnh nút lưu. Đây là chỗ cô
              ghi những câu thật lòng; đoán nhầm chiều riêng tư một lần là hỏng
              cả lòng tin vào trang.
            */}
            <span className="text-xs text-[#1A1A1A]/60">
              Chỉ cô đọc được. Muốn em ấy xem thì bật từng dòng bên dưới.
            </span>
          </div>
        </form>

        {danhSach.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 px-6 py-10 text-center text-sm text-[#1A1A1A]/60">
            Chưa có nhận xét nào cho em này.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {danhSach.map((n) => (
              <li
                key={n.id}
                className="rounded-2xl border border-black/10 bg-white p-5"
              >
                <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#1A1A1A]/60">
                  <span className="font-mono">
                    {new Date(n.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {n.tenLop && <span>· {n.tenLop}</span>}
                  <span
                    className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      n.sharedWithStudent
                        ? "bg-[#14532D]/10 text-[#14532D]"
                        : "bg-black/5 text-[#1A1A1A]/60"
                    }`}
                  >
                    {n.sharedWithStudent ? "Học viên xem được" : "Chỉ cô đọc"}
                  </span>
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#1A1A1A]">
                  {n.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-4">
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      const bat = !n.sharedWithStudent;
                      if (
                        bat &&
                        !window.confirm(
                          "Cho học viên đọc nhận xét này? Em ấy sẽ thấy đúng từng chữ ở trên.",
                        )
                      )
                        return;
                      void goi("/api/hoc-vien/nhan-xet", "PATCH", {
                        noteId: n.id,
                        sharedWithStudent: bat,
                      });
                    }}
                    className="text-xs font-bold text-[#14532D] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {n.sharedWithStudent ? "Thu lại, chỉ cô đọc" : "Cho học viên xem"}
                  </button>
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      const moi = window.prompt("Sửa nhận xét:", n.body);
                      if (moi === null || !moi.trim()) return;
                      void goi("/api/hoc-vien/nhan-xet", "PATCH", {
                        noteId: n.id,
                        body: moi,
                      });
                    }}
                    className="text-xs font-bold text-[#1A1A1A]/60 hover:text-[#14532D] disabled:opacity-50 cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    disabled={dangLuu}
                    onClick={() => {
                      if (!window.confirm("Xoá hẳn nhận xét này?")) return;
                      void goi("/api/hoc-vien/nhan-xet", "DELETE", {
                        noteId: n.id,
                      });
                    }}
                    className="text-xs font-bold text-[#1A1A1A]/50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                  >
                    Xoá
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Tài khoản nhận học phí ──────────────────────────────────────────────── */

/**
 * Cô khai tài khoản nhận tiền.
 *
 * Của GIÁO VIÊN, không phải của lớp — một cô nhiều lớp nhưng một tài khoản.
 * Khai xong thì trang học phí của học sinh mới hiện mã QR; chưa khai thì bên
 * đó nói thẳng là "cô chưa khai tài khoản", chứ không hiện một ô trống.
 */
function TaiKhoan({
  taiKhoan,
  dangLuu,
  goi,
}: {
  taiKhoan: TaiKhoanNhan;
  dangLuu: boolean;
  goi: Goi;
}) {
  const [mo, setMo] = useState(false);
  const daKhai = Boolean(taiKhoan.bankBin && taiKhoan.bankAccount);

  if (!mo) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
          Tài khoản nhận
        </span>
        {daKhai ? (
          <span className="text-sm">
            <b className="font-mono">{taiKhoan.bankAccount}</b>
            <span className="ml-2 text-[#1A1A1A]/70">
              {taiKhoan.bankName} · {taiKhoan.bankHolder}
            </span>
          </span>
        ) : (
          <span className="text-sm font-semibold text-[#B45309]">
            Chưa khai — học viên chưa thấy mã chuyển khoản
          </span>
        )}
        <button
          type="button"
          onClick={() => setMo(true)}
          className="ml-auto text-xs font-bold text-[#14532D] hover:underline cursor-pointer"
        >
          {daKhai ? "Sửa" : "Khai ngay"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const bin = String(f.get("bankBin") ?? "");
        const xong = await goi("/api/hoc-vien/tai-khoan", "PUT", {
          bankBin: bin,
          bankName: NGAN_HANG.find((n) => n.bin === bin)?.ten ?? "",
          bankAccount: f.get("bankAccount"),
          bankHolder: f.get("bankHolder"),
        });
        if (xong) setMo(false);
      }}
      className="rounded-2xl border border-black/10 bg-white p-5"
    >
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#1A1A1A]/60">
        Tài khoản nhận học phí
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
            Ngân hàng
          </span>
          <select
            name="bankBin"
            defaultValue={taiKhoan.bankBin ?? ""}
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm"
          >
            <option value="">— Chọn —</option>
            {NGAN_HANG.map((n) => (
              <option key={n.bin} value={n.bin}>
                {n.ten}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
            Số tài khoản
          </span>
          <input
            name="bankAccount"
            inputMode="numeric"
            defaultValue={taiKhoan.bankAccount ?? ""}
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm font-mono"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#1A1A1A]/70">
            Chủ tài khoản
          </span>
          <input
            name="bankHolder"
            defaultValue={taiKhoan.bankHolder ?? ""}
            placeholder="HO NGOC THUONG"
            className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm uppercase"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={dangLuu}
          className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
        >
          {dangLuu ? "Đang lưu…" : "Lưu tài khoản"}
        </button>
        <button
          type="button"
          onClick={() => setMo(false)}
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-bold text-[#1A1A1A]/70 cursor-pointer"
        >
          Huỷ
        </button>
      </div>
      {/*
        Tên chủ tài khoản viết HOA KHÔNG DẤU để khớp đúng cái học sinh thấy
        trong app ngân hàng lúc chuyển — khác một chữ là em ấy tưởng chuyển nhầm.
      */}
      <p className="mt-3 text-xs text-[#1A1A1A]/60">
        Viết tên chủ tài khoản hoa không dấu, đúng như app ngân hàng hiện. Để
        trống cả ba ô rồi lưu là tắt phần chuyển khoản.
      </p>
    </form>
  );
}
