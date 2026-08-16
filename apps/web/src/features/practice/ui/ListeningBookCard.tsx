"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, Clock, Headphones, ListChecks, Users } from "lucide-react";

import { formatAttempts } from "../domain/catalog";
import {
  coverageNoteOf,
  isFullTest,
  testLabelFromTitle,
  type ListeningBookGroup,
} from "../domain/listeningCatalog";

/**
 * Một bộ đề nghe (Cam 12) trong lưới, dựng theo đúng mẫu thẻ Reading.
 *
 * Thẻ chỉ hiện tên bộ; bốn test nằm bên trong, mở ra mới thấy. Khác thẻ
 * Reading ở chỗ mỗi dòng con là một *bài thi trọn vẹn* 30 phút, không phải một
 * phần của bài — nên mỗi dòng là một link vào phòng thi.
 */

const COVER_TONES = [
  "from-[#14532D] to-[#052E16]",
  "from-[#1A3A2A] to-[#14532D]",
  "from-[#245C3A] to-[#0B3D22]",
];

export default function ListeningBookCard({
  group,
  index,
}: {
  group: ListeningBookGroup;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const minutes = Math.round(group.durationSeconds / 60);

  return (
    <div className="group flex flex-col bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#14532D]/30 transition-all duration-300">
      {/* Bìa */}
      <div
        className={`relative h-40 bg-gradient-to-br ${
          COVER_TONES[index % COVER_TONES.length]
        } overflow-hidden`}
      >
        <span className="absolute -right-4 -bottom-8 font-serif text-[7rem] font-bold text-white/[0.08] leading-none select-none">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative z-10 h-full p-5 flex flex-col justify-between">
          <span className="text-2xs font-medium text-[#9FE870]">{group.collection}</span>
          <span className="inline-flex items-center gap-1.5 self-start bg-white/10 backdrop-blur-sm text-white text-2xs font-medium px-2.5 py-1 rounded-full">
            <Headphones size={11} />
            {group.tests.length} test
          </span>
        </div>
      </div>

      {/* Thân */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-lg font-bold tracking-tight text-[#1A1A1A] leading-snug group-hover:text-[#14532D] transition-colors">
          {group.label}
        </h3>

        <div className="mt-3 flex items-center gap-3 text-[#1A1A1A]/50">
          <span className="flex items-center gap-1.5 text-2xs font-medium tabular-nums whitespace-nowrap">
            <ListChecks size={13} />
            {group.questionCount} câu
          </span>
          <span className="flex items-center gap-1.5 text-2xs font-medium tabular-nums whitespace-nowrap">
            <Clock size={13} />
            {minutes} phút
          </span>
          <span className="flex items-center gap-1.5 text-2xs font-medium tabular-nums whitespace-nowrap ml-auto">
            <Users size={13} />
            {formatAttempts(group.attemptCount)} lượt làm
          </span>
        </div>

        {/* Nói trước bộ này có mấy đề thiếu phần, khỏi mở ra mới biết. */}
        {group.partialCount > 0 && (
          <p className="flex items-start gap-1.5 text-2xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-3 leading-snug">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>
              {group.partialCount}/{group.tests.length} đề trong bộ thiếu phần vì nguồn chưa có
              audio.
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="mt-4 flex items-center justify-between gap-2 w-full rounded-full bg-[#14532D] hover:bg-[#052E16] px-4 py-3.5 text-2xs font-semibold text-white cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D]/40"
        >
          {open ? "Thu gọn" : `Chọn 1 trong ${group.tests.length} test`}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <ul id={panelId} hidden={!open} className="mt-3 flex flex-col gap-1.5">
          {group.tests.map((test, order) => (
            <li key={test.id}>
              <Link
                href={`/kiem-tra-kien-thuc/listening/${test.slug}`}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-[#FAFAF8] px-3 py-2.5 hover:border-[#14532D]/30 hover:bg-white transition-colors"
              >
                <span className="font-mono text-2xs font-bold text-[#14532D]/40 tabular-nums">
                  {order + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-[#1A1A1A] truncate">
                    {testLabelFromTitle(test.title)}
                  </span>
                  {!isFullTest(test) && (
                    <span className="block text-2xs text-amber-700 truncate">
                      {coverageNoteOf(test)}
                    </span>
                  )}
                </span>
                <span className="text-2xs font-medium text-[#1A1A1A]/50 whitespace-nowrap tabular-nums">
                  {test.questionCount} câu · {Math.round(test.durationSeconds / 60)}′
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
