import Link from "next/link";

import { bangDiemLop } from "../../../../../lib/lop";
import TabLop from "../TabLop";

export const dynamic = "force-dynamic";

/**
 * Bảng điểm cả lớp — mở sau buổi học để chữa bài và lưu lại.
 *
 * Tách khỏi bảng lớp trực tiếp vì hai màn hình phục vụ hai lúc khác nhau:
 * trong giờ cô cần biết ai đang chững, sau giờ cô cần một danh sách xếp hạng
 * để đọc tên và một file để giữ.
 */
export default async function TrangBangDiem({
  params,
}: {
  params: Promise<{ target: string }>;
}) {
  const { target } = await params;
  const rows = await bangDiemLop(target);
  const daNop = rows.filter((r) => r.trangThai === "submitted");
  const coKhach = rows.some((r) => r.khach);

  // Trung bình tính theo TỈ LỆ, không theo số câu thô — xem ghi chú ở
  // `bangDiemLop`. Cộng số câu của bài 40 câu với bài 13 câu là cộng hai đơn vị
  // khác nhau, và con số ra được thì không so sánh với gì cả.
  const tb = daNop.length
    ? `${Math.round(daNop.reduce((t, r) => t + r.tiLe, 0) / daNop.length)}%`
    : "—";

  return (
    <div>
      <Link href="/lop" className="text-xs font-bold text-[#1A1A1A]/50 hover:text-[#14532D]">
        ← Tất cả lớp
      </Link>
      <div className="mt-2">
        <TabLop khoa={target} />
      </div>
      <div className="flex flex-wrap items-end gap-4 mt-2 mb-6">
        <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mr-auto">
          Bảng điểm
          <span className="block text-sm font-sans font-medium text-[#1A1A1A]/45 mt-1">{target}</span>
        </h1>
        <a
          href={`/api/lop/${encodeURIComponent(target)}/csv`}
          className="rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white transition-colors"
        >
          Tải file Excel (.csv)
        </a>
      </div>

      {coKhach && (
        <p className="mb-5 rounded-xl bg-[#FBEFD9] text-[#B26A00] px-4 py-3 text-sm">
          Lớp này có học viên vào bằng cách gõ tên. <b>Kết quả của các em đó chỉ giữ 1 ngày</b> rồi
          hệ thống tự dọn — tải file về trước khi hết ngày nếu cô cần giữ.
        </p>
      )}

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        <div className="flex gap-8 px-5 py-4 border-b border-black/5">
          <Stat so={String(daNop.length)} nhan="Đã nộp" />
          <Stat so={String(rows.length - daNop.length)} nhan="Chưa xong" />
          <Stat so={tb} nhan="Tỉ lệ đúng TB" />
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#1A1A1A]/45">
            Chưa có ai làm đề này trong 30 ngày qua.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/40">
                <th className="text-left font-bold px-5 py-2.5">#</th>
                <th className="text-left font-bold px-5 py-2.5">Học viên</th>
                <th className="text-right font-bold px-5 py-2.5">Đúng</th>
                <th className="text-right font-bold px-5 py-2.5">Tỉ lệ</th>
                <th className="text-right font-bold px-5 py-2.5">Band</th>
                <th className="text-right font-bold px-5 py-2.5">Thời gian</th>
                <th className="text-left font-bold px-5 py-2.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.attemptId} className="border-t border-black/5">
                  <td className="px-5 py-3 text-sm tabular-nums text-[#1A1A1A]/40">
                    {r.trangThai === "submitted" ? i + 1 : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-[#1A1A1A]">
                    {r.ten}
                    {r.khach && (
                      <span className="ml-2 text-[10px] uppercase font-bold tracking-wide text-[#1A1A1A]/40">
                        Khách
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold tabular-nums">
                    {r.trangThai === "submitted" ? (
                      <>
                        {r.dung}
                        <span className="text-[#1A1A1A]/40 font-medium">/{r.tong}</span>
                      </>
                    ) : (
                      <span className="text-[#1A1A1A]/35">chưa xong</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums text-[#1A1A1A]/60">
                    {r.trangThai === "submitted" ? `${r.tiLe}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold tabular-nums">
                    {r.band !== null && r.trangThai === "submitted" ? r.band.toFixed(1) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-sm tabular-nums text-[#1A1A1A]/60">
                    {r.trangThai === "submitted" ? `${r.phutLam} phút` : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-[#1A1A1A]/50">
                    {r.tuDongNop ? "Hết giờ, nộp tự động" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ so, nhan }: { so: string; nhan: string }) {
  return (
    <span className="block">
      <b className="block font-serif text-2xl font-black text-[#1A1A1A] tabular-nums leading-tight">
        {so}
      </b>
      <span className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/40">
        {nhan}
      </span>
    </span>
  );
}
