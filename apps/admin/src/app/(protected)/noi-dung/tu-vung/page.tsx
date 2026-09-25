import Link from "next/link";

import { danhSachBoThe } from "../../../../lib/noiDung";
import { teacherHienTai } from "../../../../lib/phien";
import TaoBoThe from "./TaoBoThe";

export const dynamic = "force-dynamic";

/**
 * Bộ thẻ từ vựng.
 *
 * Trước trang này, thêm một thẻ phải viết SQL tay — nên cả phần học từ vựng
 * (thuật toán giãn cách, khoá chống mất lượt, bài kiểm đồng thời) phục vụ
 * đúng 6 thẻ. Đây là chỗ duy nhất đổ nội dung vào.
 */
export default async function TrangTuVung() {
  await teacherHienTai();
  const bo = await danhSachBoThe();

  const cuaCo = bo.filter((b) => b.type === "official");
  const cuaHocVien = bo.filter((b) => b.type !== "official");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-5">
        <h1 className="mr-auto text-3xl font-bold text-[#1A1A1A]">
          Bộ thẻ từ vựng
          <span className="mt-1 block text-sm font-sans font-medium text-[#1A1A1A]/60">
            Thẻ cô soạn ở đây sẽ vào lịch ôn giãn cách của học viên
          </span>
        </h1>
        <TaoBoThe />
      </div>

      {cuaCo.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/15 px-6 py-14 text-center">
          <p className="font-bold text-[#1A1A1A]">Chưa có bộ thẻ nào của cô.</p>
          <p className="mt-1.5 text-sm text-[#1A1A1A]/60">
            Tạo một bộ theo chủ đề (Education, Environment…) rồi thêm từ vào.
          </p>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {cuaCo.map((b) => (
          <li key={b.id}>
            <Link
              href={`/noi-dung/tu-vung/${b.id}`}
              className="block rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#14532D]/40"
            >
              <p className="flex flex-wrap items-baseline gap-2">
                <b className="text-lg text-[#1A1A1A]">{b.name}</b>
                {b.topic && (
                  <span className="rounded-full bg-[#14532D]/10 px-2 py-0.5 text-[11px] font-bold text-[#14532D]">
                    {b.topic}
                  </span>
                )}
              </p>
              <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-[#1A1A1A]/70">
                <span>
                  <b className="font-mono">{b.soThe}</b> thẻ
                </span>
                <span>
                  <b className="font-mono">{b.soNguoiHoc}</b> học viên đang ôn
                </span>
              </p>
              {/*
                Hai cảnh báo này trả lời cùng một câu hỏi: "vì sao học sinh
                không thấy?". Chưa giao thì cả bộ vô hình; thẻ chưa có nghĩa
                thì riêng thẻ đó đứng ngoài lịch ôn. Không nói ra thì cô soạn
                40 thẻ mà học sinh thấy 0, và không ai hiểu vì sao.
              */}
              {!b.giaoCaLop && (
                <p className="mt-2 text-sm font-semibold text-[#B45309]">
                  Chưa giao cho lớp — học viên chưa thấy bộ này
                </p>
              )}
              {b.soTheThieuNghia > 0 && (
                <p className="mt-2 text-sm font-semibold text-[#B45309]">
                  {b.soTheThieuNghia} thẻ chưa có nghĩa — chưa vào lịch ôn
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {cuaHocVien.length > 0 && (
        <>
          <h2 className="mt-10 mb-1 text-xs font-bold uppercase tracking-[0.1em] text-[#1A1A1A]/50">
            Bộ học viên tự tạo · {cuaHocVien.length}
          </h2>
          <p className="mb-3 text-sm text-[#1A1A1A]/60">
            Chỉ để cô biết kho đang có gì. Đây là đồ riêng của các em, cô không
            sửa được.
          </p>
          <ul className="flex flex-col gap-2">
            {cuaHocVien.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-baseline gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm"
              >
                <b className="text-[#1A1A1A]/70">{b.name}</b>
                <span className="text-xs text-[#1A1A1A]/50">{b.soThe} thẻ</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
