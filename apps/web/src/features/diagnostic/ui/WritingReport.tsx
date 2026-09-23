"use client";

import { useState } from "react";
import {
  WRITING_CRITERIA,
  WRITING_TASK,
  adviceFor,
  type WritingState,
} from "@thuong-ielts/diagnostic";

/**
 * Bảng điểm phần Writing.
 *
 * Bố cục theo bản mẫu cô gửi: một hàng bốn thẻ TR / CC / LR / GRA, mỗi thẻ một
 * band và một thanh tỉ lệ, rồi ba tab Điểm số / Bài làm / Gợi ý.
 *
 * ## Cố ý KHÔNG có mục "Lỗi chi tiết"
 *
 * Bản mẫu có một danh sách lỗi kèm vị trí trong bài. Bộ chấm ở đây (TypeSafe,
 * dạng câu hỏi `score`) chỉ trả về một con số cho mỗi tiêu chí, không trả về
 * văn bản tự do — dựng một danh sách lỗi từ đó là bịa. Thà thiếu một mục còn
 * hơn chỉ cho học sinh sửa một lỗi không ai tìm ra.
 *
 * ## Vì sao nhắc "bài 15 phút" ở ngay cạnh điểm tổng
 *
 * Con số band đứng một mình sẽ bị đọc thành band Writing thi thật. Bài này chỉ
 * có 15 phút và mức tối thiểu 150 từ thay vì 250, nên nó là một phép đo nháp.
 * Nói ra ngay cạnh con số, chứ không giấu trong chú thích cuối trang.
 */

const BAND_MIN = 4;
const BAND_MAX = 9;

/** Vị trí của band trên thanh tỉ lệ, theo khoảng 4–9 mà thang chấm mô tả. */
const percentOf = (band: number) =>
  Math.round(((band - BAND_MIN) / (BAND_MAX - BAND_MIN)) * 100);

export default function WritingReport({
  state,
  essay,
  onRetry,
  retrying,
}: {
  /** `null` = chưa hỏi bộ chấm lần nào. */
  state: WritingState | null;
  essay: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  const [tab, setTab] = useState<"scores" | "essay" | "advice">("scores");

  const graded = state?.kind === "graded" ? state.result : null;

  return (
    <section className="diag-wr">
      <header className="diag-wr-head">
        <h3>Kết quả chấm bài viết</h3>
        <span className="diag-wr-kind">{WRITING_TASK.type}</span>
        {graded?.overall != null && (
          <p className="diag-wr-overall">
            <b>{graded.overall.toFixed(1)}</b>
            <span>
              band tham khảo cho bài {Math.round(WRITING_TASK.seconds / 60)}{" "}
              phút
            </span>
          </p>
        )}
      </header>

      {state === null && (
        <p className="diag-wr-note" role="status">
          Đang chấm bài viết…
        </p>
      )}

      {state?.kind === "empty" && (
        <p className="diag-wr-note">
          Bạn chưa viết gì ở phần 4, nên không có gì để chấm. Ba phần còn lại
          vẫn được chấm đầy đủ.
        </p>
      )}

      {state?.kind === "too-short" && (
        <p className="diag-wr-note">
          Bài chỉ có {state.words} từ — quá ngắn để chấm theo bốn tiêu chí. Một
          nhận xét dựa trên vài câu thì không nói được gì về thực lực, nên phần
          này để trống thay vì cho một con số không có cơ sở.
        </p>
      )}

      {state?.kind === "ungraded" && (
        <div className="diag-wr-note">
          <p>
            Chưa chấm được bài viết: {state.reason} Bài của bạn đã được lưu
            nguyên vẹn, chấm lại lúc nào cũng được.
          </p>
          <button
            className="diag-secondary mt-3"
            onClick={onRetry}
            disabled={retrying}
          >
            {retrying ? "Đang chấm…" : "Chấm lại bài viết"}
          </button>
        </div>
      )}

      {graded && (
        <>
          <ol className="diag-wr-cards">
            {WRITING_CRITERIA.map((criterion) => {
              const score = graded.criteria.find((c) => c.id === criterion.id);
              if (!score) return null;
              return (
                <li key={criterion.id}>
                  <p className="diag-wr-card-top">
                    <b>{criterion.short}</b>
                    <span>{score.band.toFixed(1)}</span>
                  </p>
                  <span className="diag-wr-bar" aria-hidden>
                    <i style={{ width: `${percentOf(score.band)}%` }} />
                  </span>
                  <p className="diag-wr-card-name">{criterion.label}</p>
                </li>
              );
            })}
          </ol>

          <div className="diag-wr-tabs" role="tablist">
            {(["scores", "essay", "advice"] as const).map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`diag-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {["Điểm chi tiết", "Bài làm", "Gợi ý"][i]}
              </button>
            ))}
          </div>

          {tab === "scores" && (
            <ul className="diag-wr-detail">
              {WRITING_CRITERIA.map((criterion) => {
                const score = graded.criteria.find(
                  (c) => c.id === criterion.id,
                );
                if (!score) return null;
                return (
                  <li key={criterion.id}>
                    <p className="diag-wr-detail-head">
                      <b>{criterion.label}</b>
                      <em>{criterion.english}</em>
                      <span>{score.band.toFixed(1)}</span>
                    </p>
                    <p className="diag-wr-detail-level">
                      {criterion.levels[
                        Math.min(
                          criterion.levels.length - 1,
                          Math.max(0, score.band - BAND_MIN),
                        )
                      ] ?? ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === "essay" && (
            <div className="diag-wr-essay">
              <p className="diag-wr-words">
                {graded.words} từ ·{" "}
                {graded.meetsWordCount
                  ? "đủ số chữ tối thiểu"
                  : `thiếu ${WRITING_TASK.minWords - graded.words} từ so với mức tối thiểu`}
              </p>
              {essay.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {tab === "advice" && (
            <ul className="diag-wr-advice">
              {WRITING_CRITERIA.map((criterion) => {
                const score = graded.criteria.find(
                  (c) => c.id === criterion.id,
                );
                if (!score) return null;
                return (
                  <li key={criterion.id}>
                    <b>{criterion.label}</b>
                    <p>{adviceFor(criterion.id, score.band)}</p>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="diag-wr-foot">
            Band trên đây chỉ tính riêng bài viết 15 phút này, không phải band
            Writing thi thật và không cộng vào một điểm Overall — bài kiểm tra
            nền không đo Speaking nên chưa đủ bốn kỹ năng để quy đổi.
          </p>
        </>
      )}
    </section>
  );
}
