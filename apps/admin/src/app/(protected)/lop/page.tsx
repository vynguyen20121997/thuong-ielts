import Link from "next/link";

import { danhSachLopDangMo } from "../../../lib/lop";

export const dynamic = "force-dynamic";

/**
 * Chọn lớp để xem. Chỉ hiện những đề có người làm trong 24 giờ qua — cô mở
 * trang này giữa buổi dạy, không phải để tra cứu lịch sử.
 */
export default async function DanhSachLop() {
  const lop = await danhSachLopDangMo();

  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mb-2">Lớp đang làm bài</h1>
      <p className="text-sm text-[#1A1A1A]/55 mb-8">
        Những đề có học viên vào làm trong 24 giờ qua. Bấm vào một đề để xem từng em tới đâu.
      </p>

      {lop.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-[#1A1A1A]">Chưa có ai đang làm bài</p>
          <p className="text-xs text-[#1A1A1A]/50 mt-1">
            Khi học viên bắt đầu một đề, lớp sẽ hiện ở đây ngay.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lop.map((l) => (
            <Link
              key={l.target}
              href={`/lop/${encodeURIComponent(l.target)}`}
              className="block bg-white border border-black/10 rounded-2xl p-5 hover:border-[#14532D]/40 hover:shadow-sm transition-all"
            >
              <span className="block font-serif text-lg font-black text-[#1A1A1A]">{l.title}</span>
              <span className="block text-xs text-[#1A1A1A]/45 mt-0.5">{l.target}</span>
              <div className="flex gap-5 mt-3">
                <span className="text-sm">
                  <b className="font-black text-[#14532D] tabular-nums">{l.dangLam}</b>
                  <span className="text-xs text-[#1A1A1A]/50 ml-1">đang làm</span>
                </span>
                <span className="text-sm">
                  <b className="font-black text-[#1A1A1A] tabular-nums">{l.daNop}</b>
                  <span className="text-xs text-[#1A1A1A]/50 ml-1">đã nộp</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
