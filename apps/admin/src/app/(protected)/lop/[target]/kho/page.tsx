import Link from "next/link";

import { biaLop, cauKhoNhat } from "../../../../../lib/lop";
import TabLop from "../TabLop";

export const dynamic = "force-dynamic";

/**
 * Insights: câu nào cả lớp sai nhiều nhất.
 *
 * Bảng điểm nói AI cần giúp. Màn này nói CHỮA CÂU NÀO TRƯỚC — cô có 15 phút
 * cuối buổi, chữa được ba câu, và phải là ba câu cả lớp sai chứ không phải ba
 * câu đầu tiên.
 */
export default async function TrangCauKho({
  params,
}: {
  params: Promise<{ target: string }>;
}) {
  const { target } = await params;
  const [bia, cau] = await Promise.all([biaLop(target), cauKhoNhat(target, 12)]);

  return (
    <div>
      <Link href="/lop" className="text-xs font-bold text-[#1A1A1A]/50 hover:text-[#14532D]">
        ← Tất cả lớp
      </Link>
      <div className="mt-2">
        <TabLop khoa={target} />
      </div>

      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mt-2 mb-1">Chữa câu nào trước</h1>
      <p className="text-sm text-[#1A1A1A]/55 mb-8">
        {bia?.nhan ?? target} · xếp theo tỉ lệ đúng từ thấp lên cao
      </p>

      {cau.length === 0 ? (
        <p className="rounded-2xl border border-black/10 bg-white p-10 text-center text-sm text-[#1A1A1A]/45">
          Chưa có ai nộp bài, hoặc bài nộp chưa đủ để tính.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cau.map((c) => (
            <div key={c.so} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] font-serif text-base font-black text-[#1A1A1A]/70">
                  {c.so}
                </span>

                <div className="min-w-0 mr-auto">
                  <span className="block text-sm font-bold text-[#1A1A1A]">
                    {c.dung}/{c.daLam} em làm đúng
                  </span>
                  {c.dapAn && (
                    <span className="block text-xs text-[#157F3D] mt-0.5">Đáp án: {c.dapAn}</span>
                  )}
                </div>

                <span className="text-right shrink-0">
                  <b
                    className={`block font-serif text-2xl font-black tabular-nums leading-none ${
                      c.tiLe < 40 ? "text-[#C62828]" : c.tiLe < 70 ? "text-[#B26A00]" : "text-[#157F3D]"
                    }`}
                  >
                    {c.tiLe}%
                  </b>
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/40 mt-1">
                    đúng
                  </span>
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className={`h-full rounded-full ${
                    c.tiLe < 40 ? "bg-[#C62828]" : c.tiLe < 70 ? "bg-[#B26A00]" : "bg-[#157F3D]"
                  }`}
                  style={{ width: `${c.tiLe}%` }}
                />
              </div>

              {c.saiHayGap.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-[#1A1A1A]/40">Hay sai thành:</span>
                  {c.saiHayGap.map((s) => (
                    <span
                      key={s.chu}
                      className="rounded-full bg-[#FBE6E6] px-2.5 py-1 text-[11px] font-semibold text-[#C62828]"
                    >
                      {s.chu}
                      {s.soEm > 1 && <span className="ml-1 opacity-60">&times;{s.soEm}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
