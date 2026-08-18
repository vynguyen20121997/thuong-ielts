import Link from "next/link";

import { danhSachLop } from "../../../lib/lop";
import LuoiLop from "./LuoiLop";

export const dynamic = "force-dynamic";

/**
 * Màn chính của phần theo dõi: tất cả các lớp đang mở.
 *
 * Gom theo BỘ ĐỀ chứ không đổ một danh sách phẳng. Cô dạy ba lớp trong ngày
 * thì ba thẻ mang mã `cam12-test3`, `cam14-test1`, `cam16-test2` nhìn như
 * nhau — phải bấm vào mới biết cái nào là lớp đang cần xem. Nhóm theo bộ, kèm
 * chủ đề và tên vài em đang làm, thì nhận ra ngay từ ngoài.
 */
export default async function TrangDanhSachLop() {
  const lop = await danhSachLop();

  const tongDangLam = lop.reduce((t, l) => t + l.dangLam, 0);
  const tongMatKetNoi = lop.reduce((t, l) => t + l.matKetNoi, 0);

  // Gom theo bộ đề, giữ nguyên thứ tự đã sắp ở SQL (lớp đông người trước).
  const nhom = new Map<string, typeof lop>();
  for (const l of lop) {
    const khoa = l.boDe || "Khác";
    nhom.set(khoa, [...(nhom.get(khoa) ?? []), l]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-5 mb-8">
        <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mr-auto">
          Lớp đang làm bài
          <span className="block text-sm font-sans font-medium text-[#1A1A1A]/50 mt-1">
            Những đề có học viên vào trong 24 giờ qua
          </span>
        </h1>
        <Link
          href="/lop/giao"
          className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white transition-colors"
        >
          Giao bài mới
        </Link>
      </div>

      {/*
        LUÔN dựng `LuoiLop`, kể cả khi chưa có lớp nào.

        Trước đây chỗ này rẽ nhánh: chưa có lớp thì vẽ một khối tĩnh, có lớp
        mới dựng phần sống. Nhưng cô mở màn theo dõi TRƯỚC giờ học mới là
        trường hợp thường gặp — và lúc đó socket không bao giờ được nối, nên
        cả lớp vào làm bài mà màn hình vẫn nói "chưa có ai", cho tới khi cô tự
        bấm tải lại. Đúng cái bẫy đã sập ở tiêu đề màn chi tiết.

        Khối "chưa có ai" giờ nằm bên trong `LuoiLop`, nơi nó biết khi nào
        không còn đúng nữa.
      */}
      <LuoiLop
        banDau={lop}
        nhomBanDau={[...nhom.entries()].map(([bo, ds]) => ({
          bo,
          targets: ds.map((d) => d.target),
        }))}
        tongDangLam={tongDangLam}
        tongMatKetNoi={tongMatKetNoi}
      />
    </div>
  );
}
