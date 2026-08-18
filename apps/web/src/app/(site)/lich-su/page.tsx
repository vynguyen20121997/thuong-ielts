import Link from "next/link";
import { redirect } from "next/navigation";

import { currentStudent } from "../../../features/account/server/guard";
import { listAttemptsByStudent } from "../../../features/practice/server/attemptRepository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bài đã làm | HNT.IELTS",
  description: "Xem lại các bài Reading và Listening em đã làm, điểm và band ước tính.",
};

/**
 * Lịch sử làm bài của học viên.
 *
 * Bài đã được lưu từ lúc có bảng `attempts`, nhưng chưa có màn hình nào cho các
 * em mở ra — nên với học sinh thì coi như chưa lưu gì. Trang này là chỗ đó.
 *
 * Chỉ hiện lượt của CHÍNH em ấy: `listAttemptsByStudent` lọc theo id lấy từ
 * phiên đăng nhập, không phải từ đường dẫn.
 */
export default async function TrangLichSu() {
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/lich-su");

  const luot = await listAttemptsByStudent(student.id, 100);
  // Chỉ tính trung bình trên những bài đã có điểm — bài cô chưa mở thì
  // không có gì để cộng.
  const daNop = luot.filter((l) => l.total > 0 && l.correct !== null);

  const tb = daNop.length
    ? (daNop.reduce((t, l) => t + (l.correct ?? 0) / Math.max(1, l.total), 0) / daNop.length) * 100
    : 0;

  return (
    <main className="relative z-10 pt-28 pb-20 bg-[#FAF9F6] min-h-screen">
      <div className="mx-auto max-w-3xl px-5">
        <h1 className="font-serif text-4xl font-black text-[#1A1A1A] mb-2">Bài đã làm</h1>
        <p className="text-sm text-[#1A1A1A]/55 mb-8">
          Toàn bộ bài Reading và Listening em đã làm trên trang này.
        </p>

        {luot.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-10 text-center">
            <p className="font-bold text-[#1A1A1A] mb-1">Chưa có bài nào</p>
            <p className="text-sm text-[#1A1A1A]/50 mb-5">
              Làm một đề rồi quay lại đây xem tiến bộ của mình nhé.
            </p>
            <Link
              href="/kiem-tra-kien-thuc"
              className="inline-block rounded-full bg-[#14532D] hover:bg-[#052E16] px-5 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Chọn đề để làm
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-8 rounded-2xl border border-black/10 bg-white px-6 py-5 mb-5">
              <Stat so={String(luot.length)} nhan="Bài đã làm" />
              <Stat so={`${Math.round(tb)}%`} nhan="Đúng trung bình" />
              <Stat
                so={
                  daNop.length
                    ? Math.max(...daNop.map((l) => l.band ?? 0)).toFixed(1)
                    : "—"
                }
                nhan="Band cao nhất"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              {luot.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white px-5 py-4"
                >
                  <span className="min-w-0 mr-auto">
                    <span className="block text-sm font-bold text-[#1A1A1A]">{l.title}</span>
                    <span className="block text-xs text-[#1A1A1A]/45 mt-0.5">
                      {l.skill === "listening" ? "Nghe" : "Đọc"} ·{" "}
                      {new Date(l.submittedAt).toLocaleDateString("vi-VN")} ·{" "}
                      {Math.round(l.elapsedSeconds / 60)} phút
                    </span>
                  </span>

                  {l.correct === null ? (
                    <span className="rounded-lg bg-black/[0.05] px-2.5 py-1 text-xs font-semibold text-[#1A1A1A]/50">
                      Chờ thầy cô trả điểm
                    </span>
                  ) : (
                    <span className="text-base font-black tabular-nums text-[#1A1A1A]">
                      {l.correct}
                      <span className="text-[#1A1A1A]/40 font-medium text-sm">/{l.total}</span>
                    </span>
                  )}

                  {l.band !== null && (
                    <span className="rounded-lg bg-[#9FE870]/25 px-2.5 py-1 text-xs font-black text-[#14532D] tabular-nums">
                      {l.band.toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-[#1A1A1A]/40 mt-5">
              Band là ước tính quy đổi từ số câu đúng, không phải điểm thi thật.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ so, nhan }: { so: string; nhan: string }) {
  return (
    <span className="block">
      <b className="block font-serif text-2xl font-black text-[#14532D] tabular-nums leading-tight">
        {so}
      </b>
      <span className="block text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/40">
        {nhan}
      </span>
    </span>
  );
}
