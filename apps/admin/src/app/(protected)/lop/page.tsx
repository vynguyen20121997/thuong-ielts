import Link from "next/link";

import { danhSachLop } from "../../../lib/lop";
import { teacherHienTai } from "../../../lib/phien";
import LuoiLop from "./LuoiLop";

export const dynamic = "force-dynamic";

/**
 * Màn chính của phần theo dõi.
 *
 * Chia theo BA TÌNH HUỐNG THẬT, không chia theo đề:
 *
 *   1. Cô giao cho cả lớp
 *   2. Cô gửi riêng cho một bạn
 *   3. Học sinh tự vào luyện, không ai giao
 *
 * Chia theo đề thì cả ba dồn vào một chỗ: một em ở đâu đó tự luyện Cam 12
 * Test 3 sẽ hiện ngay trong lớp cô đang dạy, và bài cô gửi riêng cho một bạn
 * cũng lẫn vào đó — bảng điểm buổi học có tên người lạ.
 */
export default async function TrangDanhSachLop() {
  const teacherId = await teacherHienTai();
  const lop = await danhSachLop(teacherId);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-5 mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mr-auto">
          Lớp đang làm bài
          <span className="block text-sm font-sans font-medium text-[#1A1A1A]/50 mt-1">
            Bài cô giao trong 2 ngày qua, và học viên tự luyện trong 24 giờ qua
          </span>
        </h1>
        <Link
          href="/lop/giao"
          className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white transition-colors"
        >
          Giao bài mới
        </Link>
      </div>

      <LuoiLop banDau={lop} />
    </div>
  );
}
