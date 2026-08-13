import Link from "next/link";
import { BookOpen, Clock, ListChecks, Users } from "lucide-react";

import { LEVEL_LABELS, formatAttempts } from "../domain/catalog";
import type { ReadingTestSummary } from "../domain/types";

/**
 * One card in the reading catalog. Pure presentation: it receives a summary and
 * renders it — no fetching, no filtering, no knowledge of where the list came
 * from, which is why the same card works in the catalog and in any future
 * "related tests" strip.
 */

const LEVEL_STYLES: Record<ReadingTestSummary["level"], string> = {
  easy: "bg-[#9FE870]/30 text-[#14532D]",
  medium: "bg-[#14532D]/10 text-[#14532D]",
  hard: "bg-[#1A1A1A]/[0.07] text-[#1A1A1A]/70",
};

/** No stock photography in this project, so covers are generated from the data. */
const COVER_TONES = [
  "from-[#14532D] to-[#052E16]",
  "from-[#1A3A2A] to-[#14532D]",
  "from-[#245C3A] to-[#0B3D22]",
];

export default function ReadingTestCard({
  test,
  index,
}: {
  test: ReadingTestSummary;
  index: number;
}) {
  const minutes = Math.round(test.durationSeconds / 60);

  return (
    <Link
      href={`/kiem-tra-kien-thuc/reading/${test.slug}`}
      className="group flex flex-col bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#14532D]/30 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Cover */}
      <div
        className={`relative h-40 bg-gradient-to-br ${
          COVER_TONES[index % COVER_TONES.length]
        } overflow-hidden`}
      >
        <span className="absolute -right-4 -bottom-8 font-serif text-[7rem] font-black text-white/[0.08] leading-none select-none">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative z-10 h-full p-5 flex flex-col justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-[#9FE870]">
            {test.collection}
          </span>
          <span className="inline-flex items-center gap-1.5 self-start bg-white/10 backdrop-blur-sm text-white font-mono text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full">
            <BookOpen size={11} />
            Bài tập theo dạng
          </span>
        </div>

        {test.isFree && (
          <span className="absolute top-4 right-4 z-10 bg-[#9FE870] text-[#14532D] font-mono text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full">
            Free
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
              LEVEL_STYLES[test.level]
            }`}
          >
            {LEVEL_LABELS[test.level]}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/40 font-bold">
            {test.topic}
          </span>
        </div>

        <h3 className="font-serif text-lg font-black tracking-tight text-[#1A1A1A] leading-snug group-hover:text-[#14532D] transition-colors">
          {test.title}
        </h3>

        <div className="mt-auto pt-4 flex items-center gap-4 text-[#1A1A1A]/50">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
            <ListChecks size={13} />
            {test.questionCount} câu
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
            <Clock size={13} />
            {minutes} phút
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold ml-auto">
            <Users size={13} />
            {formatAttempts(test.attemptCount)} lượt làm
          </span>
        </div>
      </div>
    </Link>
  );
}
