"use client";

import { useState } from "react";

import { SPEAKING_CRITERIA, adviceFor, levelText } from "../domain/criteria";
import { formatClock } from "../domain/timing";
import type { SpeakingResult, SpeakingState } from "../domain/types";

/*
  Bảng điểm Speaking. Cùng bố cục với bảng Writing của bài kiểm tra nền để học
  sinh quen mắt: một hàng bốn thẻ, rồi ba tab.

  Bốn trạng thái vào cùng một chỗ, và mỗi trạng thái nói đúng nó là gì:
  "chưa nối bộ chấm" khác "đang chấm", khác "đã chấm". Gộp lại là học sinh
  tưởng máy hỏng hoặc tưởng mình bị chấm 0.
*/

const BAND_MIN = 4;
const BAND_MAX = 9;
const percentOf = (band: number) =>
  Math.round(((band - BAND_MIN) / (BAND_MAX - BAND_MIN)) * 100);

function Transcript({ result }: { result: SpeakingResult }) {
  const { transcript, marks } = result;
  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((m, i) => {
    if (m.start > cursor) pieces.push(transcript.slice(cursor, m.start));
    const text = transcript.slice(m.start, m.end);
    pieces.push(
      m.kind === "error" ? (
        <mark
          key={i}
          title={m.fix ? `Sửa: ${m.fix}` : undefined}
          className="rounded-sm bg-warn-soft px-0.5 text-warn underline decoration-warn decoration-2 underline-offset-2"
        >
          {text}
        </mark>
      ) : (
        <mark key={i} className="rounded-sm bg-sage-2 px-0.5 text-brand">
          {text}
        </mark>
      ),
    );
    cursor = m.end;
  });
  if (cursor < transcript.length) pieces.push(transcript.slice(cursor));
  return <p className="text-sm leading-[1.8] text-ink">{pieces}</p>;
}

export default function SpeakingReport({
  state,
  audioUrl,
  onRetry,
  retrying,
}: {
  state: SpeakingState;
  audioUrl: string | null;
  onRetry: () => void;
  retrying: boolean;
}) {
  const [tab, setTab] = useState<"scores" | "transcript" | "advice">("scores");
  const graded = state.kind === "graded" ? state.result : null;

  return (
    <section className="rounded-2xl border border-sage-3 bg-white p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-extrabold text-brand">Kết quả bài nói</h3>
        {graded?.overall != null && (
          <p className="ml-auto flex items-baseline gap-2">
            <b className="font-mono text-3xl font-extrabold tracking-tight text-brand">
              {graded.overall.toFixed(1)}
            </b>
            <span className="max-w-[16ch] text-2xs leading-snug text-ink/60">
              band tham khảo cho một câu trả lời
            </span>
          </p>
        )}
      </header>

      {state.kind === "recorded" && (
        <p className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          Đã thu {formatClock(state.durationSeconds)}. Bấm <b>Nộp bài nói</b> để
          gửi chấm.
        </p>
      )}

      {state.kind === "grading" && (
        <p
          className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm"
          role="status"
        >
          Đang chấm bài nói…
        </p>
      )}

      {state.kind === "ungraded" && (
        <div className="mt-4 rounded-xl bg-mist-3 px-4 py-3 text-sm leading-relaxed">
          <p>
            <b>Chưa chấm được.</b> {state.reason} Bài nói của bạn vẫn còn ở đây
            — nghe lại được, và chấm lại lúc nào cũng được.
          </p>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="mt-3 rounded-xl border border-sage-3 bg-white px-4 py-2 text-sm font-bold text-brand disabled:opacity-60"
          >
            {retrying ? "Đang chấm…" : "Chấm lại bài nói"}
          </button>
        </div>
      )}

      {graded && (
        <>
          <ol className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {SPEAKING_CRITERIA.map((c) => {
              const s = graded.criteria.find((x) => x.id === c.id);
              /*
                Tiêu chí không chấm được (Phát âm, khi chỉ có bản ghi chữ) vẫn
                phải có ô riêng. Bỏ hẳn ô đi thì bảng còn ba thẻ và học sinh
                đọc như thể mình được chấm đủ — mà điền vào đó một con số đoán
                ra còn tệ hơn.
              */
              if (!s)
                return (
                  <li
                    key={c.id}
                    className="rounded-[13px] border border-dashed border-sage-3 bg-mist-3 p-3.5"
                  >
                    <p className="flex items-baseline justify-between gap-2">
                      <b className="font-mono text-2xs font-extrabold tracking-wider">
                        {c.id}
                      </b>
                      <span className="text-2xs font-bold text-ink/45">
                        chưa chấm
                      </span>
                    </p>
                    <span
                      className="my-2 block h-1.5 rounded-full bg-sage-2"
                      aria-hidden
                    />
                    <p className="text-2xs leading-snug text-ink/60">
                      {c.label} · {c.needsAudio ? "cần nghe" : "thiếu dữ liệu"}
                    </p>
                  </li>
                );
              const weak = s.band < 6;
              return (
                <li
                  key={c.id}
                  className="rounded-[13px] border border-sage-3 p-3.5"
                >
                  <p className="flex items-baseline justify-between gap-2">
                    <b className="font-mono text-2xs font-extrabold tracking-wider">
                      {c.id}
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
                    {s.confidence === null && c.id === "P" && (
                      <>
                        {" "}
                        · <span className="text-warn">cô chấm</span>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist">
            {(["scores", "transcript", "advice"] as const).map((t, i) => (
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
                {["Điểm chi tiết", "Bản ghi lời nói", "Gợi ý"][i]}
              </button>
            ))}
          </div>

          {tab === "scores" && (
            <ul className="mt-3.5 grid gap-3">
              {SPEAKING_CRITERIA.map((c) => {
                const s = graded.criteria.find((x) => x.id === c.id);
                if (!s) return null;
                return (
                  <li key={c.id} className="rounded-xl bg-mist-3 px-4 py-3">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <b className="text-sm font-bold">{c.label}</b>
                      <em className="text-2xs not-italic text-ink/65">
                        {c.english}
                      </em>
                      <span className="ml-auto font-mono text-base font-extrabold text-brand">
                        {s.band.toFixed(1)}
                      </span>
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                      {levelText(c.id, s.band)}
                    </p>
                    {graded.notes[c.id] && (
                      <p className="mt-1.5 text-sm leading-relaxed text-ink">
                        {graded.notes[c.id]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {tab === "transcript" && (
            <div className="mt-3.5 rounded-xl bg-mist-3 px-4 py-4">
              {audioUrl && (
                <audio
                  controls
                  src={audioUrl}
                  className="mb-3 w-full"
                  preload="metadata"
                />
              )}
              <p className="mb-2 text-2xs font-extrabold uppercase tracking-wider text-ink/65">
                Máy nhận dạng, có thể sai vài từ ·{" "}
                {formatClock(graded.durationSeconds)}
              </p>
              <Transcript result={graded} />
              <p className="mt-3 flex flex-wrap gap-4 text-2xs text-ink/60">
                <span>
                  <i className="mr-1 inline-block h-2.5 w-2.5 bg-warn-soft align-[-1px] border-b-2 border-warn" />{" "}
                  lỗi / từ đệm — rê chuột để xem cách sửa
                </span>
                <span>
                  <i className="mr-1 inline-block h-2.5 w-2.5 bg-sage-2 align-[-1px]" />{" "}
                  cụm ăn điểm
                </span>
              </p>
            </div>
          )}

          {tab === "advice" && (
            <ul className="mt-3.5 grid gap-3">
              {SPEAKING_CRITERIA.map((c) => {
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

          <p className="mt-4 text-2xs leading-relaxed text-ink/65">
            Band trên đây chỉ tính riêng một câu trả lời, không phải band
            Speaking thi thật — một bài thi thật gồm ba part và mười mấy câu.
            {graded.overall == null && (
              <>
                {" "}
                Chưa có band tổng vì còn thiếu một tiêu chí: trung bình của ba
                tiêu chí không phải band bốn tiêu chí, nên thà để trống.
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}
