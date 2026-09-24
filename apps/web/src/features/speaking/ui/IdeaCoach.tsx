"use client";

import { useState } from "react";

import type { IdeaFeedback, IdeaSeed, SpeakingQuestion } from "../domain/types";
import { ideaCoach } from "../infrastructure";

/*
  Luyện phát triển ý cho Part 3. Ba vòng: mỗi vòng học sinh gõ ý thô, máy nói
  lại cho tròn câu và hỏi thêm một câu; tới vòng 3 là một câu trả lời hoàn
  chỉnh 4–5 câu.

  Cố ý KHÔNG đưa sẵn câu trả lời. Nút "Không biết nói gì" mở ba HƯỚNG ý, học
  sinh chọn một rồi tự viết — nếu máy viết hộ thì học sinh học được cách đọc,
  không học được cách nói.
*/
export default function IdeaCoach({
  questions,
}: {
  questions: SpeakingQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [idea, setIdea] = useState("");
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<IdeaFeedback | null>(null);
  const [seeds, setSeeds] = useState<IdeaSeed[] | null>(null);
  const [busy, setBusy] = useState(false);

  const question = questions[index];
  if (!question) return null;

  async function send() {
    if (!idea.trim() || busy) return;
    setBusy(true);
    const fb = await ideaCoach.reshape(question.id, idea, round);
    setFeedback(fb);
    setSeeds(null);
    setRound((r) => Math.min(3, r + 1));
    setBusy(false);
  }

  async function askSeeds() {
    if (busy) return;
    setBusy(true);
    setSeeds(await ideaCoach.seeds(question.id));
    setBusy(false);
  }

  function nextQuestion() {
    setIndex((i) => (i + 1) % questions.length);
    setIdea("");
    setRound(1);
    setFeedback(null);
    setSeeds(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-sage-3 bg-white px-6 py-5">
        <p className="mb-1.5 flex items-center gap-3 text-2xs font-extrabold uppercase tracking-wider text-ink/55">
          Câu hỏi · Part {question.part} · {question.topic}
          <button
            type="button"
            onClick={nextQuestion}
            className="ml-auto rounded-full border border-sage-3 px-3 py-1 text-2xs font-bold normal-case tracking-normal text-brand"
          >
            Câu khác
          </button>
        </p>
        <h1 className="text-xl font-extrabold leading-snug text-brand md:text-2xl">
          {question.prompt}
        </h1>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <label htmlFor="idea" className="text-sm font-bold">
            Ý đầu tiên xuất hiện trong đầu bạn — gõ thô, đừng sửa
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[160px] flex-1 resize-none rounded-2xl border border-sage-3 bg-white px-4 py-3.5 text-[15px] leading-relaxed"
            placeholder="I think… because…"
          />
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={send}
              disabled={busy || !idea.trim()}
              className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy
                ? "Đang đọc…"
                : round === 1
                  ? "Gửi ý này"
                  : `Gửi vòng ${round}`}
            </button>
            <button
              type="button"
              onClick={askSeeds}
              disabled={busy}
              className="rounded-xl border border-sage-3 bg-white px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              Không biết nói gì
            </button>
          </div>
          <p className="text-2xs leading-relaxed text-ink/60">
            "Không biết nói gì" mở ra ba hướng ý chính để bạn chọn một rồi tự
            phát triển — không đưa sẵn câu trả lời.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-mist-3 p-5">
          <p className="text-2xs font-extrabold uppercase tracking-wider text-brand-soft">
            Máy đọc ý của bạn
          </p>

          {seeds && (
            <ul className="grid gap-2">
              {seeds.map((s) => (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => {
                      setIdea((v) =>
                        v.trim()
                          ? v
                          : `${s.title.split("·")[1]?.trim() ?? s.title}: `,
                      );
                      setSeeds(null);
                    }}
                    className="w-full rounded-xl bg-white px-4 py-3 text-left"
                  >
                    <b className="block text-sm">{s.title}</b>
                    <span className="text-sm text-ink/65">{s.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!seeds && !feedback && (
            <p className="text-sm leading-relaxed text-ink/60">
              Gửi ý đầu tiên đi. Máy sẽ nói lại cho tròn câu, rồi hỏi bạn thêm
              một câu để ý dày hơn.
            </p>
          )}

          {!seeds && feedback && (
            <>
              <div className="rounded-xl bg-white px-4 py-3.5">
                <p className="mb-1.5 text-2xs font-bold text-ink/55">
                  Ý của bạn, nói lại cho tròn câu
                </p>
                <p className="text-sm leading-relaxed">{feedback.reshaped}</p>
              </div>
              {feedback.probe && (
                <div className="rounded-xl border-l-[3px] border-warn bg-white px-4 py-3.5">
                  <p className="mb-1.5 text-2xs font-bold text-warn">
                    Ý còn mỏng — trả lời thêm câu này rồi nói tiếp
                  </p>
                  <p className="text-sm leading-relaxed">{feedback.probe}</p>
                </div>
              )}
              {feedback.vocab.length > 0 && (
                <div>
                  <p className="mb-2 text-2xs font-bold text-ink/55">
                    Từ có thể dùng
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {feedback.vocab.map((w) => (
                      <span
                        key={w}
                        className="rounded-full border border-sage-3 bg-white px-2.5 py-1 text-2xs font-semibold"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <p className="mt-auto text-2xs leading-relaxed text-ink/60">
            Vòng {Math.min(round, 3)} / 3. Mỗi vòng bạn nói dài hơn một chút;
            đến vòng 3 là một câu trả lời Part 3 hoàn chỉnh 4–5 câu.
          </p>
        </section>
      </div>
    </div>
  );
}
