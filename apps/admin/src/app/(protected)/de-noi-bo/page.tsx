import Link from "next/link";
import { Clock, FileText, Send } from "lucide-react";

import { danhSachDeNoiBo } from "../../../lib/deNoiBo";
import { teacherHienTai } from "../../../lib/phien";
import TaoDeNoiBo from "./TaoDeNoiBo";

export const dynamic = "force-dynamic";

/**
 * Đề nội bộ — đề cô tự soạn, chỉ mở qua link Giao bài.
 *
 * Khác kho đề Cambridge: không hiện ở trang luyện tập công khai của học
 * sinh. Soạn xong thì sang "Giao bài", đề nằm ở nhóm "Đề nội bộ" đầu danh sách.
 */
export default async function TrangDeNoiBo() {
  const teacherId = await teacherHienTai();
  const de = await danhSachDeNoiBo(teacherId);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-5">
        <h1 className="mr-auto text-3xl font-bold text-[#1A1A1A]">
          Đề nội bộ
          <span className="mt-1 block text-sm font-medium text-[#1A1A1A]/60">
            Đề Reading và Writing cô tự soạn. Học sinh chỉ làm được khi cô giao link.
          </span>
        </h1>
        <TaoDeNoiBo />
      </div>

      {de.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-14 text-center">
          <p className="font-bold text-[#1A1A1A]">Chưa có đề nội bộ nào.</p>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Bấm “Tạo mới”, đặt mã và tên đề, rồi soạn bài đọc với các nhóm câu.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {de.map((d) => (
            <li key={d.id}>
              <Link
                href={`/de-noi-bo/${d.id}`}
                className="flex h-full flex-col rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#14532D]/40"
              >
                <span className="flex flex-wrap gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${d.skill === "writing" ? "bg-[#14532D] text-white" : "bg-[#14532D]/10 text-[#14532D]"}`}>
                    {d.skill === "writing" ? "Writing" : "Reading"}
                  </span>
                  <span className="rounded-lg bg-[#9FE870]/30 px-2.5 py-1 font-mono text-xs font-bold text-[#14532D]">
                    {d.code.toUpperCase()}
                  </span>
                </span>
                <b className="mt-3 text-lg leading-snug text-[#1A1A1A]">{d.title}</b>
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#1A1A1A]/65">
                  {d.skill === "reading" && (
                    <span className="flex items-center gap-1.5">
                      <FileText size={15} aria-hidden /> {d.questionCount} câu hỏi
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} aria-hidden /> {d.minutes} phút
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Send size={15} aria-hidden /> {d.soLanGiao ? `đã giao ${d.soLanGiao} lần` : "chưa giao"}
                  </span>
                </span>
                {d.choDuyet && (
                  <span className="mt-3 self-start rounded-lg bg-[#FDF6EE] px-2.5 py-1 text-xs font-bold text-[#B45309]">
                    AI soạn — chờ cô duyệt đáp án
                  </span>
                )}
                {d.skill === "reading" && d.questionCount === 0 && (
                  <span className="mt-3 text-xs font-semibold text-[#B45309]">
                    Chưa có câu nào — chưa giao được.
                  </span>
                )}
                <span className="mt-auto pt-4 text-right text-sm font-semibold text-[#14532D]">Soạn đề →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
