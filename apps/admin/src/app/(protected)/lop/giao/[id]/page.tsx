import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@thuong-ielts/db";

import { teacherHienTai } from "../../../../../lib/phien";

export const dynamic = "force-dynamic";

type KetQua =
  | { kind: "graded"; result: { overall: number | null; criteria: { id: string; band: number }[] } }
  | { kind: "too-short"; words: number }
  | { kind: "ungraded"; reason: string }
  | { kind: "empty" };

/**
 * Bài Writing học sinh nộp qua một lần giao.
 *
 * Band là của bộ chấm AI, đúng thang bốn tiêu chí của màn luyện Writing — để
 * cô đối chiếu, không phải điểm chốt. Bài nào chấm chưa được thì nói rõ lý do
 * thay vì để ô trống.
 */
export default async function TrangBaiNopWriting({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacherId = await teacherHienTai();

  const { rows: bai } = await pool.query(
    `SELECT id, title, label, target FROM assignments WHERE id = $1 AND teacher_id = $2 AND skill = 'writing'`,
    [id, teacherId]
  );
  if (!bai[0]) notFound();

  const { rows } = await pool.query(
    `SELECT w.id, coalesce(s.name, w.guest_name, 'Khách') AS ten, w.guest_name IS NOT NULL AS la_khach,
            w.prompt_text, w.essay, w.words, w.elapsed_seconds, w.result, w.submitted_at
       FROM writing_submissions w
       LEFT JOIN students s ON s.id = w.student_id
      WHERE w.assignment_id = $1
      ORDER BY w.submitted_at`,
    [id]
  );

  return (
    <div>
      <nav className="mb-4 text-sm text-[#1A1A1A]/55" aria-label="Đường dẫn">
        <Link href="/lop/giao" className="hover:text-[#14532D]">Giao bài</Link>
        <span className="mx-2">»</span>
        <span className="text-[#1A1A1A]">{bai[0].label || bai[0].title}</span>
      </nav>
      <h1 className="mb-1 text-3xl font-bold text-[#1A1A1A]">{bai[0].label || bai[0].title}</h1>
      <p className="mb-8 text-sm text-[#1A1A1A]/60">
        {rows.length} bài nộp · band do AI chấm theo bốn tiêu chí, để cô tham khảo
      </p>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-[#1A1A1A]/50">
          Chưa có bài nào. Học sinh nộp xong sẽ hiện ở đây.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const kq = r.result as KetQua | null;
            return (
              <li key={r.id}>
                <details className="group rounded-2xl border border-black/10 bg-white">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 p-5 [&::-webkit-details-marker]:hidden">
                    <span className="mr-auto min-w-0">
                      <b className="block text-[#1A1A1A]">{r.ten}{r.la_khach && <span className="ml-2 text-xs font-medium text-[#1A1A1A]/45">khách</span>}</b>
                      <span className="text-xs text-[#1A1A1A]/50">
                        {r.words} từ · {Math.round(r.elapsed_seconds / 60)} phút ·{" "}
                        {new Date(r.submitted_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                      </span>
                    </span>
                    <Band kq={kq} />
                    <span className="text-sm font-semibold text-[#14532D] group-open:hidden">Đọc bài ↓</span>
                    <span className="hidden text-sm font-semibold text-[#14532D] group-open:inline">Thu gọn ↑</span>
                  </summary>
                  <div className="border-t border-black/10 p-5">
                    <p className="mb-3 whitespace-pre-line rounded-xl bg-[#F3F4EF] p-3 text-xs text-[#1A1A1A]/70">{r.prompt_text}</p>
                    <div className="whitespace-pre-line text-[15px] leading-relaxed text-[#1A1A1A]">{r.essay}</div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Band({ kq }: { kq: KetQua | null }) {
  // NULL = chưa có lượt chấm nào thành công (dịch vụ bận/chưa cấu hình, hoặc
  // học sinh đóng tab trước khi chấm). Không ghi "đang chấm" — có thể chẳng ai đang chấm.
  if (!kq) return <span className="text-xs font-semibold text-[#1A1A1A]/45">Chưa có band</span>;
  if (kq.kind === "too-short") return <span className="text-xs font-semibold text-[#B45309]">Quá ngắn để chấm</span>;
  if (kq.kind !== "graded") return <span className="text-xs font-semibold text-[#B45309]">Chưa chấm được</span>;
  return (
    <span className="flex items-center gap-3">
      {kq.result.criteria.map((c) => (
        <span key={c.id} className="text-center">
          <span className="block text-[10px] font-bold text-[#1A1A1A]/45">{c.id}</span>
          <span className="font-mono text-sm font-bold text-[#1A1A1A]">{c.band.toFixed(1)}</span>
        </span>
      ))}
      <span className="rounded-xl bg-[#9FE870]/30 px-3 py-1.5 text-center">
        <span className="block text-[10px] font-bold text-[#14532D]/70">Band</span>
        <span className="font-mono text-lg font-bold text-[#14532D]">{kq.result.overall?.toFixed(1) ?? "—"}</span>
      </span>
    </span>
  );
}
