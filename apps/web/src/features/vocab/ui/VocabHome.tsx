"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame, Plus, Target } from "lucide-react";

import type { Deck, DeckProgress, StudentStats } from "../domain/types";
import DeckEditor from "./DeckEditor";
import StudySession from "./StudySession";

/*
  Trang từ vựng của học sinh. Port từ `StudentDashboard.tsx` + `DeckList.tsx`
  của repo gốc, gộp làm một vì hai màn đó ở bản gốc chỉ khác nhau một tab.

  Bốn con số ở đầu đúng như bản gốc: đến hạn hôm nay, đã thuộc, chuỗi ngày,
  tỉ lệ nhớ. Thứ tự cũng giữ — "đến hạn" đứng đầu vì đó là con số duy nhất
  dẫn tới một hành động ngay bây giờ.
*/

const EMPTY: StudentStats = {
  dueCount: 0,
  learnedCount: 0,
  streak: 0,
  accuracy: 100,
  progressDecks: [],
  totalLogsCount: 0,
  dailyReviews: [],
};

export default function VocabHome() {
  const [stats, setStats] = useState<StudentStats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [studying, setStudying] = useState<{ deckId?: string } | null>(null);
  const [editing, setEditing] = useState<Deck | null>(null);
  const [creating, setCreating] = useState<{ parent?: Deck } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vocab/stats", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setStats(data.stats as StudentStats);
    } catch {
      /* Không lấy được thống kê thì hiện số 0, không chặn cả trang. */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (studying) {
    return (
      <StudySession
        deckId={studying.deckId}
        onClose={() => {
          setStudying(null);
          void load();
        }}
        onDone={load}
      />
    );
  }

  if (editing) {
    return (
      <DeckEditor
        deck={editing}
        onClose={() => {
          setEditing(null);
          void load();
        }}
      />
    );
  }

  const maxDaily = Math.max(1, ...stats.dailyReviews.map((d) => d.count));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          {/*
            `h1` là TÊN TRANG, dòng to bên dưới là TRẠNG THÁI.

            Trước đây ngược lại: `h1` mang câu "Đang xem lịch ôn…" rồi đổi
            thành "Hôm nay có N thẻ đến hạn" khi dữ liệu về. Người dùng screen
            reader mở trang nghe được đúng một câu chờ, và heading của trang
            đổi chữ giữa chừng — không còn là cái mốc để nhảy tới.

            Nhìn thì y hệt bản cũ. Chỉ khác: dòng trạng thái mang `aria-live`
            nên lịch ôn tải xong là screen reader đọc luôn con số mới.
          */}
          <h1 className="mb-1 text-2xs font-extrabold uppercase tracking-[0.14em] text-brand-soft">
            Học từ vựng
          </h1>
          <p aria-live="polite" className="text-3xl font-extrabold text-brand">
            {loading
              ? "Đang xem lịch ôn…"
              : stats.dueCount > 0
                ? `Hôm nay có ${stats.dueCount} thẻ đến hạn`
                : "Hôm nay không có thẻ nào đến hạn"}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStudying({})}
            disabled={stats.dueCount === 0}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Ôn {stats.dueCount} thẻ
          </button>
          <button
            type="button"
            onClick={() => setCreating({})}
            className="flex items-center gap-1.5 rounded-xl border border-sage-3 bg-white px-5 py-3 text-sm font-bold"
          >
            <Plus size={15} /> Tạo bộ thẻ
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Đến hạn hôm nay",
            value: stats.dueCount,
            tone: stats.dueCount > 0 ? "text-warn" : "text-brand",
          },
          { label: "Đã thuộc", value: stats.learnedCount, tone: "text-brand" },
          {
            label: "Chuỗi ngày học",
            value: stats.streak,
            tone: "text-brand",
            Icon: Flame,
          },
          {
            label: "Tỉ lệ nhớ",
            value: `${stats.accuracy}%`,
            tone: "text-brand",
            Icon: Target,
          },
        ].map((s) => (
          <li
            key={s.label}
            className="rounded-2xl border border-sage-3 bg-white p-4"
          >
            <p className="flex items-center gap-1.5 text-2xs font-bold text-ink/65">
              {s.Icon && <s.Icon size={13} />}
              {s.label}
            </p>
            <p
              className={`mt-1 font-mono text-3xl font-extrabold tracking-tight ${s.tone}`}
            >
              {s.value}
            </p>
          </li>
        ))}
      </ul>

      {stats.dailyReviews.length > 0 && (
        <section className="rounded-2xl border border-sage-3 bg-white p-5">
          <p className="mb-4 text-2xs font-extrabold uppercase tracking-[0.14em] text-ink/65">
            Bảy ngày gần nhất · {stats.totalLogsCount} lượt ôn tất cả
          </p>
          <ul className="flex items-end gap-2" style={{ height: 120 }}>
            {stats.dailyReviews.map((d, i) => {
              const isToday = i === stats.dailyReviews.length - 1;
              const label = `${isToday ? "Hôm nay" : fullDay(d.day)}, ${shortDate(d.day)}: ${
                d.count ? `${d.count} lượt ôn` : "không ôn thẻ nào"
              }`;
              return (
                /*
                  Cả CỘT là vùng hover, không chỉ thanh: ngày 0 lượt chỉ có
                  một vạch 4px, bắt người dùng nhắm trúng vạch ấy là bắt khó.
                  `tabIndex` để bàn phím cũng xem được, cùng một tooltip.
                */
                <li
                  key={d.day ?? i}
                  tabIndex={0}
                  aria-label={label}
                  className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end gap-1.5 rounded-lg outline-none transition-colors hover:bg-mist-3 focus-visible:bg-mist-3 focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full z-10 mb-2 translate-y-1 ${
                      /* Cột đầu/cuối neo theo mép, kẻo tooltip tràn ra ngoài màn điện thoại. */
                      i === 0
                        ? "left-0"
                        : isToday
                          ? "right-0"
                          : "left-1/2 -translate-x-1/2"
                    } whitespace-nowrap rounded-lg bg-brand-deep px-3 py-2 text-center opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100`}
                  >
                    <span className="block text-2xs font-semibold text-white/70">
                      {isToday ? "Hôm nay" : fullDay(d.day)} ·{" "}
                      {shortDate(d.day)}
                    </span>
                    <span className="block text-sm font-extrabold text-white">
                      {d.count ? `${d.count} lượt ôn` : "Không ôn thẻ nào"}
                    </span>
                    <span
                      aria-hidden
                      className={`absolute top-full border-x-[6px] ${i === 0 ? "left-4" : isToday ? "right-4" : "left-1/2 -translate-x-1/2"} border-t-[6px] border-x-transparent border-t-brand-deep`}
                    />
                  </span>
                  <span
                    className={`w-full rounded-t-md transition-colors ${
                      d.count
                        ? "bg-brand group-hover:bg-brand-deep"
                        : "bg-sage-2 group-hover:bg-sage-3"
                    }`}
                    style={{
                      height: `${Math.max(4, (d.count / maxDaily) * 72)}px`,
                    }}
                    aria-hidden
                  />
                  <span
                    aria-hidden
                    className={`text-2xs font-semibold ${isToday ? "text-brand" : "text-ink/65"}`}
                  >
                    {d.date}
                  </span>
                  <span
                    aria-hidden
                    className="font-mono text-2xs font-bold text-ink/70"
                  >
                    {d.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-brand">Bộ thẻ của bạn</h2>
        {stats.progressDecks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sage-3 bg-mist-3 px-5 py-8 text-center text-sm leading-relaxed text-ink/60">
            Chưa có bộ thẻ nào. Cô sẽ giao bộ của lớp, hoặc bạn tự tạo một bộ từ
            những từ mình gặp trong bài đọc.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deckTree(stats.progressDecks).map(
              ({
                deck,
                totalCards,
                learnedCount,
                percentage,
                depth,
                childCount,
              }) => (
                <li
                  key={deck.id}
                  style={{ marginLeft: `${Math.min(depth, 4) * 1.5}rem` }}
                  className={`flex flex-col gap-2.5 rounded-2xl border border-sage-3 bg-white p-4 ${depth ? "border-l-4 border-l-brand/30" : ""}`}
                >
                  <div className="flex items-baseline gap-2">
                    <b className="text-[15px]">{deck.name}</b>
                    {childCount > 0 && (
                      <span className="text-2xs font-semibold text-ink/60">
                        · {childCount} bộ con
                      </span>
                    )}
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-bold ${
                        deck.type === "official"
                          ? "bg-sage-2 text-brand"
                          : "bg-mist text-ink/60"
                      }`}
                    >
                      {deck.type === "official" ? "BỘ CỦA CÔ" : "TÔI TẠO"}
                    </span>
                  </div>
                  {deck.description && (
                    <p className="text-2xs text-ink/65">{deck.description}</p>
                  )}
                  <span
                    className="block h-1.5 rounded-full bg-sage-2"
                    aria-hidden
                  >
                    <i
                      className={`block h-full rounded-full ${percentage === 100 ? "bg-leaf-dark" : "bg-brand"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </span>
                  <p className="text-2xs text-ink/65">
                    {learnedCount} / {totalCards} thẻ đã ôn
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStudying({ deckId: deck.id })}
                      className="rounded-full bg-brand px-3.5 py-2 text-2xs font-bold text-white"
                    >
                      {childCount > 0
                        ? "Ôn bộ này + bộ con"
                        : "Ôn riêng bộ này"}
                    </button>
                    {deck.type === "personal" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(deck)}
                          className="rounded-full border border-sage-3 px-3.5 py-2 text-2xs font-bold"
                        >
                          Sửa thẻ
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreating({ parent: deck })}
                          className="flex items-center gap-1 rounded-full border border-sage-3 px-3.5 py-2 text-2xs font-bold"
                        >
                          <Plus size={13} /> Bộ con
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      {creating && (
        <CreateDeck
          parent={creating.parent}
          onClose={() => setCreating(null)}
          onCreated={(deck) => {
            setCreating(null);
            setEditing(deck);
          }}
        />
      )}
    </div>
  );
}

const DAY_FULL = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];
const fullDay = (day: string) => DAY_FULL[new Date(`${day}T00:00:00`).getDay()];
const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/*
  Xếp bộ thẻ thành cây: bộ con đứng ngay dưới bộ cha, thụt vào theo độ sâu.
  Bộ có cha nằm ngoài danh sách (cô giao bộ con mà không giao bộ cha) thì coi
  là bộ gốc — giấu đi là học sinh mất bộ cô đã giao.
*/
function deckTree(list: DeckProgress[]) {
  const ids = new Set(list.map((p) => p.deck.id));
  const children = new Map<string | null, DeckProgress[]>();
  for (const p of list) {
    const key =
      p.deck.parentId && ids.has(p.deck.parentId) ? p.deck.parentId : null;
    children.set(key, [...(children.get(key) ?? []), p]);
  }
  const out: (DeckProgress & { depth: number; childCount: number })[] = [];
  const seen = new Set<string>();
  const walk = (key: string | null, depth: number) => {
    for (const p of children.get(key) ?? []) {
      if (seen.has(p.deck.id)) continue;
      seen.add(p.deck.id);
      out.push({
        ...p,
        depth,
        childCount: children.get(p.deck.id)?.length ?? 0,
      });
      walk(p.deck.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function CreateDeck({
  parent,
  onClose,
  onCreated,
}: {
  parent?: Deck;
  onClose: () => void;
  onCreated: (deck: Deck) => void;
}) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vocab/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, topic, parentId: parent?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không tạo được bộ thẻ.");
      onCreated(data.deck as Deck);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được bộ thẻ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-deep/60 p-5"
      data-lenis-prevent
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={parent ? "Tạo bộ con" : "Tạo bộ thẻ"}
        className="w-full max-w-md rounded-2xl bg-white p-6"
      >
        <h2 className="text-xl font-extrabold text-brand">
          {parent ? "Tạo bộ con" : "Tạo bộ thẻ mới"}
        </h2>
        {parent && (
          <p className="mt-1 text-sm text-ink/65">
            Nằm trong bộ <b>{parent.name}</b>. Ôn bộ cha là ôn luôn bộ này.
          </p>
        )}
        <label className="mt-4 block text-sm font-bold" htmlFor="deck-name">
          Tên bộ
        </label>
        <input
          id="deck-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Từ sai trong Cam 14 Test 2"
          className="mt-1.5 w-full rounded-lg border border-sage-3 px-3 py-2.5 text-sm"
        />
        <label className="mt-3 block text-sm font-bold" htmlFor="deck-topic">
          Chủ đề{" "}
          <span className="font-normal text-ink/65">(không bắt buộc)</span>
        </label>
        <input
          id="deck-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Education"
          className="mt-1.5 w-full rounded-lg border border-sage-3 px-3 py-2.5 text-sm"
        />
        {error && (
          <p className="mt-3 text-sm font-semibold text-warn">{error}</p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-sage-3 px-4 py-3 text-sm font-bold"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !name.trim()}
            className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Đang tạo…" : "Tạo bộ"}
          </button>
        </div>
      </div>
    </div>
  );
}
