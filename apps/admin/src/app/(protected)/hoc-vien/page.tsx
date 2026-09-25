import Link from "next/link";

import { NHAN_CHU_KY, danhSachLop, kyHienTai } from "../../../lib/hocVien";
import { teacherHienTai } from "../../../lib/phien";
import { dinhDangTien, nhanKy } from "../../../lib/tien";
import TaoLop from "./TaoLop";

export const dynamic = "force-dynamic";

/**
 * Danh sách lớp học.
 *
 * KHÁC hẳn `/lop` (“Lớp đang làm”): ở đó là phòng thi trực tiếp, khoá theo mã
 * đề, sống đúng một buổi. Ở đây là lớp học thật — nhóm học viên cô dạy nhiều
 * tháng, có học phí và nhận xét. Hai thứ trùng tên nên nhãn trên thanh điều
 * hướng phải nói rõ: “Lớp đang làm” với “Học viên & học phí”.
 */
export default async function TrangHocVien() {
  const teacherId = await teacherHienTai();
  const lop = await danhSachLop(teacherId);
  const ky = kyHienTai();

  const dangDay = lop.filter((l) => l.isActive);
  const daDong = lop.filter((l) => !l.isActive);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-5 mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mr-auto">
          Học viên &amp; học phí
          <span className="block text-sm font-sans font-medium text-[#1A1A1A]/60 mt-1">
            Lớp cô đang dạy, ai đã đóng tiền, và nhận xét riêng từng em
          </span>
        </h1>
        <TaoLop />
      </div>

      {lop.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/15 px-6 py-14 text-center">
          <p className="font-bold text-[#1A1A1A]">Chưa có lớp nào.</p>
          <p className="mt-1.5 text-sm text-[#1A1A1A]/60">
            Tạo một lớp rồi thêm học viên vào. Học phí cô tự nhập — máy không
            tự tính hộ, vì mỗi lớp một kiểu thu.
          </p>
        </div>
      )}

      {dangDay.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {dangDay.map((l) => (
            <li key={l.id}>
              <Link
                href={`/hoc-vien/${l.id}`}
                className="block rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#14532D]/40"
              >
                <p className="flex flex-wrap items-baseline gap-2">
                  <b className="text-lg text-[#1A1A1A]">{l.name}</b>
                  <span className="text-xs font-bold text-[#1A1A1A]/50">
                    {l.siSo} học viên
                  </span>
                </p>
                <p className="mt-2 text-sm text-[#1A1A1A]/70">
                  {l.tuitionAmount === null ? (
                    <span className="text-[#B45309]">Chưa đặt mức học phí</span>
                  ) : (
                    <>
                      <b className="font-mono">{dinhDangTien(l.tuitionAmount)}</b>{" "}
                      đ · {NHAN_CHU_KY[l.tuitionCycle].toLowerCase()}
                    </>
                  )}
                </p>
                {l.note && (
                  <p className="mt-2 line-clamp-2 text-xs text-[#1A1A1A]/60">
                    {l.note}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {daDong.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/50">
            Lớp đã đóng
          </h2>
          <ul className="flex flex-col gap-2">
            {daDong.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/hoc-vien/${l.id}`}
                  className="flex flex-wrap items-baseline gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm hover:border-[#14532D]/40"
                >
                  <b className="text-[#1A1A1A]">{l.name}</b>
                  <span className="text-xs text-[#1A1A1A]/60">
                    {l.siSo} học viên
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 text-xs leading-relaxed text-[#1A1A1A]/60">
        Kỳ thu đang xét: <b>{nhanKy(ky)}</b>. Lớp thu trọn khoá thì cột “đã
        đóng kỳ này” để trống, vì kỳ đó không tồn tại.
      </p>
    </div>
  );
}
