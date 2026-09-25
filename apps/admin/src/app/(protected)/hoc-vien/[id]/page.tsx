import Link from "next/link";
import { notFound } from "next/navigation";

import {
  NHAN_CHU_KY,
  docLop,
  hocVienChuaVaoLop,
  hocVienCuaLop,
  kyHienTai,
  lanDongCuaLop,
  nhanXetCuaLop,
  taiKhoanNhan,
  tomTatTien,
} from "../../../../lib/hocVien";
import { teacherHienTai } from "../../../../lib/phien";
import { dinhDangTien, nhanKy } from "../../../../lib/tien";
import BangLopHoc from "./BangLopHoc";

export const dynamic = "force-dynamic";

/**
 * Một lớp: sổ điểm danh, học phí, nhận xét.
 *
 * Kỳ đang xét đọc từ `?ky=YYYY-MM`, mặc định tháng này. Để trên URL chứ không
 * để trong state: cô hay mở "tháng trước ai chưa đóng" rồi gửi link đó cho
 * chính mình hoặc mở lại sau — một cái kỳ nằm trong state thì link mất nghĩa.
 *
 * Lớp thu TRỌN KHOÁ thì không có kỳ: mọi cột theo kỳ tắt hẳn thay vì hiện
 * "chưa đóng" cho một tháng không ai thu.
 */
export default async function TrangLopHoc({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ky?: string }>;
}) {
  const { id } = await params;
  const { ky: kyParam } = await searchParams;
  const teacherId = await teacherHienTai();

  const lop = await docLop(teacherId, id);
  if (!lop) notFound();

  const theoKy = lop.tuitionCycle !== "khoa";
  const ky = theoKy
    ? /^\d{4}-(0[1-9]|1[0-2])$/.test(kyParam ?? "")
      ? (kyParam as string)
      : kyHienTai()
    : null;

  const [hocVien, lanDong, tien, chuaVao, nhanXet, taiKhoan] = await Promise.all([
    hocVienCuaLop(teacherId, id, ky),
    lanDongCuaLop(teacherId, id),
    tomTatTien(teacherId, id, ky),
    hocVienChuaVaoLop(id),
    nhanXetCuaLop(teacherId, id),
    taiKhoanNhan(teacherId),
  ]);

  return (
    <div>
      <Link
        href="/hoc-vien"
        className="text-xs font-bold text-[#1A1A1A]/60 hover:text-[#14532D]"
      >
        ← Tất cả lớp
      </Link>

      <div className="mt-2 mb-6 flex flex-wrap items-end gap-4">
        <h1 className="mr-auto text-3xl font-bold text-[#1A1A1A]">
          {lop.name}
          <span className="mt-1 block text-sm font-sans font-medium text-[#1A1A1A]/60">
            {lop.tuitionAmount === null
              ? "Chưa đặt mức học phí"
              : `${dinhDangTien(lop.tuitionAmount)} đ · ${NHAN_CHU_KY[lop.tuitionCycle].toLowerCase()}`}
            {!lop.isActive && " · lớp đã đóng"}
          </span>
        </h1>
      </div>

      {/* Ba con số cô nhìn đầu tiên mỗi khi mở lớp. */}
      <ul className="mb-6 grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border border-black/10 bg-white px-5 py-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/50">
            Đang học
          </span>
          <b className="mt-1 block font-mono text-2xl text-[#1A1A1A]">
            {tien.soDangHoc}
          </b>
        </li>
        <li className="rounded-2xl border border-black/10 bg-white px-5 py-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/50">
            Thu {theoKy ? nhanKy(ky).toLowerCase() : "tất cả"}
          </span>
          <b className="mt-1 block font-mono text-2xl text-[#14532D]">
            {dinhDangTien(theoKy ? tien.thuKyNay : tien.thuTatCa)}
          </b>
        </li>
        <li
          className={`rounded-2xl border px-5 py-4 ${
            theoKy && tien.soChuaDong > 0
              ? "border-[#B45309]/30 bg-[#FFFBEB]"
              : "border-black/10 bg-white"
          }`}
        >
          <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/50">
            {theoKy ? "Chưa đóng kỳ này" : "Tổng đã thu"}
          </span>
          <b
            className={`mt-1 block font-mono text-2xl ${
              theoKy && tien.soChuaDong > 0 ? "text-[#B45309]" : "text-[#1A1A1A]"
            }`}
          >
            {theoKy ? tien.soChuaDong : dinhDangTien(tien.thuTatCa)}
          </b>
        </li>
      </ul>

      <BangLopHoc
        lop={lop}
        ky={ky}
        theoKy={theoKy}
        hocVien={hocVien}
        lanDong={lanDong}
        chuaVao={chuaVao}
        nhanXet={nhanXet}
        taiKhoan={taiKhoan}
      />
    </div>
  );
}
