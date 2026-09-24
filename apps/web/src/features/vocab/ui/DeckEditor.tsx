"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";

import type { Card, Deck } from "../domain/types";
import WordAudio from "./WordAudio";

/*
  Sửa thẻ trong một bộ. Port từ `DeckManagement.tsx` của repo gốc.

  Bản gốc cho gõ tay từng ô (từ / phiên âm / nghĩa / ví dụ) — giữ nguyên, vì đó
  là đường luôn dùng được. Thêm ô "dán nhiều từ" nối vào bộ sinh tự động, đúng
  mục trong sheet: học sinh chỉ nhập từ, máy điền các cột còn lại.

  Bộ sinh HÔM NAY CHƯA NỐI (xem `application/ports.ts`), nên nút ấy nói thẳng
  là chưa có thay vì im lặng — và ô gõ tay vẫn ở đó để không ai bị chặn.
*/
export default function DeckEditor({
  deck,
  onClose,
}: {
  deck: Deck;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [word, setWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [vietnamese, setVietnamese] = useState("");
  const [examples, setExamples] = useState("");
  const [bulk, setBulk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/vocab/cards?deck=${encodeURIComponent(deck.id)}`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (res.ok) setCards(data.cards as Card[]);
    } finally {
      setLoading(false);
    }
  }, [deck.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCard() {
    if (!word.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vocab/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId: deck.id,
          word,
          ipa,
          vietnamese,
          examples: examples
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không thêm được thẻ.");
      setCards((list) => [...list, data.card as Card]);
      setWord("");
      setIpa("");
      setVietnamese("");
      setExamples("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được thẻ.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(cardId: string) {
    await fetch(
      `/api/vocab/cards?card=${encodeURIComponent(cardId)}&deck=${encodeURIComponent(deck.id)}`,
      { method: "DELETE" },
    );
    setCards((list) => list.filter((c) => c.id !== cardId));
  }

  async function generate() {
    const words = bulk
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!words.length || busy) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const res = await fetch("/api/vocab/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không sinh được thẻ.");
      if (!data.available) {
        setNotice(
          `Bộ sinh tự động chưa nối, nên ${words.length} từ này chưa được điền phiên âm và nghĩa. Bạn gõ tay ở khung bên trái, hoặc chờ cô nối model sinh văn bản.`,
        );
        return;
      }
      await load();
      setBulk("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không sinh được thẻ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full border border-sage-3 bg-white px-4 py-2 text-sm font-semibold"
        >
          <ArrowLeft size={15} /> Về trang từ vựng
        </button>
        <h1 className="text-xl font-extrabold text-brand">{deck.name}</h1>
        <span className="ml-auto text-2xs font-semibold text-ink/55">
          {cards.length} thẻ
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="flex flex-col gap-3 rounded-2xl border border-sage-3 bg-white p-5">
          <h2 className="text-sm font-extrabold">Thêm một thẻ</h2>
          <label className="text-2xs font-bold text-ink/60" htmlFor="c-word">
            Từ
          </label>
          <input
            id="c-word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="rounded-lg border border-sage-3 px-3 py-2.5 text-sm"
            placeholder="curriculum"
          />
          <label className="text-2xs font-bold text-ink/60" htmlFor="c-ipa">
            Phiên âm
          </label>
          <input
            id="c-ipa"
            value={ipa}
            onChange={(e) => setIpa(e.target.value)}
            className="rounded-lg border border-sage-3 px-3 py-2.5 font-mono text-sm"
            placeholder="/kəˈrɪkjələm/"
          />
          <label className="text-2xs font-bold text-ink/60" htmlFor="c-vi">
            Nghĩa tiếng Việt
          </label>
          <input
            id="c-vi"
            value={vietnamese}
            onChange={(e) => setVietnamese(e.target.value)}
            className="rounded-lg border border-sage-3 px-3 py-2.5 text-sm"
            placeholder="chương trình học"
          />
          <label className="text-2xs font-bold text-ink/60" htmlFor="c-ex">
            Câu ví dụ — mỗi dòng một câu
          </label>
          <textarea
            id="c-ex"
            value={examples}
            onChange={(e) => setExamples(e.target.value)}
            rows={4}
            className="resize-none rounded-lg border border-sage-3 px-3 py-2.5 text-sm leading-relaxed"
            placeholder={
              "The new curriculum puts more weight on critical thinking."
            }
          />
          <button
            type="button"
            onClick={addCard}
            disabled={busy || !word.trim()}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          >
            Thêm thẻ
          </button>

          <div className="mt-2 border-t border-sage pt-4">
            <label className="text-2xs font-bold text-ink/60" htmlFor="c-bulk">
              Hoặc dán nhiều từ — mỗi dòng một từ
            </label>
            <textarea
              id="c-bulk"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-sage-3 px-3 py-2.5 font-mono text-sm leading-relaxed"
              placeholder={"deteriorate\nscrutiny\nunprecedented"}
            />
            <button
              type="button"
              onClick={generate}
              disabled={busy || !bulk.trim()}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand/30 px-4 py-3 text-sm font-bold text-brand disabled:opacity-50"
            >
              <Sparkles size={15} /> Sinh phiên âm, nghĩa và ví dụ
            </button>
          </div>

          {error && <p className="text-sm font-semibold text-warn">{error}</p>}
          {notice && (
            <p className="rounded-xl bg-warn-soft px-3.5 py-3 text-2xs leading-relaxed text-warn">
              {notice}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          {loading ? (
            <p className="rounded-2xl border border-sage-3 bg-mist-3 px-5 py-8 text-center text-sm text-ink/55">
              Đang tải thẻ…
            </p>
          ) : cards.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sage-3 bg-mist-3 px-5 py-8 text-center text-sm leading-relaxed text-ink/60">
              Bộ này chưa có thẻ nào. Thêm từ đầu tiên ở khung bên trái.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="flex gap-3 rounded-2xl border border-sage-3 bg-white p-4"
                >
                  <WordAudio word={card.word} audioUrl={card.audioUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2">
                      <b className="text-[15px]">{card.word}</b>
                      {card.ipa && (
                        <span className="font-mono text-2xs text-ink/50">
                          {card.ipa}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-ink/75">
                      {card.vietnamese || "— chưa có nghĩa —"}
                    </p>
                    {card.examples.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {card.examples.map((e, i) => (
                          <li
                            key={i}
                            className="border-l-2 border-sage-3 pl-3 text-2xs italic leading-relaxed text-ink/60"
                          >
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(card.id)}
                    aria-label={`Xoá thẻ ${card.word}`}
                    className="h-fit rounded-lg border border-sage-3 p-2 text-ink/40 hover:border-warn/40 hover:text-warn"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
