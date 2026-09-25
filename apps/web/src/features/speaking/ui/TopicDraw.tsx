"use client";

import { useState } from "react";

import { STUDY_SECONDS, formatClock } from "../domain/timing";
import type { Part, TopicPack } from "../domain/types";
import { useCountdown } from "../application/useCountdown";
import { topicProvider } from "../infrastructure";
import SpeechPad from "./SpeechPad";

/*
  Bốc chủ đề → đọc kiến thức nền + từ vựng trong 5/8/10 phút theo part → Q&A.

  Hết giờ đọc thì bảng kiến thức ẩn đi và câu hỏi hiện ra — lúc trả lời không
  nhìn được, giống thi thật. "Bắt đầu Q&A ngay" cho ai đã quen chủ đề.
*/
export default function TopicDraw() {
  const [part, setPart] = useState<Part>(2);
  const [pack, setPack] = useState<TopicPack | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [phase, setPhase] = useState<"pick" | "study" | "qa">("pick");
  const [busy, setBusy] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [message, setMessage] = useState("");

  const study = useCountdown(STUDY_SECONDS[part], () => setPhase("qa"));

  async function draw() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const next = await topicProvider.draw(part, seen);
    setBusy(false);
    /*
      Không có chủ đề nào cho part này thì phải NÓI RA. Trước đây hàm trả về
      sớm và màn hình đứng im — đo được ở Part 2 lúc ngân hàng còn thiếu gói:
      bấm nút không có gì xảy ra, người dùng không biết là hỏng hay chưa bấm.
    */
    if (!next) {
      setMessage(
        `Chưa có chủ đề nào cho Part ${part}. Chọn part khác, hoặc báo cô thêm chủ đề.`,
      );
      return;
    }
    setPack(next);
    setSeen((s) => [...s, next.topic]);
    setQIndex(0);
    setPhase("study");
    study.start();
  }

  function reset() {
    setPhase("pick");
    setPack(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs font-extrabold uppercase tracking-wider text-brand-soft">
          Bốc chủ đề ngẫu nhiên
        </span>
        <div
          className="ml-auto flex gap-1.5"
          role="group"
          aria-label="Chọn part"
        >
          {([1, 2, 3] as Part[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={part === p}
              disabled={phase !== "pick"}
              onClick={() => setPart(p)}
              className={`rounded-full border px-3.5 py-2 text-sm font-bold disabled:opacity-50 ${
                part === p
                  ? "border-brand bg-brand text-white"
                  : "border-sage-3 bg-white"
              }`}
            >
              Part {p} · {STUDY_SECONDS[p] / 60} phút
            </button>
          ))}
        </div>
      </div>

      {phase === "pick" && (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-sage-3 bg-white px-6 py-14 text-center">
          <h1 className="text-2xl font-extrabold text-brand">
            Bốc một chủ đề cho Part {part}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-ink/65">
            Bạn có {STUDY_SECONDS[part] / 60} phút đọc kiến thức nền và từ vựng.
            Hết giờ, bảng ẩn đi và câu hỏi hiện ra — lúc trả lời không nhìn được
            gì, giống thi thật.
          </p>
          <button
            type="button"
            onClick={draw}
            disabled={busy}
            className="rounded-xl bg-brand px-6 py-3.5 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Đang bốc…" : "Bốc chủ đề"}
          </button>
          {message && (
            <p
              role="alert"
              className="max-w-md text-sm font-semibold text-warn"
            >
              {message}
            </p>
          )}
        </section>
      )}

      {pack && phase === "study" && (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-brand-deep px-6 py-5 text-white">
            <div className="flex-1 min-w-[200px]">
              <p className="mb-1 text-2xs font-extrabold uppercase tracking-wider text-leaf-dark">
                Chủ đề bốc được
              </p>
              <h1 className="text-2xl font-extrabold">{pack.topic}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xs font-bold uppercase tracking-wider text-white/70">
                Thời gian đọc
              </p>
              <span className="font-mono text-3xl font-extrabold tracking-tight">
                {formatClock(study.remaining)}
              </span>
            </div>
            <button
              type="button"
              onClick={study.skip}
              className="rounded-xl bg-leaf-dark px-5 py-3.5 text-sm font-extrabold text-brand-deep"
            >
              Bắt đầu Q&amp;A ngay
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <section className="flex flex-col gap-3 rounded-2xl border border-sage-3 bg-white p-5">
              <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/65">
                Kiến thức nền · đọc trong lúc chờ
              </p>
              <h2 className="text-base font-extrabold">{pack.headline}</h2>
              <p className="text-sm leading-relaxed">{pack.background}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {pack.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
            <section className="flex flex-col gap-2.5 rounded-2xl bg-mist-3 p-5">
              <p className="text-2xs font-extrabold uppercase tracking-wider text-brand-soft">
                Từ vựng · {pack.vocab.length} từ, đủ dùng cho một câu trả lời
              </p>
              <ul className="flex flex-col gap-2">
                {pack.vocab.map((v) => (
                  <li
                    key={v.word}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 rounded-lg bg-white px-3 py-2"
                  >
                    <span>
                      <b className="text-sm">{v.word}</b>{" "}
                      {v.ipa && (
                        <span className="text-2xs text-ink/65">{v.ipa}</span>
                      )}
                    </span>
                    <span className="text-2xs text-ink/60">{v.meaning}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-2xs leading-relaxed text-ink/60">
                Hết giờ đọc thì bảng này ẩn đi. Lúc trả lời không nhìn được —
                giống thi thật.
              </p>
            </section>
          </div>
        </>
      )}

      {pack && phase === "qa" && (
        <section className="flex flex-col gap-4 rounded-2xl border border-sage-3 bg-white p-6">
          <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/65">
            Q&amp;A · {pack.topic} · câu {qIndex + 1} / {pack.questions.length}
          </p>
          <h1 className="text-2xl font-extrabold leading-snug text-brand">
            {pack.questions[qIndex]}
          </h1>
          <p className="text-sm text-ink/65">
            Trả lời thành tiếng, 30–60 giây. Bảng kiến thức đã ẩn — nói bằng
            những gì còn nhớ.
          </p>

          {/*
            `key` theo chủ đề + số câu: sang câu mới thì ô chữ, đồng hồ và
            bảng điểm phải sạch. Không có `key` thì React giữ nguyên component
            và học sinh đọc bản ghi của câu trước dưới câu mới.
          */}
          <SpeechPad
            key={`${pack.topic}-${qIndex}`}
            questionId={`draw-${pack.topic}-${qIndex}`}
            prompt={pack.questions[qIndex]}
            part={pack.part}
          />

          <div className="flex flex-wrap gap-2.5">
            {qIndex < pack.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setQIndex((i) => i + 1)}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
              >
                Câu tiếp
              </button>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
              >
                Bốc chủ đề khác
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-sage-3 bg-white px-5 py-3 text-sm font-bold"
            >
              Dừng
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
