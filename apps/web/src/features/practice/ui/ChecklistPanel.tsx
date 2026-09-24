"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  ClipboardCheck,
  Loader2,
  PenLine,
  X,
} from "lucide-react";

import { WRITING_CHECKABLE_WORDS, type CheckResult } from "../domain/writing";
import {
  checkWriting,
  type FeedbackReason,
} from "../infrastructure/writingApi";

/**
 * Hộp "Kiểm tra nháp" — ở cột phải, dưới `KnowledgePanel`.
 *
 * ## Vì sao tách ra khỏi bảng gợi ý
 *
 * Trước đây checklist DÙNG CHUNG chỗ với bảng gợi ý ý tưởng: có `checks` thì
 * nó chiếm chỗ, bấm "Quay lại gợi ý" thì trả về. Hai việc khác nhau mà tranh
 * nhau một khung — muốn vừa xem lỗi vừa xem dàn ý thì phải bấm qua bấm lại, và
 * mỗi lần bấm là mất dấu chỗ đang đọc. Giờ mỗi hộp một chỗ, cùng hiện được.
 *
 * ## Vì sao nó tự giữ trạng thái
 *
 * `WritingDesk` không cần biết checklist đang có gì: nó chỉ đưa bài viết vào,
 * không đọc kết quả ra. Giữ `checks` ở đây thì mỗi lần chấm nháp chỉ vẽ lại
 * đúng hộp này, không đụng tới ô viết đang gõ dở. Xoá bài làm lại thì
 * `WritingDesk` đổi `key` để hộp dựng lại từ đầu — rẻ hơn là chuyền thêm một
 * đường dây reset xuống đây.
 *
 * Nút bấm nằm TRONG hộp, không nằm dưới ô viết, vì kết quả hiện ngay bên dưới
 * nó. Nút ở một đầu trang mà kết quả ở đầu kia là học sinh bấm xong không biết
 * nhìn đâu.
 *
 * Xem chú thích đầu `domain/writing.ts`: đây KHÔNG phải band điểm, và đừng
 * gộp nó với nút "Chấm thử 4 tiêu chí".
 */

function CheckRow({ check }: { check: CheckResult }) {
  const tone =
    check.passed === true
      ? { icon: Check, ring: "bg-leaf/25 text-brand", text: "text-ink" }
      : check.passed === false
        ? { icon: X, ring: "bg-warn-soft text-warn", text: "text-ink" }
        : {
            icon: CircleHelp,
            ring: "bg-black/[0.05] text-ink/40",
            text: "text-ink/70",
          };
  const Icon = tone.icon;

  return (
    <li className="flex items-start gap-3 py-3.5 border-b border-black/5 last:border-b-0">
      <span
        className={`mt-0.5 h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${tone.ring}`}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-snug ${tone.text}`}>
          {check.label}
          {check.passed === null && (
            <span className="ml-2 text-2xs font-medium text-ink/40">
              chưa đủ chắc để nói
            </span>
          )}
        </p>
        {/* Lời khuyên chỉ hiện khi CHƯA đạt. Hiện cả khi đã đạt thì thành một
            bức tường chữ, và học sinh không biết nhìn vào đâu trước. */}
        {check.passed !== true && (
          <p className="text-2xs text-ink/55 leading-relaxed mt-1">
            {check.advice}
          </p>
        )}
      </div>
    </li>
  );
}

/** Vì sao không có checklist — nói đúng lý do, đừng để hộp trống. */
const REASON_TEXT: Record<Exclude<FeedbackReason, undefined>, string> = {
  "too-short": `Bài còn ngắn quá để nhận xét cho ra hồn. Viết thêm tới khoảng ${WRITING_CHECKABLE_WORDS} từ rồi bấm lại.`,
  unavailable:
    "Máy chưa đọc được bài lúc này. Bài viết của em vẫn giữ nguyên — bấm lại sau một lát.",
};

export default function ChecklistPanel({
  promptId,
  essay,
  words,
}: {
  promptId: string;
  essay: string;
  /** Đếm ở nơi gọi, để hộp này không phải đếm lại mỗi lần gõ một chữ. */
  words: number;
}) {
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [reason, setReason] = useState<FeedbackReason>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = words < WRITING_CHECKABLE_WORDS;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await checkWriting(promptId, essay);
      setChecks(data.checks);
      setReason(data.reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chấm nháp thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      /* Checklist sáu dòng kèm lời khuyên dài hơn màn hình — cùng lý do với
         bảng gợi ý, xem chú thích `panel-scroll` trong `globals.css`. */
      data-lenis-prevent
      className="panel-scroll w-full lg:max-h-[46vh] rounded-2xl border border-black/5 bg-white p-5 md:p-6 shadow-sm"
    >
      <span className="text-2xs font-bold uppercase tracking-[0.12em] text-ink/45 flex items-center gap-1.5">
        <ClipboardCheck size={13} />
        Kiểm tra nháp
      </span>

      <p className="text-2xs text-ink/50 leading-relaxed mt-2">
        Máy chỉ soi được những lỗi nhìn ra trong vài giây. Đây{" "}
        <b className="text-ink/70">không phải band điểm</b> — bài vẫn cần cô
        Thương chấm theo barem.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={busy || tooShort}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand hover:bg-brand-deep disabled:bg-black/15 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors"
      >
        {busy ? (
          <>
            <Loader2
              size={16}
              className="animate-spin motion-reduce:animate-none"
            />
            Đang đọc bài…
          </>
        ) : (
          <>
            <PenLine size={16} />
            {checks?.length ? "Kiểm tra lại" : "Kiểm tra nháp"}
          </>
        )}
      </button>

      {tooShort && (
        <p className="mt-2.5 text-2xs text-ink/40 leading-relaxed">
          Viết được khoảng {WRITING_CHECKABLE_WORDS} từ rồi kiểm tra sẽ có ích
          hơn.
        </p>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-700">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {checks?.length ? (
        <ul className="mt-2">
          {checks.map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </ul>
      ) : (
        reason && (
          <p className="mt-3 text-[13px] text-ink/55 leading-relaxed">
            {REASON_TEXT[reason]}
          </p>
        )
      )}
    </section>
  );
}
