"use client";

import Link from "next/link";
import { AlarmClock, RotateCcw, Target, Timer } from "lucide-react";

import { formatClock } from "../application/useReadingSession";
import { formatBand } from "../domain/bandScore";
import type { ReadingResult } from "../domain/types";

/**
 * Score summary shown after the server has graded the attempt.
 * Presentation only — every number here was computed in `domain/scoring.ts`.
 */
export default function ReadingResultPanel({
  result,
  timedOut,
  onRestart,
  catalogHref = "/kiem-tra-kien-thuc/reading",
}: {
  result: ReadingResult;
  timedOut: boolean;
  onRestart: () => void;
  /** Where "chọn đề khác" goes. The panel is shared with listening. */
  catalogHref?: string;
}) {
  const percent = Math.round(result.accuracy * 100);

  /*
    Cô đang giấu điểm của buổi này.

    Server đã cắt số liệu trước khi trả về, nên ở đây `correct` là 0 — phải nói
    rõ vì sao, kẻo em nhìn "0/40" rồi tưởng mình sai sạch bài. Đây là khoảnh
    khắc em ấy vừa làm xong 60 phút; một con số 0 không lời giải thích là đủ
    làm em ấy nản.
  */
  const giauDiem = result.daChe?.diem === true;

  return (
    <div className="bg-[#14532D] text-white rounded-2xl p-6 md:p-7 shadow-xl">
      <div className="flex items-center gap-2 mb-5">
        <Target size={15} className="text-[#9FE870]" />
        <span className="text-2xs font-medium text-[#9FE870]">
          {giauDiem ? "Đã nộp bài" : "Kết quả bài làm"}
        </span>
      </div>

      {giauDiem && (
        <div className="rounded-xl bg-white/10 px-4 py-3.5 mb-6">
          <p className="text-sm font-semibold">Bài của em đã nộp xong.</p>
          <p className="text-xs text-white/65 mt-1 leading-relaxed">
            Buổi này thầy cô chữa chung cả lớp trước rồi mới trả điểm. Quay lại trang này sau khi
            thầy cô mở kết quả nhé.
          </p>
        </div>
      )}

      <div className={`grid grid-cols-3 gap-4 mb-6 ${giauDiem ? "hidden" : ""}`}>
        <div>
          <span className="font-serif text-4xl font-bold block leading-none">
            {result.correct}
            <span className="text-white/40 text-2xl">/{result.total}</span>
          </span>
          <span className="text-2xs text-white/50 font-medium mt-2 block">Câu đúng</span>
        </div>
        <div>
          <span className="font-serif text-4xl font-bold block leading-none text-[#9FE870]">
            {formatBand(result.band)}
          </span>
          <span className="text-2xs text-white/50 font-medium mt-2 block">Band ước lượng</span>
        </div>
        <div>
          <span className="font-serif text-4xl font-bold block leading-none">{percent}%</span>
          <span className="text-2xs text-white/50 font-medium mt-2 block">Độ chính xác</span>
        </div>
      </div>

      {/* Accuracy bar */}
      <div className={`h-1.5 w-full bg-white/15 rounded-full overflow-hidden mb-5 ${giauDiem ? "hidden" : ""}`}>
        <div
          className="h-full bg-[#9FE870] rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/60 mb-6">
        <span className="flex items-center gap-1.5 font-mono text-2xs font-bold">
          <Timer size={13} />
          Thời gian làm: {formatClock(result.elapsedSeconds)}
        </span>
        {timedOut && (
          <span className="flex items-center gap-1.5 font-mono text-2xs font-bold text-[#9FE870]">
            <AlarmClock size={13} />
            Hết giờ — bài được nộp tự động
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-white/70 mb-6">
        Band ở trên là con số quy đổi tương đối từ thang 40 câu của IELTS Academic Reading, dùng để
        theo dõi tiến bộ chứ không thay thế điểm thi thật. Kéo xuống dưới để xem đáp án và giải
        thích cho từng câu.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="group px-6 py-3 bg-[#9FE870] hover:bg-[#86D65A] text-[#14532D] font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase inline-flex items-center gap-2"
        >
          <RotateCcw
            size={14}
            className="transition-transform duration-500 group-hover:-rotate-180"
          />
          Làm lại
        </button>
        <Link
          href={catalogHref}
          className="px-6 py-3 border border-white/25 hover:border-white/60 text-white font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase inline-flex items-center"
        >
          Chọn đề khác
        </Link>
      </div>
    </div>
  );
}
