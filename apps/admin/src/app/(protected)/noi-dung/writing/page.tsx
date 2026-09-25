import Link from "next/link";

import { danhSachDeWriting } from "../../../../lib/noiDung";
import { teacherHienTai } from "../../../../lib/phien";
import TaoDe from "./TaoDe";

export const dynamic = "force-dynamic";

/**
 * Đề Writing.
 *
 * Trước trang này có 7 đề, và đúng 1 đề có ngân hàng ý — nên học sinh mở màn
 * luyện Writing ra thì 4/5 mục báo "chưa có". Hai mục soạn được là "Idea
 * Development" và "Kiến thức nền"; hai mục còn lại (Grammar Enhancement, bài
 * mẫu) cần model sinh văn bản, chưa nối.
 */
export default async function TrangDeWriting() {
  await teacherHienTai();
  const de = await danhSachDeWriting();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-5">
        <h1 className="mr-auto text-3xl font-bold text-[#1A1A1A]">
          Đề Writing
          <span className="mt-1 block text-sm font-sans font-medium text-[#1A1A1A]/60">
            Đề, ngân hàng ý và kiến thức nền học sinh thấy khi luyện
          </span>
        </h1>
        <TaoDe />
      </div>

      {de.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/15 px-6 py-14 text-center">
          <p className="font-bold text-[#1A1A1A]">Chưa có đề nào.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {de.map((d) => (
          <li key={d.id}>
            <Link
              href={`/noi-dung/writing/${d.id}`}
              className="block rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#14532D]/40"
            >
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-full bg-[#14532D]/10 px-2 py-0.5 text-[11px] font-bold text-[#14532D]">
                  Task {d.task}
                </span>
                <b className="text-[#1A1A1A]">{d.title}</b>
                <span className="text-xs text-[#1A1A1A]/50">{d.topic}</span>
                {!d.published && (
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-[#1A1A1A]/60">
                    Chưa xuất bản
                  </span>
                )}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-[#1A1A1A]/70">{d.prompt}</p>
              {/*
                Hai con số này là thứ quyết định học sinh mở ra thấy gì. Đề 0 ý
                thì mục "Idea Development" của em ấy báo "cô chưa soạn".
              */}
              <p className="mt-2 flex flex-wrap gap-x-4 text-xs">
                <span className={d.soYTuong ? "text-[#14532D]" : "text-[#B45309]"}>
                  <b className="font-mono">{d.soYTuong}</b> luận điểm
                </span>
                <span className={d.soKienThuc ? "text-[#14532D]" : "text-[#1A1A1A]/50"}>
                  <b className="font-mono">{d.soKienThuc}</b> mục kiến thức nền
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
