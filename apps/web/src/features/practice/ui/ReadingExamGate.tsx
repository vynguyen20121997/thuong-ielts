"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Clock,
  Highlighter,
  ListChecks,
  Loader2,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";

import {
  clearReadingProgress,
  formatClock,
  readReadingProgress,
} from "../application/useReadingSession";
import { LEVEL_LABELS } from "../domain/catalog";
import type { ExamOutline, ReadingPaper } from "../domain/types";
import { fetchReadingPaper } from "../infrastructure/readingApi";
import ReadingPlayer from "./ReadingPlayer";

/**
 * Màn chờ trước phòng thi Reading.
 *
 * Hai lý do nó tồn tại, ngoài chuyện cho giống phòng thi thật:
 *
 * 1. Đồng hồ chỉ bắt đầu khi học sinh bấm "Bắt đầu". Trước đây đồng hồ chạy
 *    ngay lúc trang render, ai đọc kỹ hướng dẫn là mất phút của mình.
 * 2. Nội dung bài đọc chỉ tải sau khi bấm, nên đề không nằm sẵn trong HTML của
 *    màn chờ — và thanh tiến trình ở đây đang chờ một request thật.
 *
 * Listening cố ý KHÔNG dùng màn này: `ListeningPlayer` đã có màn hướng dẫn
 * riêng, và nút "Bắt đầu" của nó chính là cú bấm mà trình duyệt đòi để cho
 * phép phát tiếng. Xem chú thích ở trang `listening/[slug]`.
 */

type Phase = "intro" | "loading" | "running";

/** Nếu tải xong quá nhanh, màn chờ nháy một cái rồi biến mất — khó chịu hơn là chờ. */
const MIN_LOADING_MS = 700;

export default function ReadingExamGate({ outline }: { outline: ExamOutline }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [paper, setPaper] = useState<ReadingPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Có bài đang làm dở trong phiên trình duyệt này không. */
  const [saved, setSaved] = useState<{ remainingSeconds: number; answered: number } | null>(null);
  const [resume, setResume] = useState(false);

  // Đọc sau khi mount: sessionStorage không tồn tại lúc server render.
  useEffect(() => {
    const progress = readReadingProgress(outline.id);
    if (!progress) return;
    setSaved({
      remainingSeconds: progress.remainingSeconds,
      answered: Object.values(progress.answers).filter((v) => String(v).trim()).length,
    });
  }, [outline.id]);

  const start = useCallback(
    async (continuing: boolean) => {
      setPhase("loading");
      setError(null);
      setResume(continuing);
      if (!continuing) clearReadingProgress(outline.id);

      const startedAt = Date.now();
      try {
        const loaded = await fetchReadingPaper(outline.mode, outline.id);
        const remaining = MIN_LOADING_MS - (Date.now() - startedAt);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

        setPaper(loaded);
        setPhase("running");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được đề.");
        setPhase("intro");
      }
    },
    [outline.mode, outline.id]
  );

  if (phase === "running" && paper) {
    return <ReadingPlayer paper={paper} resume={resume} />;
  }

  const minutes = Math.round(outline.durationSeconds / 60);
  const multi = outline.parts.length > 1;
  const loading = phase === "loading";

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <Link
        href="/kiem-tra-kien-thuc/reading"
        className="inline-flex items-center gap-2 text-2xs font-medium text-ink/45 hover:text-brand transition-colors"
      >
        <ArrowLeft size={13} />
        Danh sách đề
      </Link>

      <div className="mt-5 bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
        {/* Bìa đề */}
        <div className="relative bg-gradient-to-br from-brand to-brand-deep px-6 md:px-9 py-7 md:py-9 overflow-hidden">
          <span className="absolute -right-6 -bottom-10 font-serif text-[9rem] font-bold text-white/[0.07] leading-none select-none">
            {outline.questionCount}
          </span>

          <div className="relative z-10">
            <span className="text-2xs font-medium text-leaf">
              {outline.collection} · {LEVEL_LABELS[outline.level]}
            </span>
            <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight mt-2">
              {outline.title}
            </h1>
            <p className="text-white/70 text-sm mt-2">
              {multi
                ? `Thi trọn ${outline.parts.length} passage trong một lượt, một đồng hồ chung.`
                : "Luyện riêng một passage."}
            </p>
          </div>
        </div>

        {/* Thông số */}
        <div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5">
          {[
            { icon: ListChecks, value: `${outline.questionCount}`, label: "câu hỏi" },
            { icon: Clock, value: `${minutes}`, label: "phút" },
            { icon: BookOpen, value: `${outline.parts.length}`, label: "passage" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="px-4 py-5 flex flex-col items-center gap-1">
              <Icon size={15} className="text-brand/50" />
              <span className="font-serif text-2xl font-bold text-ink leading-none tabular-nums">
                {value}
              </span>
              <span className="text-2xs text-ink/40 font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="px-6 md:px-9 py-6 md:py-7">
          {/* Cấu trúc bài */}
          {multi && (
            <div className="mb-6">
              <span className="text-2xs text-brand font-medium">
                Cấu trúc bài thi
              </span>
              <ol className="mt-3 flex flex-col gap-1.5">
                {outline.parts.map((part, index) => (
                  <li
                    key={part.label}
                    className="flex items-center gap-3 rounded-xl border border-black/5 bg-[#FAFAF8] px-3 py-2.5"
                  >
                    <span className="font-mono text-2xs font-bold text-brand/40 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="flex-1 min-w-0 text-xs font-bold text-ink truncate">
                      {part.label}
                    </span>
                    <span className="font-mono text-2xs font-bold text-ink/45 whitespace-nowrap">
                      {part.questionCount} câu
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Luật chơi — đọc trước khi đồng hồ chạy */}
          <span className="text-2xs text-brand font-medium">
            Trước khi bắt đầu
          </span>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink/70">
            <li className="flex gap-2.5">
              <Timer size={15} className="shrink-0 mt-0.5 text-brand/50" />
              <span>
                Đồng hồ <b className="text-ink">chỉ chạy sau khi bấm bắt đầu</b>, không chạy
                trong lúc đọc trang này. Hết {minutes} phút, bài tự nộp với những gì đã điền.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Highlighter size={15} className="shrink-0 mt-0.5 text-brand/50" />
              <span>
                Bôi đen chữ trong bài để tô màu hoặc đánh dấu câu cần quay lại, như gạch chì trên đề
                giấy.
              </span>
            </li>
            <li className="flex gap-2.5">
              <ListChecks size={15} className="shrink-0 mt-0.5 text-brand/50" />
              <span>
                Nộp sớm lúc nào cũng được. Nộp xong mới hiện đáp án đúng
                {multi ? " của cả ba passage" : ""}, kèm giải thích nếu đề có.
              </span>
            </li>
          </ul>

          {error && (
            <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/*
            Có bài dở thì mời làm tiếp, và để "làm lại từ đầu" thành lựa chọn
            phụ — người tải nhầm trang muốn về đúng chỗ cũ, chứ hiếm ai muốn
            xoá công sức vừa bỏ ra.
          */}
          {saved && !loading && (
            <p className="mt-7 flex items-start gap-2 rounded-xl border border-leaf/50 bg-leaf/10 px-4 py-3 text-sm text-brand">
              <RotateCcw size={15} className="shrink-0 mt-0.5" />
              <span>
                Bạn có bài đang làm dở: <b>{saved.answered} câu</b> đã điền, còn{" "}
                <b className="tabular-nums">{formatClock(saved.remainingSeconds)}</b>.
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={() => start(Boolean(saved))}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2.5 py-4 bg-brand hover:bg-brand-deep disabled:cursor-wait text-white font-bold text-xs rounded-full transition-colors cursor-pointer tracking-wider uppercase"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
                Đang tải đề...
              </>
            ) : saved ? (
              <>
                <RotateCcw size={15} />
                Làm tiếp
              </>
            ) : (
              <>
                <Play size={15} />
                Bắt đầu làm bài
              </>
            )}
          </button>

          {saved && !loading && (
            <button
              type="button"
              onClick={() => {
                setSaved(null);
                start(false);
              }}
              className="mt-2 w-full py-3 text-2xs font-medium text-ink/50 hover:text-brand cursor-pointer transition-colors"
            >
              Bỏ bài dở, làm lại từ đầu
            </button>
          )}

          {/*
            Thanh chạy trong lúc chờ request thật. Không có phần trăm vì không
            đo được thật — vạch chạy qua lại nói đúng những gì mình biết.
          */}
          {loading && (
            <div className="mt-4">
              <div className="h-1 w-full bg-black/[0.06] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-brand rounded-full animate-[gate-sweep_1.1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-none" />
              </div>
              <p className="mt-3 text-center text-2xs text-ink/40 font-medium">
                Đang tải {outline.questionCount} câu hỏi và{" "}
                {outline.parts.length > 1 ? `${outline.parts.length} bài đọc` : "bài đọc"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
