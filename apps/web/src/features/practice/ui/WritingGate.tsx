"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  ListChecks,
  PenLine,
  Play,
  RotateCcw,
  Type,
} from "lucide-react";

import {
  WRITING_MINUTES,
  WRITING_MIN_WORDS,
  countWords,
} from "../domain/writing";
import type { WritingPrompt } from "../server/writingRepository";
import WritingDesk, {
  readWritingDraft,
  clearWritingDraft,
} from "./WritingDesk";

/**
 * Màn bìa trước khi vào bài Writing — cùng vai với `ReadingExamGate`.
 *
 * Hai lý do nó tồn tại, giống hệt bên Reading:
 *
 * 1. **Đồng hồ chỉ chạy sau khi bấm "Bắt đầu".** Trước đây đồng hồ chạy từ ký
 *    tự đầu tiên, nghe thì hợp lý nhưng sai ở chỗ: học sinh đọc đề, nghĩ dàn ý
 *    năm phút, rồi mới gõ — và bài thi thật tính cả năm phút đó.
 * 2. **Nói trước luật chơi.** Số từ tối thiểu, thời gian, và quan trọng nhất:
 *    phần kiểm tra tự động KHÔNG chấm band. Nói sau khi học sinh viết xong là
 *    quá muộn để em ấy chỉnh kỳ vọng.
 *
 * Khác Reading một chỗ: ở đây không phải tải đề (đề đã nằm sẵn trong HTML do
 * trang là server component), nên bấm là vào thẳng, không có lớp phủ chờ.
 */
export default function WritingGate({
  prompt,
  knowledge,
}: {
  prompt: WritingPrompt;
  knowledge: { id: string; topic: string }[];
}) {
  const [started, setStarted] = useState(false);
  const [resume, setResume] = useState(false);
  /** Bài dở còn trong phiên trình duyệt này, nếu có. */
  const [draft, setDraft] = useState<{ words: number } | null>(null);

  // Đọc sau khi mount: `sessionStorage` không tồn tại lúc server render.
  useEffect(() => {
    const saved = readWritingDraft(prompt.id);
    if (saved && saved.trim()) setDraft({ words: countWords(saved) });
  }, [prompt.id]);

  const start = useCallback(
    (continuing: boolean) => {
      if (!continuing) clearWritingDraft(prompt.id);
      setResume(continuing);
      setStarted(true);
    },
    [prompt.id],
  );

  if (started)
    return (
      <WritingDesk
        prompt={prompt}
        knowledge={knowledge}
        autoStart
        resume={resume}
      />
    );

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/kiem-tra-kien-thuc/writing"
        className="inline-flex items-center gap-2 text-2xs font-medium text-ink/45 hover:text-brand transition-colors"
      >
        <ArrowLeft size={13} />
        Danh sách đề
      </Link>

      <div className="mt-5 bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
        {/* Bìa đề */}
        <div className="relative bg-gradient-to-br from-brand to-brand-deep px-6 md:px-9 py-7 md:py-9 overflow-hidden">
          <span className="absolute -right-4 -bottom-10 text-[9rem] font-bold text-white/[0.07] leading-none select-none">
            2
          </span>
          <div className="relative z-10">
            <span className="text-2xs font-medium text-leaf">
              Writing Task 2 · {prompt.topic}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight mt-2">
              {prompt.title}
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Viết một bài luận hoàn chỉnh, bấm giờ như phòng thi.
            </p>
          </div>
        </div>

        {/* Thông số — cùng bố cục với màn bìa Reading để hai kỹ năng đọc như một */}
        <div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5">
          {[
            {
              icon: Type,
              value: `${WRITING_MIN_WORDS}`,
              label: "từ tối thiểu",
            },
            { icon: Clock, value: `${WRITING_MINUTES}`, label: "phút" },
            { icon: ListChecks, value: "6", label: "mục kiểm tra" },
          ].map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="px-4 py-5 flex flex-col items-center gap-1"
            >
              <Icon size={15} className="text-brand/50" />
              <span className="text-2xl font-bold text-ink leading-none tabular-nums">
                {value}
              </span>
              <span className="text-2xs text-ink/40 font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="px-6 md:px-9 py-6 md:py-7">
          {/* Đề, nguyên văn — đọc kỹ trước khi đồng hồ chạy */}
          <span className="text-2xs text-brand font-medium">Đề bài</span>
          <p className="mt-3 rounded-xl border border-black/5 bg-[#FAFAF8] px-4 py-3.5 text-sm text-ink leading-relaxed whitespace-pre-line">
            {prompt.prompt}
          </p>

          <span className="mt-6 block text-2xs text-brand font-medium">
            Trước khi bắt đầu
          </span>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink/70">
            <li className="flex gap-2.5">
              <Clock size={15} className="shrink-0 mt-0.5 text-brand/50" />
              <span>
                Đồng hồ <b className="text-ink">chỉ chạy sau khi bấm bắt đầu</b>
                , không chạy trong lúc đọc trang này. Hết {WRITING_MINUTES} phút
                bài <b className="text-ink">không tự nộp</b> — em vẫn viết tiếp
                được, đồng hồ chỉ cho biết mình nhanh hay chậm so với phòng thi.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Lightbulb size={15} className="shrink-0 mt-0.5 text-brand/50" />
              <span>
                Bí ý thì cứ dừng bút. Sau khoảng mười giây không gõ, bảng bên
                phải sẽ gợi{" "}
                <b className="text-ink">câu hỏi để em tự nghĩ ra ý</b> — không
                viết câu thay em.
              </span>
            </li>
            <li className="flex gap-2.5">
              <PenLine size={15} className="shrink-0 mt-0.5 text-brand/50" />
              <span>
                Viết xong bấm <b className="text-ink">Kiểm tra nháp</b> để soi
                lỗi bố cục, lạc đề, thiếu ví dụ. Phần này{" "}
                <b className="text-ink">không chấm band</b> — bài vẫn cần cô
                Thương chấm theo barem.
              </span>
            </li>
          </ul>

          {draft && (
            <div className="mt-6 rounded-xl border border-brand/20 bg-leaf/[0.12] px-4 py-3.5">
              <p className="text-sm text-ink">
                Có một bài dở trong phiên này —{" "}
                <b className="font-mono tabular-nums">{draft.words}</b> từ đã
                viết.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => start(Boolean(draft))}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-brand hover:bg-brand-deep px-6 py-4 text-sm font-semibold text-white cursor-pointer transition-colors"
          >
            <Play size={16} />
            {draft ? "Viết tiếp bài dở" : "Bắt đầu viết"}
          </button>

          {draft && (
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm("Bỏ bài đang viết dở và bắt đầu lại từ đầu?")
                )
                  return;
                setDraft(null);
                start(false);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-3 text-2xs font-medium text-ink/50 hover:text-brand cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              Bỏ bài dở, viết lại từ đầu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
