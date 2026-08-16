"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, Clock, ListChecks, Timer, Users } from "lucide-react";

import { LEVEL_LABELS, formatAttempts, passageLabelOf, type TestGroup } from "../domain/catalog";
import type { ReadingLevel } from "../domain/types";

/**
 * Một test (Cam 10 · Test 1) trong lưới đề đọc. Thẻ mở ra tại chỗ để chọn
 * passage thay vì dẫn sang trang trung gian: mỗi passage vẫn là một bài thi
 * 20 phút riêng, nên chỗ chọn nằm ngay cạnh chỗ nhìn thấy test.
 *
 * Nhóm chỉ có một passage thì cả thẻ là một link — không có gì để chọn.
 */

const LEVEL_STYLES: Record<ReadingLevel, string> = {
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

export default function ReadingTestGroupCard({
  group,
  index,
}: {
  group: TestGroup;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const minutes = Math.round(group.durationSeconds / 60);
  const single = group.passages.length === 1 ? group.passages[0] : null;
  /** Thẻ đang bày đủ passage của test, không bị bộ lọc cắt bớt. */
  const full = group.passages.length === group.fullPassageCount;

  const cover = (
    <div
      className={`relative h-40 bg-gradient-to-br ${COVER_TONES[index % COVER_TONES.length]} overflow-hidden`}
    >
      <span className="absolute -right-4 -bottom-8 font-serif text-[7rem] font-bold text-white/[0.08] leading-none select-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative z-10 h-full p-5 flex flex-col justify-between">
        <span className="text-2xs font-medium text-[#9FE870]">
          {group.collection}
        </span>
        <span className="inline-flex items-center gap-1.5 self-start bg-white/10 backdrop-blur-sm text-white text-2xs font-medium px-2.5 py-1 rounded-full">
          <BookOpen size={11} />
          {group.passages.length} passage
        </span>
      </div>

      {group.isFree && (
        <span className="absolute top-4 right-4 z-10 bg-[#9FE870] text-[#14532D] text-2xs font-medium px-2.5 py-1 rounded-full">
          Free
        </span>
      )}
    </div>
  );

  const stats = (
    <div className="flex items-center gap-3 text-[#1A1A1A]/50">
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
  );

  const heading = (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {group.levels.map((level) => (
          <span
            key={level}
            className={`text-2xs font-medium px-2 py-0.5 rounded-full ${LEVEL_STYLES[level]}`}
          >
            {LEVEL_LABELS[level]}
          </span>
        ))}
      </div>

      <h3 className="font-serif text-lg font-bold tracking-tight text-[#1A1A1A] leading-snug group-hover:text-[#14532D] transition-colors">
        {group.label}
      </h3>
    </>
  );

  const shell =
    "group flex flex-col bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#14532D]/30 transition-all duration-300";

  // Một passage: không có gì để chọn, cả thẻ là link như trước.
  if (single) {
    return (
      <Link
        href={`/kiem-tra-kien-thuc/reading/${single.slug}`}
        className={`${shell} hover:-translate-y-1`}
      >
        {cover}
        <div className="p-5 flex flex-col flex-1">
          {heading}
          <p className="mt-1 text-2xs text-[#1A1A1A]/40 font-medium">{passageLabelOf(single)}</p>
          <div className="mt-auto pt-4">{stats}</div>
        </div>
      </Link>
    );
  }

  return (
    <div className={shell}>
      {cover}

      <div className="p-5 flex flex-col flex-1">
        {heading}
        {stats}

        {/*
          Hai cách vào bài. "Làm cả test" chỉ hiện khi thẻ đang bày đủ passage
          của test — lọc còn 2/3 mà vẫn mời thi cả 3 thì là nói dối cái đang
          nhìn thấy.
        */}
        {full && (
          <Link
            href={`/kiem-tra-kien-thuc/reading/test/${group.id}`}
            className="mt-4 flex items-center justify-center gap-2 w-full rounded-full bg-[#14532D] hover:bg-[#052E16] px-4 py-3 text-2xs font-medium text-white transition-colors"
          >
            <Timer size={13} />
            Làm cả test · {minutes} phút
          </Link>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className={`${full ? "mt-2" : "mt-4"} flex items-center justify-between gap-2 w-full rounded-full border border-black/10 px-4 py-2.5 text-2xs font-medium text-[#14532D] hover:border-[#14532D]/40 hover:bg-[#14532D]/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D]/40 cursor-pointer transition-colors`}
        >
          {open ? "Thu gọn" : "Hoặc làm từng passage"}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <ul id={panelId} hidden={!open} className="mt-3 flex flex-col gap-1.5">
          {group.passages.map((passage, order) => (
            <li key={passage.id}>
              <Link
                href={`/kiem-tra-kien-thuc/reading/${passage.slug}`}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-[#FAFAF8] px-3 py-2.5 hover:border-[#14532D]/30 hover:bg-white transition-colors"
              >
                <span className="font-mono text-2xs font-bold text-[#14532D]/40 tabular-nums">
                  {order + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#1A1A1A] truncate">
                    {passageLabelOf(passage)}
                  </span>
                  <span className="block text-2xs text-[#1A1A1A]/40 font-medium">
                    {passage.topic}
                  </span>
                </span>
                <span className="font-mono text-2xs font-bold text-[#1A1A1A]/50 whitespace-nowrap">
                  {passage.questionCount} câu
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
