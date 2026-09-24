"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Frown,
  HelpCircle,
  RotateCcw,
  Smile,
  Sparkles,
  ThumbsUp,
  X,
} from "lucide-react";

import type { DueCard, Rating } from "../domain/types";
import WordAudio from "./WordAudio";

/*
  Màn ôn thẻ. Port từ `StudySession.tsx` của repo gốc — giữ nguyên cách chạy:

  - Mặt trước hiện TỪ + phiên âm + câu ví dụ; nghĩa tiếng Việt giấu đi. Học
    sinh phải tự nhớ rồi mới lật (active recall). Đảo ngược thứ tự này là biến
    nó thành đọc hiểu, không còn là nhớ lại.
  - Xáo bài mỗi lượt, như Anki.
  - Chấm "Quên" thì thẻ KHÔNG biến mất mà xuống cuối chồng, quay lại trong
    chính buổi hôm nay cho tới khi nhớ.
  - Bốn nút ghi thẳng "hỏi lại sau bao lâu" thay vì Again/Good — học sinh Việt
    đọc ra là hiểu, không phải học thêm một bộ từ của Anki.
*/

type Props = {
  deckId?: string;
  onClose: () => void;
  onDone: () => void;
};

const RATINGS: {
  value: Rating;
  label: string;
  when: string;
  Icon: typeof Frown;
  tone: string;
}[] = [
  {
    value: "again",
    label: "Quên",
    when: "hỏi lại hôm nay",
    Icon: Frown,
    tone: "border-warn/40 text-warn hover:bg-warn-soft",
  },
  {
    value: "hard",
    label: "Khó",
    when: "hỏi lại ngày mai",
    Icon: HelpCircle,
    tone: "border-sage-3 text-ink hover:bg-mist-3",
  },
  {
    value: "good",
    label: "Nhớ",
    when: "sau 3 ngày",
    Icon: ThumbsUp,
    tone: "border-brand bg-brand text-white hover:bg-brand-deep",
  },
  {
    value: "easy",
    label: "Dễ",
    when: "sau 7 ngày",
    Icon: Smile,
    tone: "border-brand-soft/40 text-brand-soft hover:bg-sage-2",
  },
];

/** Tô đậm chính từ đang học trong câu ví dụ, kể cả khi nó biến thể đuôi. */
function highlight(sentence: string, word: string) {
  const stem = word.replace(/(ing|ed|s|es)$/i, "");
  const safe = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = sentence.split(new RegExp(`(${safe}\\w*)`, "gi"));
  return parts.map((part, i) =>
    new RegExp(`^${safe}\\w*$`, "i").test(part) ? (
      <b key={i} className="font-bold text-brand not-italic">
        {part}
      </b>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function StudySession({ deckId, onClose, onDone }: Props) {
  const [stack, setStack] = useState<DueCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  /*
    Đang ghi một lượt chấm thì KHÓA bốn nút lại.

    Không có chốt này thì bấm nhanh bốn cái là bốn lượt chấm cho CÙNG một thẻ:
    mỗi lần gọi đọc `index` cũ nên vẫn trỏ vào thẻ đang hiện. Đo được: bấm
    "Nhớ" bốn lần liên tiếp -> bốn dòng nhật ký cho cùng một từ, khoảng cách
    phồng 3 -> 8 -> 20 -> 50 ngày. Một cú double-click vô tình đủ để hỏng lịch
    ôn cả tháng rưỡi.

    Chốt phải là REF, không phải state. Đã thử bằng state và đo lại vẫn ra bốn
    dòng: bốn cú bấm nằm trong cùng một nhịp, cả bốn đọc `saving` cũ là false
    trước khi React kịp vẽ lại, và `disabled` cũng chỉ có hiệu lực sau lần vẽ
    ấy. Ref đổi ngay tại chỗ nên cú bấm thứ hai thấy liền.
  */
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/vocab/due${deckId ? `?deck=${encodeURIComponent(deckId)}` : ""}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chưa tải được thẻ.");
      /* Xáo bài, như Anki: học thuộc thứ tự thì không phải học thuộc từ. */
      const shuffled = [...(data.cards as DueCard[])].sort(
        () => Math.random() - 0.5,
      );
      setStack(shuffled);
      setIndex(0);
      setFlipped(false);
      setFinished(shuffled.length === 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa tải được thẻ.");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function rate(rating: Rating) {
    const item = stack[index];
    if (!item || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    /*
      CHỜ ghi xong mới sang thẻ sau, đúng như bản gốc.

      Bắn đi rồi đi tiếp thì nhanh hơn thật, nhưng thẻ CUỐI cùng sẽ mất: chấm
      xong là màn "hết thẻ" hiện ra, học sinh đóng tab, request chưa kịp bay
      đi. Một lượt mất là lịch của thẻ đó sai cả tuần sau.
    */
    try {
      await fetch("/api/vocab/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: item.card.id, rating }),
      });
    } catch {
      /* Mất mạng thì buổi học vẫn chạy tiếp; lượt này không được ghi. */
    } finally {
      savingRef.current = false;
      setSaving(false);
    }

    if (rating === "again") {
      /* Xuống cuối chồng, gặp lại trong chính buổi hôm nay. */
      const next = [...stack];
      next.splice(index, 1);
      next.push(item);
      setStack(next);
      setFlipped(false);
      if (index >= next.length) {
        setFinished(true);
        onDone();
      }
      return;
    }

    if (index < stack.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setFinished(true);
      onDone();
    }
  }

  /* Phím tắt như Anki: Space lật, 1–4 chấm mức nhớ. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (loading || finished || !stack.length) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space" && !flipped) {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      if (!flipped) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        e.preventDefault();
        /* Giữ phím 1 thì trình duyệt bắn keydown liên tục — cùng cái bẫy. */
        if (e.repeat || savingRef.current) return;
        void rate(RATINGS[n - 1].value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-sage-3 bg-mist-3">
        <p className="text-sm font-medium text-ink/65">Đang xếp bài…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-sage-3 bg-white p-8 text-center">
        <p className="text-sm text-ink/70">{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-sage-3 bg-white p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-2 text-brand">
          <Sparkles size={30} />
        </span>
        <h2 className="text-2xl font-extrabold text-brand">
          Hết thẻ đến hạn rồi
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-ink/65">
          Hôm nay bạn đã ôn xong. Lịch giãn cách sẽ hẹn những thẻ này quay lại
          đúng lúc bạn sắp quên — không sớm hơn, vì ôn khi còn nhớ rõ thì chẳng
          thêm được gì.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-sage-3 bg-white px-5 py-3 text-sm font-bold"
          >
            <RotateCcw size={15} /> Tải lại
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
          >
            Về trang từ vựng
          </button>
        </div>
      </div>
    );
  }

  const item = stack[index];
  const { card, deck } = item;
  const percent = ((index + (flipped ? 0.5 : 0)) / stack.length) * 100;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {deck.topic && (
          <span className="rounded-md bg-mist px-2 py-0.5 text-2xs font-bold text-brand">
            {deck.topic}
          </span>
        )}
        <span className="max-w-[240px] truncate text-2xs font-semibold text-ink/65">
          {deck.name}
        </span>
        <span className="ml-auto font-mono text-2xs font-bold text-ink/65">
          {index + 1} / {stack.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dừng buổi ôn"
          className="rounded-lg border border-sage-3 p-1.5 text-ink/65 hover:text-brand"
        >
          <X size={15} />
        </button>
      </div>

      <span
        className="h-1.5 overflow-hidden rounded-full bg-sage-2"
        aria-hidden
      >
        <i
          className="block h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </span>

      <div className="flex min-h-[380px] flex-col justify-between gap-6 rounded-[28px] border border-sage-3 bg-white p-6 md:p-9">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-2xs font-extrabold uppercase tracking-[0.14em] text-ink/65">
                Nhớ lại nghĩa trước khi lật
              </span>
              <h1 className="mt-2 break-words text-4xl font-semibold tracking-tight text-brand md:text-5xl">
                {card.word}
              </h1>
              {card.ipa && (
                <p className="mt-1 font-mono text-base text-ink/65">
                  {card.ipa}
                </p>
              )}
            </div>
            <WordAudio word={card.word} audioUrl={card.audioUrl} />
          </div>

          {card.examples.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-sage pt-5">
              <h4 className="text-2xs font-extrabold uppercase tracking-[0.14em] text-ink/65">
                Câu ví dụ
              </h4>
              <ul className="flex flex-col gap-3">
                {card.examples.map((sentence, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-sage-3 pl-4 text-[15px] italic leading-relaxed text-ink/75"
                  >
                    {highlight(sentence, card.word)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/*
            Chưa lật thì mặt sau phải THỰC SỰ không với tới được, không chỉ mờ
            đi. Ẩn bằng `opacity: 0` vẫn để chữ nằm trong cây: trình đọc màn
            hình đọc ra, Ctrl+F tìm thấy, Ctrl+A bôi đen là thấy — tức là một
            học sinh dùng bàn phím hoặc dùng trình đọc luôn biết đáp án trước
            khi tự nhớ, đúng thứ mà cả tính năng này sinh ra để ngăn.

            `visibility: hidden` cắt cả ba đường đó mà vẫn chạy được chuyển
            động; `aria-hidden` để trình đọc bỏ qua hẳn.
          */}
          <div
            aria-hidden={!flipped}
            className={`overflow-hidden border-t-2 border-dashed border-sage transition-all duration-300 ${
              flipped
                ? "max-h-64 pt-5 opacity-100"
                : "invisible max-h-0 opacity-0"
            }`}
          >
            <h4 className="text-2xs font-extrabold uppercase tracking-[0.14em] text-brand-soft">
              Nghĩa tiếng Việt
            </h4>
            <p className="mt-1.5 text-xl font-bold leading-snug text-ink">
              {card.vietnamese || "—"}
            </p>
          </div>
        </div>

        <div className="pt-2">
          {!flipped ? (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-deep"
            >
              Lật thẻ
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {RATINGS.map(({ value, label, when, Icon, tone }) => (
                <button
                  key={value}
                  type="button"
                  disabled={saving}
                  onClick={() => rate(value)}
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-sm font-bold transition-colors disabled:opacity-45 ${tone}`}
                >
                  <Icon size={16} />
                  {label}
                  <span className="text-2xs font-medium opacity-70">
                    {when}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-sage-3 bg-mist-3 p-4 text-2xs leading-relaxed text-ink/60">
        <span className="h-fit rounded-lg border border-sage-3 bg-white p-1.5 text-brand">
          <BookOpen size={15} />
        </span>
        <p>
          <b className="mb-0.5 block text-ink/80">Chấm thật, đừng chấm đẹp</b>
          Không nhớ ra nghĩa, hoặc không đặt nổi một câu với từ đó, thì bấm{" "}
          <b className="text-warn">Quên</b> — thẻ sẽ quay lại ngay trong buổi
          này. Chấm "Nhớ" cho một từ chưa thuộc là tự hẹn mình quên nó sau ba
          ngày. Phím tắt: Space lật thẻ, 1–4 chấm.
        </p>
      </div>
    </div>
  );
}
