"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  COLLECTION_GROUPS,
  matchesCollectionGroup,
} from "../domain/collectionGroups";
import { groupByBook } from "../domain/listeningCatalog";
import {
  availableIeltsTopics,
  matchesIeltsTopic,
  type IeltsTopic,
} from "../domain/topicTaxonomy";
import type {
  ListeningTestSummary,
  QuestionType,
  ReadingLevel,
} from "../domain/types";
import CatalogPagination, { TESTS_PER_PAGE } from "./CatalogPagination";
import ListeningBookCard from "./ListeningBookCard";
import ListeningPartCard from "./ListeningPartCard";
const QT: { value: QuestionType | "other"; label: string }[] = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "true-false-not-given", label: "True - False - Not Given" },
  { value: "matching-information", label: "Matching Information" },
  { value: "matching-features", label: "Matching Features" },
  { value: "matching-headings", label: "Matching Headings" },
  { value: "summary-completion", label: "Summary Completion" },
  { value: "gap-fill", label: "Gap Filling" },
  { value: "other", label: "Other Types" },
];
const KNOWN = new Set(
  QT.filter((x) => x.value !== "other").map((x) => x.value),
);
function Check({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1.5 text-xs font-medium text-ink/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-brand"
      />
      <span>{label}</span>
    </label>
  );
}
function Fold({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  const [shown, setShown] = useState(open || title === "Bộ đề");
  return (
    <section className="mt-5 border-t border-black/[0.07] pt-5">
      <button
        onClick={() => setShown(!shown)}
        className="flex w-full items-center justify-between text-sm font-bold"
      >
        {title === "Difficulty" ? "Mức độ" : title}
        <ChevronDown size={16} className={shown ? "rotate-180" : ""} />
      </button>
      {shown && <div className="mt-2">{children}</div>}
    </section>
  );
}
export default function ListeningCatalog({
  tests,
}: {
  tests: ListeningTestSummary[];
}) {
  const [mode, setMode] = useState<"single" | "full">("single"),
    [parts, setParts] = useState<number[]>([]),
    [collections, setCollections] = useState<string[]>([]),
    [types, setTypes] = useState<(QuestionType | "other")[]>([]),
    [levels, setLevels] = useState<ReadingLevel[]>([]),
    [topic, setTopic] = useState<IeltsTopic | "">(""),
    [status, setStatus] = useState<"undone" | "done">("undone"),
    [search, setSearch] = useState(""),
    [mobile, setMobile] = useState(false),
    [page, setPage] = useState(1);
  const topics = useMemo(
    () => availableIeltsTopics(tests.map((t) => `${t.topic} ${t.title}`)),
    [tests],
  );
  const toggle = <T,>(a: T[], v: T, s: (x: T[]) => void) =>
    s(a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
  const shown = useMemo(
    () =>
      tests.filter((t) => {
        if (status === "done" ? !t.completed : t.completed) return false;
        if (
          collections.length &&
          !collections.some((g) => matchesCollectionGroup(t.collection, g))
        )
          return false;
        if (levels.length && !levels.includes(t.level)) return false;
        if (topic && !matchesIeltsTopic(`${t.topic} ${t.title}`, topic))
          return false;
        if (
          types.length &&
          !types.some((q) =>
            q === "other"
              ? t.questionTypes.some((x) => !KNOWN.has(x))
              : t.questionTypes.includes(q),
          )
        )
          return false;
        const s = search.trim().toLowerCase();
        return (
          !s ||
          `${t.title} ${t.collection} ${t.topic}`.toLowerCase().includes(s)
        );
      }),
    [tests, status, collections, levels, topic, types, search],
  );
  const partItems = useMemo(
    () =>
      shown.flatMap((test) =>
        test.sections
          .filter((part) => !parts.length || parts.includes(part))
          .map((part) => ({
            test,
            part,
            title:
              test.topic.split("·")[part - 1]?.trim() ||
              `Listening Part ${part}`,
          })),
      ),
    [shown, parts],
  );
  const total = mode === "single" ? partItems.length : shown.length;
  const offset = (page - 1) * TESTS_PER_PAGE;
  const visibleTests = shown.slice(offset, offset + TESTS_PER_PAGE);
  const visibleParts = partItems.slice(offset, offset + TESTS_PER_PAGE);
  const groups = useMemo(() => groupByBook(visibleTests), [visibleTests]);
  useEffect(
    () => setPage(1),
    [mode, parts, collections, types, levels, topic, status, search],
  );
  const reset = () => {
    setParts([]);
    setCollections([]);
    setTypes([]);
    setLevels([]);
    setTopic("");
    setSearch("");
  };
  const dirty =
    parts.length + collections.length + types.length + levels.length > 0 ||
    !!topic ||
    !!search;
  return (
    <>
      <Top
        status={status}
        setStatus={setStatus}
        search={search}
        setSearch={setSearch}
      />
      <button
        onClick={() => setMobile(!mobile)}
        className="mb-4 flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold lg:hidden"
      >
        <SlidersHorizontal size={14} /> Bộ lọc
      </button>
      <div className="grid items-start gap-7 lg:grid-cols-[280px_1fr]">
        <aside
          className={`${mobile ? "block" : "hidden"} rounded-2xl border border-black/10 bg-white p-5 lg:sticky lg:top-28 lg:block`}
        >
          <div className="overflow-hidden rounded-2xl border-2 border-brand">
            <div className="bg-leaf/60 px-4 py-3 text-sm font-bold">
              Hình thức luyện tập
            </div>
            <div className="space-y-3 p-4 text-sm font-bold">
              <label className="flex gap-2">
                <input
                  type="radio"
                  checked={mode === "single"}
                  onChange={() => setMode("single")}
                />{" "}
                Bài lẻ
              </label>
              {mode === "single" && (
                <div className="ml-3 border-l pl-4">
                  {[1, 2, 3, 4].map((n) => (
                    <Check
                      key={n}
                      checked={parts.includes(n)}
                      label={`Part ${n}`}
                      onChange={() => toggle(parts, n, setParts)}
                    />
                  ))}
                </div>
              )}
              <label className="flex gap-2">
                <input
                  type="radio"
                  checked={mode === "full"}
                  onChange={() => setMode("full")}
                />{" "}
                Làm cả test
              </label>
            </div>
          </div>
          <Fold title="Bộ đề">
            {COLLECTION_GROUPS.map((c) => (
              <Check
                key={c.id}
                checked={collections.includes(c.id)}
                label={c.label}
                onChange={() => toggle(collections, c.id, setCollections)}
              />
            ))}
          </Fold>
          <Fold title="Loại câu hỏi" open>
            {QT.map((q) => (
              <Check
                key={q.value}
                checked={types.includes(q.value)}
                label={q.label}
                onChange={() => toggle(types, q.value, setTypes)}
              />
            ))}
          </Fold>
          <Fold title="Topics" open>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as IeltsTopic | "")}
              className="w-full rounded-xl border border-black/10 p-2.5 text-xs"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Fold>
          <Fold title="Difficulty" open>
            {[
              ["easy", "Easy"],
              ["medium", "Medium"],
              ["hard", "Difficult"],
            ].map(([v, l]) => (
              <Check
                key={v}
                checked={levels.includes(v as ReadingLevel)}
                label={l}
                onChange={() => toggle(levels, v as ReadingLevel, setLevels)}
              />
            ))}
          </Fold>
          {dirty && (
            <button
              onClick={reset}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-bold text-brand"
            >
              <X size={13} /> Xoá bộ lọc
            </button>
          )}
        </aside>
        <div>
          {total ? (
            <>
              <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {mode === "single"
                  ? visibleParts.map((item, i) => (
                      <ListeningPartCard
                        key={`${item.test.id}-${item.part}`}
                        {...item}
                        index={offset + i}
                      />
                    ))
                  : groups.map((group, i) => (
                      <ListeningBookCard
                        key={group.id}
                        group={group}
                        index={offset + i}
                      />
                    ))}
              </div>
              <CatalogPagination page={page} total={total} onChange={setPage} />
            </>
          ) : (
            <Empty />
          )}
        </div>
      </div>
    </>
  );
}
function Top({
  status,
  setStatus,
  search,
  setSearch,
}: {
  status: "undone" | "done";
  setStatus: (v: "undone" | "done") => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 rounded-2xl bg-[#F6F6F4] p-2 sm:flex-row sm:items-center">
      <div className="flex shrink-0">
        {[
          ["undone", "Bài chưa làm"],
          ["done", "Bài đã làm"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setStatus(v as "undone" | "done")}
            className={`rounded-xl px-5 py-3 text-sm font-bold ${status === v ? "bg-white text-brand shadow-sm" : "text-ink/45"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="relative ml-auto w-full sm:max-w-xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/45"
          size={19}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên bài tập"
          className="w-full rounded-full border border-black/10 bg-white py-3 pl-12 pr-5 text-sm outline-none"
        />
      </div>
    </div>
  );
}
function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 py-20 text-center text-sm text-ink/55">
      Không tìm thấy bài phù hợp.
    </div>
  );
}
