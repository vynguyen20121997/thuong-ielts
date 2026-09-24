"use client";

import { useState } from "react";
import {
  WRITING_CRITERIA,
  adviceFor,
  type WritingState,
} from "@thuong-ielts/diagnostic";

/**
 * Bảng điểm bốn tiêu chí của một bài viết.
 *
 * Dùng ở HAI chỗ: Section 4 của bài kiểm tra nền và màn luyện Writing. Chúng
 * khác nhau ở phần chữ quanh con số — bài 15 phút phải nói rõ nó không phải
 * band thi thật — nên hai câu đó vào qua props `caption` và `footnote`, còn
 * cách vẽ thì một bản.
 *
 * ## Mục "Lỗi chi tiết" có khung, chưa có dữ liệu
 *
 * Bộ chấm dạng `score` chỉ trả về một con số cho mỗi tiêu chí, không trả văn
 * bản tự do — dựng danh sách lỗi từ nó là bịa vị trí lỗi mà học sinh tìm mãi
 * không thấy. Nên tab này nhận lỗi qua prop `issues` từ một bộ sinh riêng, và
 * khi chưa nối (`essayCoach.issues` trả `null`) thì nói thẳng "chưa soi" chứ
 * KHÔNG hiện "không có lỗi". Hai câu đó khác nhau một trời.
 *
 * ## Bốn thẻ điểm là bộ lọc
 *
 * Bấm TR/CC/LR/GRA thì "Điểm chi tiết" và "Lỗi chi tiết" thu về đúng tiêu chí
 * đó. Vẫn một bản nội dung, chỉ lọc bớt — không nhân đôi thành bốn hộp mở ra
 * đóng vào, vì hai chỗ cùng nói một điều là hai chỗ sẽ có ngày nói khác nhau.
 */

/** Một lỗi có trích dẫn; hình dạng đủ để vẽ, không phụ thuộc bộ sinh nào. */
export type BandIssue = {
  criterion: string;
  quote: string;
  why: string;
  fix?: string;
};

const BAND_MIN = 4;
const BAND_MAX = 9;
const percentOf = (band: number) =>
  Math.round(((band - BAND_MIN) / (BAND_MAX - BAND_MIN)) * 100);

export default function WritingBandReport({
  state,
  essay,
  minWords,
  caption,
  footnote,
  onRetry,
  retrying,
  emptyText,
  issues,
}: {
  state: WritingState | null;
  essay: string;
  minWords: number;
  /** Câu đứng cạnh điểm tổng, ví dụ "band tham khảo cho bài 15 phút". */
  caption: string;
  /** Câu cuối khối, nói rõ con số này là gì và không là gì. */
  footnote: string;
  onRetry: () => void;
  retrying: boolean;
  /** Câu hiện khi chưa viết gì. */
  emptyText: string;
  /**
   * Danh sách lỗi có trích dẫn. `null` = chưa nối bộ sinh văn bản; `[]` = đã
   * soi và không thấy lỗi nào. Hai thứ khác nhau, tab phải nói khác nhau.
   */
  issues?: BandIssue[] | null;
}) {
  const [tab, setTab] = useState<"scores" | "issues" | "essay" | "advice">(
    "scores",
  );
  /*
    Tiêu chí đang soi, `null` = xem cả bốn.

    Bốn thẻ điểm ở trên không chỉ để nhìn: bấm một thẻ là hai tab "Điểm chi
    tiết" và "Lỗi chi tiết" thu về đúng tiêu chí đó. Học sinh đọc bảng này theo
    đường "LR có 6.0, vì sao?" chứ không đọc tuần tự từ trên xuống — bắt cuộn
    qua ba tiêu chí không hỏi để tới cái đang hỏi là thừa.

    Không dựng thêm màn mới: vẫn đúng hai tab ấy, chỉ lọc bớt. Mỗi tiêu chí một
    hộp mở ra đóng vào thì cùng một nội dung nằm ở hai chỗ, và sẽ tới ngày hai
    chỗ nói khác nhau.
  */
  const [focus, setFocus] = useState<string | null>(null);
  const graded = state?.kind === "graded" ? state.result : null;
  const focused = WRITING_CRITERIA.find((c) => c.id === focus) ?? null;
  const shownCriteria = focused ? [focused] : WRITING_CRITERIA;
  /*
    Lọc lỗi theo mã tiêu chí, so KHÔNG phân biệt hoa thường và chấp nhận cả
    tên đầy đủ ("Lexical Resource") lẫn mã ngắn ("LR").

    Bộ sinh lỗi chưa nối (`essayCoach.issues` trả `null`), nên trường
    `criterion` hiện do hợp đồng quy định chứ chưa có dữ liệu thật để dựa vào.
    Nhận cả hai dạng để ngày nối vào không phải sửa chỗ này; lỗi mang mã lạ
    thì chỉ hiện ở màn "cả bốn tiêu chí" — thà nó nằm ngoài bộ lọc còn hơn bị
    gán bừa vào một tiêu chí không phải của nó.
  */
  const shownIssues = !issues
    ? []
    : focused
      ? issues.filter((x) => {
          const key = x.criterion.trim().toLowerCase();
          return (
            key === focused.short.toLowerCase() ||
            key === focused.english.toLowerCase()
          );
        })
      : issues;

  return (
    <section className="rounded-2xl border border-sage-3 bg-white p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-extrabold text-brand">
          Kết quả chấm bài viết
        </h3>
        {graded?.overall != null && (
          <p className="ml-auto flex items-baseline gap-2">
            <b className="font-mono text-3xl font-extrabold tracking-tight text-brand">
              {graded.overall.toFixed(1)}
            </b>
            <span className="max-w-[16ch] text-2xs leading-snug text-ink/60">
              {caption}
            </span>
          </p>
        )}
      </header>

      {state === null && (
        <p
          className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm"
          role="status"
        >
          Đang chấm bài viết…
        </p>
      )}

      {state?.kind === "empty" && (
        <p className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          {emptyText}
        </p>
      )}

      {state?.kind === "too-short" && (
        <p className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          Bài chỉ có {state.words} từ — quá ngắn để chấm theo bốn tiêu chí. Một
          nhận xét dựa trên vài câu thì không nói được gì về thực lực, nên phần
          này để trống thay vì cho một con số không có cơ sở.
        </p>
      )}

      {state?.kind === "ungraded" && (
        <div className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          <p>
            Chưa chấm được bài viết: {state.reason} Bài của bạn đã được lưu
            nguyên vẹn, chấm lại lúc nào cũng được.
          </p>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-3 rounded-xl border border-sage-3 bg-white px-4 py-2 text-sm font-bold text-brand disabled:opacity-60"
          >
            {retrying ? "Đang chấm…" : "Chấm lại bài viết"}
          </button>
        </div>
      )}

      {graded && (
        <>
          <ol className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {WRITING_CRITERIA.map((c) => {
              const s = graded.criteria.find((x) => x.id === c.id);
              if (!s) return null;
              const weak = s.band < 6;
              const on = focus === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setFocus(on ? null : c.id);
                      /* Bấm thẻ mà đang đứng ở "Bài làm"/"Gợi ý" thì cú bấm
                         không có gì để nhìn — kéo về tab điểm cho nó có hồi đáp. */
                      if (tab !== "scores" && tab !== "issues")
                        setTab("scores");
                    }}
                    className={`w-full cursor-pointer rounded-[13px] border p-3.5 text-left transition-colors ${
                      on
                        ? "border-brand bg-sage-2"
                        : "border-sage-3 hover:border-brand/40"
                    }`}
                  >
                    <p className="flex items-baseline justify-between gap-2">
                      <b className="font-mono text-2xs font-extrabold tracking-wider">
                        {c.short}
                      </b>
                      <span className="font-mono text-xl font-extrabold tracking-tight text-brand">
                        {s.band.toFixed(1)}
                      </span>
                    </p>
                    <span
                      className="my-2 block h-1.5 rounded-full bg-sage-2"
                      aria-hidden
                    >
                      <i
                        className={`block h-full rounded-full ${weak ? "bg-warn" : "bg-brand"}`}
                        style={{ width: `${percentOf(s.band)}%` }}
                      />
                    </span>
                    <p className="text-2xs leading-snug text-ink/60">
                      {c.label}
                    </p>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist">
            {(["scores", "issues", "essay", "advice"] as const).map((t, i) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  tab === t ? "bg-brand text-white" : "bg-mist-3 text-ink"
                }`}
              >
                {
                  [
                    "Điểm chi tiết",
                    `Lỗi chi tiết (${shownIssues.length})`,
                    "Bài làm",
                    "Gợi ý",
                  ][i]
                }
              </button>
            ))}
          </div>

          {focused && (
            <p className="mt-3.5 flex flex-wrap items-center gap-2 text-2xs text-ink/60">
              Đang xem riêng <b className="text-ink/80">{focused.label}</b>
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="cursor-pointer font-bold text-brand underline underline-offset-2"
              >
                xem cả bốn tiêu chí
              </button>
            </p>
          )}

          {tab === "scores" && (
            <ul className="mt-3.5 grid gap-3">
              {shownCriteria.map((c) => {
                const s = graded.criteria.find((x) => x.id === c.id);
                if (!s) return null;
                const index = Math.min(
                  c.levels.length - 1,
                  Math.max(0, Math.round(s.band) - BAND_MIN),
                );
                return (
                  <li key={c.id} className="rounded-xl bg-mist-3 px-4 py-3">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <b className="text-sm font-bold">{c.label}</b>
                      <em className="text-2xs not-italic text-ink/50">
                        {c.english}
                      </em>
                      <span className="ml-auto font-mono text-base font-extrabold text-brand">
                        {s.band.toFixed(1)}
                      </span>
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                      {c.levels[index]}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === "issues" &&
            (issues === null || issues === undefined ? (
              <p className="mt-3.5 rounded-xl border border-dashed border-sage-3 bg-mist-3 px-4 py-5 text-sm leading-relaxed text-ink/65">
                Chưa liệt kê được lỗi. Mục này phải TRÍCH đúng câu sai trong bài
                và viết câu sửa, tức là sinh văn bản — model đang dùng chỉ chấm
                được điểm theo thang, không viết được chữ nào. Số 0 trên tab là
                "chưa soi", không phải "bài không có lỗi".
              </p>
            ) : shownIssues.length === 0 ? (
              <p className="mt-3.5 rounded-xl bg-sage-2 px-4 py-5 text-sm leading-relaxed">
                {focused
                  ? `Đã soi và không thấy lỗi nào thuộc ${focused.label}. Các tiêu chí khác có thể vẫn còn — bấm "xem cả bốn tiêu chí" để xem hết.`
                  : "Đã soi và không thấy lỗi nào đáng chỉ ra. Không có nghĩa là bài hoàn hảo — bốn tiêu chí ở trên vẫn là thước đo chính."}
              </p>
            ) : (
              <ul className="mt-3.5 grid gap-3">
                {shownIssues.map((issue, i) => (
                  <li key={i} className="rounded-xl bg-mist-3 px-4 py-3">
                    <p className="flex items-baseline gap-2">
                      <b className="rounded bg-warn-soft px-1.5 py-0.5 font-mono text-2xs font-extrabold text-warn">
                        {issue.criterion}
                      </b>
                      <span className="text-sm leading-relaxed text-ink/70">
                        {issue.why}
                      </span>
                    </p>
                    <p className="mt-2 border-l-2 border-warn pl-3 text-sm italic leading-relaxed text-ink/70">
                      {issue.quote}
                    </p>
                    {issue.fix && (
                      <p className="mt-1.5 border-l-2 border-brand pl-3 text-sm font-semibold leading-relaxed">
                        {issue.fix}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ))}

          {tab === "essay" && (
            <div className="mt-3.5 rounded-xl bg-mist-3 px-4 py-4 text-sm leading-[1.75]">
              <p className="mb-3 text-2xs font-bold text-ink/55">
                {graded.words} từ ·{" "}
                {graded.meetsWordCount
                  ? "đủ số chữ tối thiểu"
                  : `thiếu ${minWords - graded.words} từ so với mức tối thiểu`}
              </p>
              {essay.split(/\n+/).map((para, i) => (
                <p key={i} className="mt-3 first:mt-0">
                  {para}
                </p>
              ))}
            </div>
          )}

          {tab === "advice" && (
            <ul className="mt-3.5 grid gap-3">
              {WRITING_CRITERIA.map((c) => {
                const s = graded.criteria.find((x) => x.id === c.id);
                if (!s) return null;
                return (
                  <li key={c.id} className="rounded-xl bg-mist-3 px-4 py-3">
                    <b className="text-sm font-bold">{c.label}</b>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                      {adviceFor(c.id, s.band)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-4 text-2xs leading-relaxed text-ink/55">
            {footnote}
          </p>
        </>
      )}
    </section>
  );
}
