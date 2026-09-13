"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock3,
  Headphones,
  BookOpen,
  PenLine,
  Settings,
  Target,
  X,
} from "lucide-react";
import type {
  Paper,
  Profile,
  Question,
  Section,
  Session,
  Workspace,
} from "../types";
import HighlightableText from "../../practice/ui/HighlightableText";
import AudioPlayer from "./AudioPlayer";
import StudyPlan from "./StudyPlan";
import "./diagnostic.css";

const sections: Section[] = ["Listening", "Reading", "Grammar"];
const totals = { Listening: 20, Reading: 13, Grammar: 20 };
const names = ["Tốt", "Khá", "Cần cải thiện"];
const emptyWorkspace: Workspace = {
  bookmarks: [],
  highlights: [],
  section: "Listening",
  audio: [0, 0],
  audioDone: [false, false],
  scroll: {},
  issues: [],
};
const initialProfile: Profile = {
  name: "",
  email: "",
  target: "",
  purpose: "",
};
const STORAGE = "thuong-diagnostic-v1";
type Draft = {
  token: string;
  answers: Record<string, string>;
  workspace: Workspace;
  dirty: boolean;
};
export default function Diagnostic() {
  const [paper, setPaper] = useState<Paper | null>(null),
    [session, setSession] = useState<Session | null>(null),
    [profile, setProfile] = useState(initialProfile);
  const [stage, setStage] = useState<
    "intro" | "profile" | "instructions" | "exam" | "result"
  >("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({}),
    [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [remaining, setRemaining] = useState(2700),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [saveStatus, setSaveStatus] = useState("Đã lưu");
  const [ready, setReady] = useState([false, false]),
    [heard, setHeard] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [submitDialog, setSubmitDialog] = useState(false);
  const [resultTab, setResultTab] = useState<"report" | "answers" | "plan">(
      "report",
    ),
    [reviewSection, setReviewSection] = useState<Section>("Listening"),
    [filter, setFilter] = useState("all");
  const [fontSize, setFontSize] = useState(17),
    [split, setSplit] = useState(50),
    [readingPane, setReadingPane] = useState("passage"),
    [sound, setSound] = useState(true),
    [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false),
    [fontFamily, setFontFamily] = useState<"sans" | "serif">("sans"),
    [examTheme, setExamTheme] = useState<"light" | "dark">("light"),
    [listeningPart, setListeningPart] = useState<1 | 2>(1),
    [dragHeading, setDragHeading] = useState(""),
    [dragOption, setDragOption] = useState(""),
    [dragAnswerId, setDragAnswerId] = useState("");
  const [selection, setSelection] = useState<{
    blockId: string;
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);
  const [activeQuestion, setActiveQuestion] = useState("L01");
  const [resetPrompt, setResetPrompt] = useState(false);
  const token = useRef(""),
    editor = useRef(""),
    draftLoaded = useRef(false),
    dirty = useRef(false),
    sending = useRef(false),
    deadline = useRef(0),
    pendingSubmit = useRef(false),
    lastWarn = useRef(0);
  const latest = useRef({ answers, workspace, stage, profile });
  latest.current = { answers, workspace, stage, profile };
  const local = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          token: token.current,
          answers: latest.current.answers,
          workspace: latest.current.workspace,
          dirty: dirty.current,
        }),
      );
    } catch {
      setSaveStatus("Không lưu được trên thiết bị — hãy giữ trang này mở.");
    }
  }, []);
  async function api(action: string, extra: Record<string, unknown> = {}) {
    const response = await fetch("/api/diagnostic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token.current ? { Authorization: `Bearer ${token.current}` } : {}),
      },
      body: JSON.stringify({ action, editor: editor.current, ...extra }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Không kết nối được hệ thống.");
    return data as Session & { token: string };
  }
  function apply(data: Session) {
    setSession(data);
    setPaper(data.paper);
    setProfile(data.profile);
    deadline.current = performance.now() + data.remaining * 1000;
    setRemaining(Math.ceil(data.remaining));
    if (data.submittedAt) {
      setStage("result");
      pendingSubmit.current = false;
    } else setStage("exam");
  }
  const sync = useRef<(submit?: boolean) => Promise<void>>(async () => {});
  sync.current = async (submit = false) => {
    if (sending.current || !token.current || latest.current.stage !== "exam")
      return;
    sending.current = true;
    const current = latest.current;
    setSaveStatus("Đang lưu…");
    try {
      const data = await api(submit ? "submit" : "save", {
        answers: current.answers,
        workspace: current.workspace,
      });
      const unsynced =
        data.submittedAt &&
        data.paper.questions.some(
          (q) => (data.answers[q.id] ?? "") !== (current.answers[q.id] ?? ""),
        );
      if (
        latest.current.answers === current.answers &&
        latest.current.workspace === current.workspace
      ) {
        dirty.current = false;
        local();
      }
      setSession(data);
      deadline.current = performance.now() + data.remaining * 1000;
      setSaveStatus("Đã lưu");
      setMessage("");
      if (data.submittedAt) {
        if (unsynced)
          setNotice(
            "Có thay đổi trên thiết bị chưa được hệ thống nhận trước hạn. Kết quả chỉ tính các đáp án đã được chấp nhận.",
          );
        apply(data);
        setSubmitDialog(false);
      }
    } catch (error) {
      setSaveStatus("Chưa đồng bộ — đang giữ câu trả lời trên thiết bị.");
      setMessage((error as Error).message);
    } finally {
      sending.current = false;
    }
  };
  useEffect(() => {
    editor.current =
      sessionStorage.getItem(STORAGE + "-editor") || crypto.randomUUID();
    sessionStorage.setItem(STORAGE + "-editor", editor.current);
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/diagnostic");
        if (!res.ok) throw new Error("Chưa tải được đề. Hãy tải lại trang.");
        const data = await res.json();
        if (cancelled) return;
        setPaper(data);
        const raw = localStorage.getItem(STORAGE);
        const draft: Draft | null = raw ? JSON.parse(raw) : null;
        const linkToken = location.hash.replace("#result=", "");
        token.current = /^[a-f0-9]{64}$/.test(linkToken)
          ? linkToken
          : (draft?.token ?? "");
        const savedProfile = localStorage.getItem(STORAGE + "-profile");
        if (savedProfile) setProfile(JSON.parse(savedProfile));
        if (token.current) {
          const data = await api("resume");
          if (cancelled) return;
          const useDraft =
            draft?.token === token.current && draft?.dirty && !data.submittedAt;
          setAnswers(useDraft ? draft!.answers : data.answers);
          setWorkspace({
            ...emptyWorkspace,
            ...(useDraft ? draft!.workspace : data.workspace),
          });
          dirty.current = !!useDraft;
          apply(data);
          if (data.submittedAt && draft?.dirty)
            setNotice(
              "Một số thay đổi trên thiết bị chưa được đồng bộ trước hạn. Kết quả hiển thị chỉ tính đáp án đã được hệ thống chấp nhận.",
            );
        }
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        draftLoaded.current = true;
      }
    }
    let release = () => {};
    if (navigator.locks) {
      void navigator.locks.request(
        STORAGE + "-" + editor.current,
        { ifAvailable: true },
        async (lock) => {
          if (cancelled) return;
          if (!lock) {
            editor.current = crypto.randomUUID();
            sessionStorage.setItem(STORAGE + "-editor", editor.current);
            void init();
            return;
          }
          const held = new Promise<void>((resolve) => {
            release = resolve;
          });
          void init();
          await held;
        },
      );
    } else void init();
    return () => {
      cancelled = true;
      release();
    };
  }, []);
  useEffect(() => {
    if (!draftLoaded.current) return;
    local();
  }, [answers, workspace, local]);
  useEffect(() => {
    if (draftLoaded.current)
      try {
        localStorage.setItem(STORAGE + "-profile", JSON.stringify(profile));
      } catch {}
  }, [profile]);
  useEffect(() => {
    if (stage !== "exam") return;
    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - performance.now()) / 1000),
      );
      setRemaining(left);
      if (left <= 0 || pendingSubmit.current) {
        pendingSubmit.current = true;
        void sync.current(true);
      } else if (!session?.locked) void sync.current();
    }, 5000);
    const clock = setInterval(
      () =>
        setRemaining(
          Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000)),
        ),
      250,
    );
    const exit = (e: BeforeUnloadEvent) => {
      local();
      e.preventDefault();
    };
    window.addEventListener("beforeunload", exit);
    const online = () => void sync.current(pendingSubmit.current);
    window.addEventListener("online", online);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
      window.removeEventListener("beforeunload", exit);
      window.removeEventListener("online", online);
    };
  }, [stage, session?.locked, local]);
  useEffect(() => {
    if (stage !== "exam" || remaining > 300) return;
    const level = remaining <= 60 ? 2 : 1;
    if (level <= lastWarn.current) return;
    lastWarn.current = level;
    setNotice(
      level === 2
        ? "Còn 1 phút — hãy kiểm tra câu chưa trả lời."
        : "Còn 5 phút.",
    );
    if (sound) {
      const beep = () => {
        if (
          Array.from(document.querySelectorAll("audio")).some(
            (a) => !a.paused && !a.ended,
          )
        )
          return false;
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator(),
            gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.value = 0.08;
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
          osc.onended = () => void ctx.close();
        } catch {}
        return true;
      };
      if (!beep()) {
        const id = setInterval(() => {
          if (beep()) clearInterval(id);
        }, 1000);
        return () => clearInterval(id);
      }
    }
  }, [remaining, stage, sound]);
  function updateWorkspace(update: (w: Workspace) => Workspace) {
    dirty.current = true;
    setWorkspace(update);
  }
  const audioReady = useCallback(
    (i: number, value: boolean) =>
      setReady((old) =>
        old[i] === value ? old : old.map((v, n) => (n === i ? value : v)),
      ),
    [],
  );
  const audioProgress = useCallback(
    (i: number, seconds: number, ended: boolean) => {
      if (latest.current.stage !== "exam") return;
      updateWorkspace((w) => ({
        ...w,
        audio: w.audio.map((v, n) => (n === i ? seconds : v)),
        audioDone: w.audioDone.map((v, n) => (n === i ? ended : v)),
      }));
    },
    [],
  );
  const audioIssue = useCallback((issue: string) => {
    updateWorkspace((w) =>
      w.issues.includes(issue) ? w : { ...w, issues: [...w.issues, issue] },
    );
  }, []);
  async function start() {
    setBusy(true);
    setMessage("");
    try {
      if (!token.current) {
        token.current = Array.from(
          crypto.getRandomValues(new Uint8Array(32)),
          (b) => b.toString(16).padStart(2, "0"),
        ).join("");
        local();
      }
      const data = await api("start", { profile });
      setAnswers(data.answers);
      setWorkspace({ ...emptyWorkspace, ...data.workspace });
      apply(data);
      local();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function mark(id: string) {
    updateWorkspace((w) => ({
      ...w,
      bookmarks: w.bookmarks.includes(id)
        ? w.bookmarks.filter((v) => v !== id)
        : [...w.bookmarks, id],
    }));
  }
  function answer(id: string, value: string) {
    dirty.current = true;
    setAnswers((old) => ({ ...old, [id]: value }));
    setActiveQuestion(id);
    setSaveStatus("Đang lưu…");
  }
  function newAttempt() {
    setResetPrompt(false);
    localStorage.removeItem(STORAGE);
    token.current = "";
    dirty.current = false;
    pendingSubmit.current = false;
    lastWarn.current = 0;
    setSession(null);
    setAnswers({});
    setWorkspace(emptyWorkspace);
    setRemaining(2700);
    setNotice("");
    setMessage("");
    setReady([false, false]);
    setHeard(false);
    setConfirmed(false);
    setStage("intro");
  }
  function selectText() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0),
      block = range.startContainer.parentElement?.closest("[data-block-id]");
    if (
      !block ||
      block !== range.endContainer.parentElement?.closest("[data-block-id]")
    )
      return;
    const before = range.cloneRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;
    const rect = range.getBoundingClientRect();
    setSelection({
      blockId: (block as HTMLElement).dataset.blockId!,
      start,
      end: start + range.toString().length,
      x: Math.min(
        window.innerWidth - 125,
        Math.max(8, rect.left + rect.width / 2 - 55),
      ),
      y: Math.max(8, rect.top - 44),
    });
  }
  function highlight() {
    if (!selection) return;
    const { blockId, start, end } = selection;
    updateWorkspace((w) => ({
      ...w,
      highlights: [...w.highlights, { blockId, start, end }],
    }));
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }
  function removeSelectedHighlight() {
    if (!selection) return;
    const { blockId, start, end } = selection;
    updateWorkspace((w) => ({
      ...w,
      highlights: w.highlights.filter(
        (h) => h.blockId !== blockId || h.end <= start || h.start >= end,
      ),
    }));
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }
  function text(id: string, value: string) {
    return (
      <HighlightableText
        blockId={id}
        text={value}
        highlights={workspace.highlights.filter((h) => h.blockId === id)}
        onRemove={(blockId, offset) => {
          updateWorkspace((w) => ({
            ...w,
            highlights: w.highlights.filter(
              (h) =>
                !(h.blockId === blockId && h.start <= offset && h.end > offset),
            ),
          }));
        }}
      />
    );
  }
  function field(q: Question) {
    return (
      <article
        id={`diag-${q.id}`}
        key={q.id}
        className={`diag-question ${q.section === "Listening" ? "diag-listening-question" : ""} ${activeQuestion === q.id ? "is-current" : ""} ${workspace.bookmarks.includes(q.id) ? "is-review" : ""}`}
      >
        <div className="diag-question-row mb-3 flex items-start gap-3">
          <span className="diag-question-id font-mono font-bold text-brand">
            {q.id}
            {q.section === "Listening" && q.id >= "L17" ? "." : ""}
          </span>
          <div className="flex-1 font-medium">
            {q.options.length > 0 ? (
              q.section === "Listening" && q.id >= "L17" ? (
                <strong>{text(q.id, q.prompt)}</strong>
              ) : (
                text(q.id, q.prompt)
              )
            ) : (
              <label>
                {text(q.id, q.prompt.split("_____")[0])}
                <span
                  className={
                    q.section === "Listening" ? "diag-listening-gap" : ""
                  }
                >
                  {q.section === "Listening" && <span>{q.id}</span>}
                  <input
                    aria-label={`Đáp án ${q.id}`}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    value={answers[q.id] ?? ""}
                    onFocus={() => setActiveQuestion(q.id)}
                    onChange={(e) => answer(q.id, e.target.value)}
                    className="diag-gap"
                    maxLength={150}
                  />
                </span>
                {text(q.id + "-after", q.prompt.split("_____")[1] ?? "")}
              </label>
            )}
          </div>
          <button
            aria-label={`Đánh dấu xem lại ${q.id}`}
            aria-pressed={workspace.bookmarks.includes(q.id)}
            onClick={() => mark(q.id)}
            className="p-1 text-brand"
          >
            <Bookmark
              size={19}
              fill={
                workspace.bookmarks.includes(q.id) ? "currentColor" : "none"
              }
            />
          </button>
        </div>
        {q.options.length > 0 &&
          (q.section === "Grammar" ||
          (q.id >= "L17" && q.section === "Listening") ? (
            <fieldset className="grid gap-2">
              <legend className="sr-only">Đáp án {q.id}</legend>
              {q.options.map((o) => (
                <label key={o.value} className="diag-option">
                  <input
                    type="radio"
                    name={q.id}
                    value={o.value}
                    checked={answers[q.id] === o.value}
                    onChange={() => answer(q.id, o.value)}
                  />
                  <span>
                    <b>{o.value}.</b> {text(q.id + "-" + o.value, o.label)}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <select
              aria-label={`Đáp án ${q.id}`}
              value={answers[q.id] ?? ""}
              onFocus={() => setActiveQuestion(q.id)}
              onChange={(e) => answer(q.id, e.target.value)}
              className="diag-input"
            >
              <option value="">Chọn đáp án</option>
              {q.options.map((o) => (
                <option value={o.value} key={o.value}>
                  {o.value}. {o.label}
                </option>
              ))}
            </select>
          ))}
        {q.options.length > 0 && answers[q.id] && (
          <button
            onClick={() => answer(q.id, "")}
            className="mt-2 text-xs underline text-ink/60"
          >
            Xóa đáp án {q.id}
          </button>
        )}
      </article>
    );
  }
  function jump(id: string) {
    setActiveQuestion(id);
    setReadingPane("questions");
    const target = document.getElementById(`diag-${id}`);
    if (target) {
      const pane = target.closest(".diag-scroll");
      pane?.scrollTo({
        top:
          (target as HTMLElement).offsetTop -
          (pane as HTMLElement).offsetTop -
          12,
        behavior: "instant",
      });
    }
  }
  const totalAnswered = Object.values(answers).filter((a) => a.trim()).length;
  const selectedHighlight =
    selection &&
    workspace.highlights.some(
      (h) =>
        h.blockId === selection.blockId &&
        h.start < selection.end &&
        h.end > selection.start,
    );
  const locked = !!session?.locked || remaining <= 0;
  const headingQuestion = (i: number) =>
    paper?.questions.find((q) => q.id === `R${String(i + 1).padStart(2, "0")}`);
  const assignedHeadings = new Set(
    paper?.questions
      .filter((q) => q.id >= "R01" && q.id <= "R06")
      .map((q) => answers[q.id])
      .filter(Boolean),
  );
  const assignHeading = (id: string, value: string) => {
    if (value) answer(id, value);
    setDragHeading("");
  };
  const visibleQuestions = (s: Section) =>
    paper?.questions.filter(
      (q) =>
        q.section === s &&
        !(s === "Reading" && q.id >= "R01" && q.id <= "R06") &&
        (s !== "Listening" ||
          (listeningPart === 1 && q.id <= "L10") ||
          (listeningPart === 2 && q.id >= "L11")),
    ) ?? [];
  const formField = (key: keyof Profile, label: string, options?: string[]) => (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {options ? (
        <select
          className="diag-input"
          required
          value={String(profile[key] ?? "")}
          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
        >
          <option value="">Chọn một mục</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          className="diag-input"
          required
          type={key === "email" ? "email" : "text"}
          value={String(profile[key] ?? "")}
          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
        />
      )}
    </label>
  );
  return (
    <main
      data-lenis-prevent={stage === "exam" ? true : undefined}
      className={`diagnostic ${stage === "exam" ? "diagnostic-exam" : ""} ${stage === "exam" ? `diag-theme-${examTheme} diag-font-${fontFamily}` : ""}`}
    >
      {stage !== "exam" && stage !== "instructions" && (
        <div className="diag-intro-header">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
            THƯƠNG HỒ’S CLASS · IELTS DIAGNOSTIC TEST
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-brand md:text-5xl">
            Kiểm tra nền tảng IELTS
          </h1>
        </div>
      )}
      {message && (
        <div role="alert" className="diag-notice flex gap-3">
          {message}
          <button
            className="ml-auto underline"
            onClick={() => {
              setMessage("");
              if (stage === "exam") void sync.current();
            }}
          >
            Thử lại
          </button>
        </div>
      )}
      {stage === "intro" && (
        <div className="diag-intro-grid">
          <div>
            <h2 className="text-2xl font-semibold leading-relaxed md:text-3xl">
              Biết mình đang ở đâu.
              <br />
              <span className="text-brand">Hiểu nên bắt đầu từ đâu.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              Khám phá nền tảng Listening, Reading và Grammar, biết{" "}
              <strong className="font-semibold text-brand">
                điểm mạnh &amp; điểm yếu
              </strong>{" "}
              của từng kĩ năng và nhận{" "}
              <strong className="font-semibold text-brand">
                kế hoạch tự học trong 4 tuần
              </strong>{" "}
              để{" "}
              <strong className="font-semibold text-brand">
                sẵn sàng chinh phục IELTS
              </strong>
              .
            </p>
            <button
              disabled={!paper}
              onClick={() => setStage("profile")}
              className="diag-primary mt-8"
            >
              {paper ? "Bắt đầu kiểm tra" : "Đang tải đề…"}{" "}
              <ArrowUpRight size={19} />
            </button>
          </div>
          <div className="diag-outline">
            <div className="flex items-center justify-between border-b border-brand/20 pb-5">
              <span className="flex items-center gap-2 font-semibold">
                <Clock3 size={20} />
                45 phút
              </span>
              <span className="font-mono">53 câu</span>
            </div>
            {sections.map((s, i) => {
              const Icon = [Headphones, BookOpen, PenLine][i];
              return (
                <div
                  key={s}
                  className="flex items-center gap-4 border-b border-brand/10 py-5 last:border-0"
                >
                  <Icon size={23} className="text-brand" />
                  <div className="flex-1">
                    <b>{s}</b>
                    <p className="mt-1 text-sm text-ink/65">
                      {
                        [
                          "2 bài nghe · 17 phút",
                          "1 bài đọc · 18 phút",
                          "8 điểm ngữ pháp chủ chốt · 10 phút",
                        ][i]
                      }
                    </p>
                  </div>
                  <span className="font-mono text-brand">{totals[s]} câu</span>
                </div>
              );
            })}
          </div>
          <div className="col-span-full border-t border-brand/15 pt-6 text-sm leading-relaxed text-ink/65">
            <p className="font-semibold text-brand">Lưu ý:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Đây là bài đánh giá sơ bộ, chưa bao gồm Writing và Speaking. Kết
                quả không phải điểm IELTS chính thức.
              </li>
              <li>
                Học sinh cần làm bài trên máy tính &amp; sử dụng tai nghe.
              </li>
            </ul>
          </div>
        </div>
      )}
      {stage === "profile" && (
        <form
          className="diag-panel mx-auto max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            setStage("instructions");
          }}
        >
          <h2 className="mb-5 text-2xl font-bold">Thông tin học viên</h2>
          <div className="grid gap-5">
            {formField("name", "Họ và tên *")}
            {formField("email", "Email *")}
            {formField("target", "Mục tiêu *", [
              "Chưa xác định",
              "5.0",
              "5.5",
              "6.0",
              "6.5",
              "7.0",
              "7.5",
              "8.0",
              "8.5+",
            ])}
            {formField("purpose", "Mục đích học IELTS *", [
              "Nộp thi đại học",
              "Đi du học",
              "Đi xin việc",
              "Khác",
            ])}
          </div>
          <div className="mt-7 flex gap-3">
            <button
              type="button"
              className="diag-secondary"
              onClick={() => setStage("intro")}
            >
              Quay lại
            </button>
            <button className="diag-primary">Tiếp tục</button>
          </div>
        </form>
      )}
      {stage === "instructions" && paper && (
        <div className="diag-instructions-card">
          {stage === "instructions" && (
            <>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-brand">
                Kiểm tra nền tảng IELTS
              </p>
              <h2 className="text-3xl font-bold text-ink">
                Hướng dẫn làm bài kiểm tra
              </h2>
              <ol className="my-7 ml-5 list-decimal space-y-3 text-sm leading-relaxed text-ink/75">
                <li>
                  Bạn có 45 phút cho toàn bài kiểm tra 3 phần (Listening /
                  Reading / Grammar). Bạn được quyền di chuyển qua lại trong 3
                  phần.
                </li>
                <li>
                  Audio nghe một lượt, không tua hoặc phát lại. Tạm dừng audio
                  vẫn tính giờ làm bài.
                </li>
                <li>
                  Bôi đen chữ để highlight; bấm biểu tượng dấu trang để đánh dấu
                  câu cần xem lại.
                </li>
                <li>
                  Không sử dụng từ điển, công cụ dịch hoặc AI để kết quả chính
                  xác nhất.
                </li>
                <li>Khi hết giờ, hệ thống tự động nộp các đáp án đã lưu.</li>
              </ol>
              <button
                className="diag-secondary"
                onClick={() => {
                  try {
                    const ctx = new AudioContext();
                    const oscillator = ctx.createOscillator(),
                      gain = ctx.createGain();
                    oscillator.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.value = 0.12;
                    oscillator.frequency.value = 440;
                    oscillator.start();
                    oscillator.stop(ctx.currentTime + 1);
                    oscillator.onended = () => void ctx.close();
                    setHeard(true);
                  } catch {
                    setMessage(
                      "Không phát được âm thử. Kiểm tra tai nghe hoặc trình duyệt.",
                    );
                  }
                }}
              >
                Bấm vào để kiểm tra âm thanh
              </button>
              <label className="my-4 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Tôi đã nghe rõ âm thanh thử.
              </label>
            </>
          )}
          <div className="hidden">
            {paper.audio.map((id, i) => (
              <AudioPlayer
                key={id}
                id={id}
                index={i}
                initial={workspace.audio[i]}
                done={workspace.audioDone[i]}
                review={false}
                disabled
                onReady={audioReady}
                onProgress={audioProgress}
                onIssue={audioIssue}
              />
            ))}
          </div>
          {stage === "instructions" && (
            <>
              {!ready.every(Boolean) && (
                <p className="mb-4 text-sm" role="status">
                  {workspace.issues.length
                    ? "Chưa tải được bài nghe. Hãy kiểm tra kết nối rồi tải lại trang; thông tin đã điền được giữ lại."
                    : "Đang tải hai bài nghe trước khi bắt đầu…"}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  className="diag-secondary"
                  onClick={() => setStage("profile")}
                >
                  Quay lại
                </button>
                <button
                  className="diag-primary"
                  disabled={
                    !ready.every(Boolean) || !heard || !confirmed || busy
                  }
                  onClick={start}
                >
                  {busy ? "Đang tạo lượt làm…" : "Bắt đầu tính giờ"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {stage === "exam" && paper && (
        <>
          <header className="diag-exam-header">
            <div className="diag-exam-top">
              <div className="diag-exam-identity">
                <span className="diag-ielts-mark">IELTS</span>
                <p className="truncate text-sm font-bold">
                  Kiểm tra nền tảng IELTS
                </p>
              </div>
              <div
                className={`diag-timer ${remaining <= 60 ? "is-danger" : remaining <= 300 ? "is-warning" : ""}`}
                aria-label="Thời gian còn lại"
              >
                <span>Còn lại</span>
                <strong>
                  {Math.floor(remaining / 60)}:
                  {String(remaining % 60).padStart(2, "0")}
                </strong>
              </div>
              <div className="diag-header-actions">
                <button
                  type="button"
                  className="diag-exit"
                  aria-label="Điều chỉnh giao diện"
                  onClick={() => setSettingsOpen((v) => !v)}
                >
                  <Settings size={17} />
                </button>
                <Link
                  href="/kiem-tra-kien-thuc"
                  aria-label="Thoát về phòng luyện tập"
                  className="diag-exit"
                >
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </div>
            <div className="diag-exam-meta">
              <span role="status">{saveStatus}</span>
              <label>
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                />{" "}
                Âm nhắc giờ
              </label>
            </div>
            {settingsOpen && (
              <aside
                className="diag-settings"
                aria-label="Điều chỉnh giao diện"
              >
                <div className="flex items-center justify-between">
                  <b>Điều chỉnh giao diện</b>
                  <button
                    aria-label="Đóng"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <label>
                  Cỡ chữ{" "}
                  <input
                    type="range"
                    min="15"
                    max="22"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </label>
                <label>
                  Font chữ{" "}
                  <select
                    value={fontFamily}
                    onChange={(e) =>
                      setFontFamily(e.target.value as "sans" | "serif")
                    }
                  >
                    <option value="sans">Không chân</option>
                    <option value="serif">Có chân</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={examTheme === "light" ? "active" : ""}
                    onClick={() => setExamTheme("light")}
                  >
                    Màn hình sáng
                  </button>
                  <button
                    className={examTheme === "dark" ? "active" : ""}
                    onClick={() => setExamTheme("dark")}
                  >
                    Màn hình tối
                  </button>
                </div>
              </aside>
            )}
            {notice && (
              <p role="status" className="mt-2 text-sm text-amber-900">
                {notice}
              </p>
            )}
            {session?.locked && (
              <p role="alert" className="diag-notice">
                Bài đang được mở trong một tab khác. Đóng tab đó, chờ vài giây
                rồi tải lại trang này để tiếp tục.
              </p>
            )}
          </header>
          <fieldset
            disabled={locked}
            className="diag-test-body"
            onMouseUp={selectText}
            onTouchEnd={selectText}
          >
            {sections.map((s) => (
              <div
                className={`diag-section ${s === workspace.section ? "" : "is-hidden"}`}
                key={s}
              >
                {s === "Reading" && (
                  <>
                    <div className="diag-reading-toolbar">
                      <button
                        className="diag-secondary md:hidden"
                        onClick={() =>
                          setReadingPane(
                            readingPane === "passage" ? "questions" : "passage",
                          )
                        }
                      >
                        {readingPane === "passage"
                          ? "Xem câu hỏi"
                          : "Xem bài đọc"}
                      </button>
                    </div>
                    <div
                      className={`diag-passage diag-scroll ${readingPane === "questions" ? "mobile-hidden" : ""}`}
                      style={{ width: `${split}%`, fontSize }}
                      onScroll={(e) => {
                        const top = e.currentTarget.scrollTop;
                        updateWorkspace((w) => ({
                          ...w,
                          scroll: { ...w.scroll, passage: top },
                        }));
                      }}
                      ref={(el) => {
                        if (
                          el &&
                          el.scrollTop === 0 &&
                          workspace.scroll.passage
                        )
                          el.scrollTop = workspace.scroll.passage;
                      }}
                    >
                      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-brand">
                        Reading
                      </h2>
                      <h3 className="mb-6 text-2xl font-bold text-brand">
                        {paper.title}
                      </h3>
                      {paper.passage.map((p, i) => {
                        const q = headingQuestion(i);
                        return (
                          <section
                            id={`passage-${"ABCDEF"[i]}`}
                            key={p}
                            className="diag-reading-paragraph"
                          >
                            <div
                              className="diag-heading-drop"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() =>
                                q && assignHeading(q.id, dragHeading)
                              }
                              onClick={() =>
                                q &&
                                dragHeading &&
                                assignHeading(q.id, dragHeading)
                              }
                            >
                              <b>{"ABCDEF"[i]}</b>
                              <span>
                                {q && answers[q.id] ? (
                                  <>
                                    <strong>{answers[q.id]}.</strong>{" "}
                                    {
                                      q.options.find(
                                        (o) => o.value === answers[q.id],
                                      )?.label
                                    }
                                  </>
                                ) : (
                                  "Kéo heading vào đây"
                                )}
                              </span>
                              {q && answers[q.id] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    answer(q.id, "");
                                  }}
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            <p className="leading-[1.85]">
                              {text(`R-passage-${i}`, p)}
                            </p>
                          </section>
                        );
                      })}
                    </div>
                    <div
                      className="diag-reading-divider"
                      role="separator"
                      aria-label="Điều chỉnh độ rộng bài đọc"
                      aria-orientation="vertical"
                      tabIndex={0}
                      onPointerDown={(e) => {
                        const divider = e.currentTarget,
                          parent = divider.parentElement;
                        if (!parent) return;
                        divider.setPointerCapture(e.pointerId);
                        const move = (event: PointerEvent) => {
                          const rect = parent.getBoundingClientRect();
                          setSplit(
                            Math.min(
                              65,
                              Math.max(
                                35,
                                ((event.clientX - rect.left) / rect.width) *
                                  100,
                              ),
                            ),
                          );
                        };
                        const stop = () => {
                          divider.removeEventListener("pointermove", move);
                          divider.removeEventListener("pointerup", stop);
                        };
                        divider.addEventListener("pointermove", move);
                        divider.addEventListener("pointerup", stop);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowLeft")
                          setSplit((v) => Math.max(35, v - 2));
                        if (e.key === "ArrowRight")
                          setSplit((v) => Math.min(65, v + 2));
                      }}
                    >
                      <span />
                    </div>
                  </>
                )}
                <div
                  className={`diag-questions diag-scroll ${s === "Reading" && readingPane === "passage" ? "mobile-hidden" : ""}`}
                  style={{ fontSize, ...(s === "Reading" ? { flex: 1 } : {}) }}
                  onScroll={(e) => {
                    const top = e.currentTarget.scrollTop;
                    updateWorkspace((w) => ({
                      ...w,
                      scroll: { ...w.scroll, [s]: top },
                    }));
                  }}
                  ref={(el) => {
                    if (el && el.scrollTop === 0 && workspace.scroll[s])
                      el.scrollTop = workspace.scroll[s];
                  }}
                >
                  <h2 className="diag-section-heading">{s}</h2>
                  {s === "Listening" && (
                    <div className="diag-part-tabs">
                      <button
                        className={listeningPart === 1 ? "active" : ""}
                        onClick={() => setListeningPart(1)}
                      >
                        Part 1 <span>1–10</span>
                      </button>
                      <button
                        className={listeningPart === 2 ? "active" : ""}
                        onClick={() => setListeningPart(2)}
                      >
                        Part 2 <span>11–20</span>
                      </button>
                    </div>
                  )}
                  {s === "Reading" && (
                    <div className="diag-heading-bank">
                      <h3>List of headings</h3>
                      <p>Kéo heading vào khoảng trống phía trên đoạn A–F.</p>
                      <div>
                        {headingQuestion(0)
                          ?.options.filter(
                            (o) => !assignedHeadings.has(o.value),
                          )
                          .map((o) => (
                            <button
                              draggable
                              onDragStart={() => setDragHeading(o.value)}
                              onClick={() => setDragHeading(o.value)}
                              key={o.value}
                              className={
                                dragHeading === o.value ? "selected" : ""
                              }
                            >
                              <b>{o.value}.</b> {o.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  {s === "Reading" &&
                    (() => {
                      const matching = paper.questions.filter(
                          (q) => q.id >= "R07" && q.id <= "R10",
                        ),
                        options = matching[0]?.options ?? [];
                      return (
                        <div className="diag-drag-matching diag-reading-matching">
                          <div className="diag-drag-tasks">
                            <h3>Questions 7–10</h3>
                            <p>
                              Match each statement with the correct person A–E.
                            </p>
                            {matching.map((q) => (
                              <div className="diag-drag-row" key={q.id}>
                                <span>{q.prompt}</span>
                                <button
                                  type="button"
                                  draggable={!!answers[q.id]}
                                  className={answers[q.id] ? "filled" : ""}
                                  onDragStart={() => {
                                    if (answers[q.id]) {
                                      setDragOption(answers[q.id]);
                                      setDragAnswerId(q.id);
                                    }
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => {
                                    if (dragOption) answer(q.id, dragOption);
                                    setDragAnswerId("");
                                    setDragOption("");
                                  }}
                                  onClick={() => {
                                    if (dragOption) {
                                      answer(q.id, dragOption);
                                      setDragOption("");
                                    }
                                  }}
                                >
                                  <b>{q.id.slice(1)}</b>
                                  {answers[q.id] && (
                                    <em>
                                      {
                                        options.find(
                                          (o) => o.value === answers[q.id],
                                        )?.label
                                      }
                                    </em>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Đánh dấu xem lại ${q.id}`}
                                  onClick={() => mark(q.id)}
                                  className="diag-drag-bookmark"
                                >
                                  <Bookmark
                                    size={18}
                                    fill={
                                      workspace.bookmarks.includes(q.id)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                          <aside
                            className="diag-drag-options"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragAnswerId) answer(dragAnswerId, "");
                              setDragAnswerId("");
                              setDragOption("");
                            }}
                          >
                            <h3>List of options</h3>
                            {options.map((o) => (
                              <button
                                type="button"
                                draggable
                                key={o.value}
                                className={
                                  dragOption === o.value ? "selected" : ""
                                }
                                onDragStart={() => {
                                  setDragAnswerId("");
                                  setDragOption(o.value);
                                }}
                                onClick={() => {
                                  setDragAnswerId("");
                                  setDragOption(o.value);
                                }}
                              >
                                <b>{o.value}.</b> {o.label}
                              </button>
                            ))}
                          </aside>
                        </div>
                      );
                    })()}
                  {s === "Grammar" && (
                    <p className="diag-instruction">
                      Chọn một đáp án đúng nhất. Với câu có hai chỗ trống, một
                      lựa chọn áp dụng cho cả hai.
                    </p>
                  )}
                  {s === "Listening" &&
                    listeningPart === 2 &&
                    (() => {
                      const matching = paper.questions.filter(
                          (q) => q.id >= "L13" && q.id <= "L16",
                        ),
                        options = matching[0]?.options ?? [];
                      return (
                        <div className="diag-drag-matching">
                          <div className="diag-drag-tasks">
                            <h3>Questions 13–16</h3>
                            <p>Who will do each task?</p>
                            {matching.map((q) => (
                              <div className="diag-drag-row" key={q.id}>
                                <span>{q.prompt}</span>
                                <button
                                  type="button"
                                  draggable={!!answers[q.id]}
                                  className={answers[q.id] ? "filled" : ""}
                                  onDragStart={() => {
                                    if (answers[q.id]) {
                                      setDragOption(answers[q.id]);
                                      setDragAnswerId(q.id);
                                    }
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => {
                                    if (dragOption) answer(q.id, dragOption);
                                    setDragAnswerId("");
                                    setDragOption("");
                                  }}
                                  onClick={() => {
                                    if (dragOption) {
                                      answer(q.id, dragOption);
                                      setDragOption("");
                                    }
                                  }}
                                >
                                  <b>{q.id.slice(1)}</b>
                                  {answers[q.id] && (
                                    <em>
                                      {
                                        options.find(
                                          (o) => o.value === answers[q.id],
                                        )?.label
                                      }
                                    </em>
                                  )}
                                </button>
                                <button
                                  aria-label={`Đánh dấu xem lại ${q.id}`}
                                  onClick={() => mark(q.id)}
                                  className="diag-drag-bookmark"
                                >
                                  <Bookmark
                                    size={18}
                                    fill={
                                      workspace.bookmarks.includes(q.id)
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                          <aside
                            className="diag-drag-options"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragAnswerId) answer(dragAnswerId, "");
                              setDragAnswerId("");
                              setDragOption("");
                            }}
                          >
                            <h3>List of options</h3>
                            {options.map((o) => (
                              <button
                                draggable
                                key={o.value}
                                className={
                                  dragOption === o.value ? "selected" : ""
                                }
                                onDragStart={() => {
                                  setDragAnswerId("");
                                  setDragOption(o.value);
                                }}
                                onClick={() => {
                                  setDragAnswerId("");
                                  setDragOption(o.value);
                                }}
                              >
                                <b>{o.value}.</b> {o.label}
                              </button>
                            ))}
                          </aside>
                        </div>
                      );
                    })()}
                  {visibleQuestions(s)
                    .filter(
                      (q) =>
                        !(
                          s === "Listening" &&
                          q.id >= "L13" &&
                          q.id <= "L16"
                        ) &&
                        !(s === "Reading" && q.id >= "R07" && q.id <= "R10"),
                    )
                    .map((q) => (
                      <div key={q.id}>
                        {q.id === "L01" && (
                          <div className="diag-listening-part">
                            <h2>Part 1 · Hotel Reservation · L01–L10</h2>
                            <AudioPlayer
                              id={paper.audio[0]}
                              index={0}
                              initial={workspace.audio[0]}
                              done={workspace.audioDone[0]}
                              review={false}
                              disabled={locked}
                              onReady={audioReady}
                              onProgress={audioProgress}
                              onIssue={audioIssue}
                            />
                            <p>
                              Complete the notes. Write ONE WORD AND/OR A NUMBER
                              for each answer.
                            </p>
                            <p>Example: Location: north from the coast.</p>
                          </div>
                        )}
                        {q.id === "L11" && (
                          <div className="diag-listening-part">
                            <h2>Part 2 · Research Project · L11–L20</h2>
                            <AudioPlayer
                              id={paper.audio[1]}
                              index={1}
                              initial={workspace.audio[1]}
                              done={workspace.audioDone[1]}
                              review={false}
                              disabled={locked}
                              onReady={audioReady}
                              onProgress={audioProgress}
                              onIssue={audioIssue}
                            />
                            <p>
                              Harry and Katy are concentrating on coastal
                              change. They plan to get help from the Marine
                              Biology Unit.
                            </p>
                            <p>Write NO MORE THAN TWO WORDS for each answer.</p>
                          </div>
                        )}
                        {q.id === "L13" && (
                          <p className="diag-instruction">
                            L13–L16 · Who will do each task? A: Katy · B: Harry
                            · C: Both Katy and Harry. You may use each option
                            more than once.
                          </p>
                        )}
                        {q.id === "L17" && (
                          <p className="diag-instruction">
                            L17–L20 · Choose the correct letter, A, B or C.
                          </p>
                        )}
                        {q.id === "R07" && (
                          <div className="diag-instruction">
                            <h2>R07–R10 · Matching Features</h2>
                            <p>
                              Match each statement with the correct person A–E.
                            </p>
                            {q.options.map((o) => (
                              <p key={o.value}>
                                {text(
                                  "R-person-" + o.value,
                                  o.value + ". " + o.label,
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                        {q.id === "R11" && (
                          <div className="diag-instruction">
                            <h2>R11–R13 · Film Festivals</h2>
                            <p>
                              Choose NO MORE THAN TWO WORDS AND A NUMBER from
                              the passage for each answer.
                            </p>
                            <p>
                              There are many festivals for documentary makers.
                              Canada’s Hot Docs festival has screened
                              documentaries from more than 50 countries.
                            </p>
                          </div>
                        )}
                        {field(q)}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </fieldset>
          <footer className="diag-question-nav">
            <div className="diag-nav-summary">
              <span>
                {totalAnswered}/53 câu đã trả lời · {workspace.bookmarks.length}{" "}
                câu xem lại
              </span>
              <span>
                <i className="diag-legend-answered" /> Đã trả lời{" "}
                <i className="diag-legend-review" /> Xem lại
              </span>
            </div>
            <div className="diag-section-navigator">
              <button
                className="diag-nav-arrow"
                aria-label="Phần trước"
                disabled={workspace.section === "Listening"}
                onClick={() =>
                  updateWorkspace((w) => ({
                    ...w,
                    section: sections[sections.indexOf(w.section) - 1],
                  }))
                }
              >
                <ChevronLeft size={20} />
              </button>
              <div className="diag-nav-sections">
                {sections.map((s) => (
                  <section
                    key={s}
                    className={workspace.section === s ? "is-open" : ""}
                  >
                    <button
                      className="diag-nav-section-title"
                      onClick={() =>
                        updateWorkspace((w) => ({ ...w, section: s }))
                      }
                    >
                      <span>{s}</span>
                      <span>
                        {
                          paper.questions.filter(
                            (q) => q.section === s && answers[q.id]?.trim(),
                          ).length
                        }
                        /{totals[s]}
                      </span>
                    </button>
                    {workspace.section === s && (
                      <div className="diag-nav-numbers">
                        {paper.questions
                          .filter((q) => q.section === s)
                          .map((q) => (
                            <button
                              key={q.id}
                              title={`${q.id}: ${answers[q.id]?.trim() ? "Đã trả lời" : "Chưa trả lời"}${workspace.bookmarks.includes(q.id) ? ", đánh dấu xem lại" : ""}`}
                              aria-current={
                                activeQuestion === q.id ? "true" : undefined
                              }
                              className={`diag-number ${answers[q.id]?.trim() ? "answered" : ""} ${workspace.bookmarks.includes(q.id) ? "review" : ""} ${activeQuestion === q.id ? "current" : ""}`}
                              onClick={() => jump(q.id)}
                            >
                              {q.id.slice(1)}
                            </button>
                          ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
              <button
                className="diag-nav-arrow"
                aria-label="Phần tiếp theo"
                disabled={workspace.section === "Grammar"}
                onClick={() =>
                  updateWorkspace((w) => ({
                    ...w,
                    section: sections[sections.indexOf(w.section) + 1],
                  }))
                }
              >
                <ChevronRight size={20} />
              </button>
              <button
                className="diag-submit"
                disabled={locked}
                onClick={() => setSubmitDialog(true)}
                aria-label="Nộp bài"
                title="Nộp bài"
              >
                <Check size={26} strokeWidth={2.4} />
              </button>
            </div>
          </footer>
          {selection && (
            <button
              style={{
                position: "fixed",
                left: selection.x,
                top: selection.y,
                zIndex: 100,
              }}
              className={`diag-selection-action ${selectedHighlight ? "remove" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={selectedHighlight ? removeSelectedHighlight : highlight}
            >
              {selectedHighlight ? "Xóa highlight" : "Tô màu"}
            </button>
          )}
          {submitDialog && (
            <div className="diag-modal">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Xác nhận nộp bài"
                className="diag-panel max-w-lg"
              >
                <h2 className="text-2xl font-bold text-brand">
                  Bạn muốn nộp bài?
                </h2>
                <div className="my-5 space-y-2">
                  {sections.map((s) => (
                    <p key={s}>
                      {s}:{" "}
                      {
                        paper.questions.filter(
                          (q) => q.section === s && answers[q.id]?.trim(),
                        ).length
                      }
                      /{totals[s]} câu đã trả lời
                    </p>
                  ))}
                  <p>
                    Còn {53 - totalAnswered} câu chưa trả lời và{" "}
                    {workspace.bookmarks.length} câu đánh dấu xem lại.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    autoFocus
                    className="diag-secondary"
                    onClick={() => setSubmitDialog(false)}
                  >
                    Quay lại kiểm tra
                  </button>
                  <button
                    className="diag-primary"
                    onClick={() => {
                      pendingSubmit.current = true;
                      void sync.current(true);
                    }}
                  >
                    Xác nhận nộp bài
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {stage === "result" && session?.result && paper && (
        <div className="diag-results">
          <div className="diag-score-panel">
            <div className="mb-5 flex items-center gap-2 text-leaf">
              <Target size={15} />
              <span className="text-xs font-semibold">Kết quả bài làm</span>
            </div>
            <p className="text-xl font-semibold text-white">
              {session.profile.name}, đây là kết quả của bạn.
            </p>
            <p className="mt-2 text-xs text-white/55">
              {new Date(session.startedAt).toLocaleString("vi-VN")} ·{" "}
              {session.autoSubmitted
                ? "Bài đã được tự động nộp khi hết giờ."
                : "Đã nộp bài."}
            </p>
            <div className="my-7 grid grid-cols-3 divide-x divide-white/15">
              {sections.map((s) => (
                <div className="px-2 text-center" key={s}>
                  <p className="text-xs font-semibold text-white/55">{s}</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-white md:text-4xl">
                    {session.result!.scores[s]}
                    <span className="text-base text-white/35">
                      /{totals[s]}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-white/65">
              Đánh giá sơ bộ theo các câu trong bài, chưa bao gồm Writing và
              Speaking. Không quy đổi trực tiếp thành IELTS Overall.{" "}
              {session.result.blanks > 0 &&
                `${session.result.blanks} câu chưa trả lời.`}
            </p>
          </div>
          {notice && (
            <p role="alert" className="diag-notice">
              {notice}
            </p>
          )}
          <div className="my-6 flex flex-wrap gap-2 print:hidden">
            {(["report", "answers", "plan"] as const).map((t, i) => (
              <button
                key={t}
                className={`diag-tab ${resultTab === t ? "active" : ""}`}
                onClick={() => setResultTab(t)}
              >
                {
                  ["Nhận xét chi tiết", "Đáp án & lời giải", "Kế hoạch 4 tuần"][
                    i
                  ]
                }
              </button>
            ))}
            <button
              className="diag-secondary"
              onClick={() => {
                const report = session.result!;
                const lines = [
                  "KẾT QUẢ KIỂM TRA NỀN TẢNG IELTS",
                  session.profile.name,
                  new Date(session.startedAt).toLocaleString("vi-VN"),
                  "Đánh giá sơ bộ, không quy đổi thành IELTS Overall.",
                  ...sections.map(
                    (s) => s + ": " + report.scores[s] + "/" + totals[s],
                  ),
                  ...report.areas.map(
                    (a) =>
                      a.name +
                      " — " +
                      a.correct +
                      "/" +
                      a.total +
                      "\n" +
                      a.feedback +
                      "\n" +
                      a.review.map((q) => q.id + ": " + q.text).join("\n"),
                  ),
                  "KẾ HOẠCH TỰ HỌC 4 TUẦN",
                  ...Array.from(
                    document.querySelectorAll("[data-study-plan] section"),
                  ).map((s) =>
                    [
                      s.querySelector("h3")?.textContent,
                      ...Array.from(s.querySelectorAll("article")).map((a) =>
                        Array.from(a.querySelectorAll("label,p,li"))
                          .map((e) => e.textContent)
                          .join("\n"),
                      ),
                    ].join("\n\n"),
                  ),
                ];
                const blob = new Blob(["\uFEFF" + lines.join("\n\n")], {
                  type: "text/plain;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "bao-cao-va-ke-hoach-ielts.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Tải báo cáo & kế hoạch
            </button>
            <button className="diag-secondary" onClick={() => window.print()}>
              In / lưu PDF
            </button>
            <button
              className="diag-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${location.origin}/kiem-tra-nen-tang-ielts#result=${token.current}`,
                  );
                  setNotice(
                    "Đã sao chép đường dẫn cá nhân. Người có đường dẫn này có thể xem báo cáo; hãy giữ riêng.",
                  );
                } catch {
                  setNotice(
                    "Không sao chép được. Hãy cho phép truy cập clipboard rồi thử lại.",
                  );
                }
              }}
            >
              Lưu đường dẫn cá nhân
            </button>
            <button
              className="diag-secondary"
              onClick={() => setResetPrompt(true)}
            >
              Làm lượt mới
            </button>
          </div>
          {
            <div className={resultTab === "report" ? "" : "diag-print-only"}>
              <h2 className="mb-5 text-2xl font-bold text-brand">
                {session.result.areas.some((a) => a.level === 0)
                  ? "Điểm mạnh & nội dung cần cải thiện"
                  : "Điểm mạnh & nội dung nên củng cố"}
              </h2>
              {!session.result.areas.some((a) => a.level === 2) && (
                <p className="mb-4">
                  Chưa có nhóm ở mức Tốt. Bạn có thể bắt đầu từ nhóm có kết quả
                  cao nhất và củng cố từng nội dung bên dưới.
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {session.result.areas.map((a) => (
                  <article className="diag-panel" key={a.id}>
                    <p className="text-xs font-semibold text-brand">
                      {a.section} · {names[2 - a.level]}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{a.name}</h3>
                    <p className="my-3 font-mono text-xl text-brand">
                      {a.correct}/{a.total}
                    </p>
                    <p className="text-sm leading-relaxed text-ink/75">
                      {a.feedback}
                    </p>
                    {a.id === "R_VOCABULARY_OVERALL" && (
                      <p className="mt-2 text-xs">
                        Nhận xét suy ra từ toàn bộ bài Reading, không phải điểm
                        từ vựng độc lập.
                      </p>
                    )}
                    {a.review.length > 0 && (
                      <details className="mt-4 text-sm">
                        <summary className="cursor-pointer text-brand">
                          {a.review.filter((q) => q.blank).length} câu chưa trả
                          lời · Nội dung xem lại
                        </summary>
                        <ul className="mt-2 space-y-2">
                          {a.review.map((q) => (
                            <li key={q.id}>
                              <b>{q.id}</b>: {q.text}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            </div>
          }
          {resultTab === "answers" && (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                {sections.map((s) => (
                  <button
                    key={s}
                    className={`diag-tab ${reviewSection === s ? "active" : ""}`}
                    onClick={() => setReviewSection(s)}
                  >
                    {s}
                  </button>
                ))}
                <select
                  aria-label="Lọc câu trả lời"
                  className="diag-input !w-auto"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="wrong">Câu sai</option>
                  <option value="blank">Chưa trả lời</option>
                </select>
              </div>
              {reviewSection === "Listening" && (
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  {paper.audio.map((id, i) => (
                    <AudioPlayer
                      key={id}
                      id={id}
                      index={i}
                      initial={0}
                      done={false}
                      review
                      disabled={false}
                      onReady={() => {}}
                      onProgress={() => {}}
                      onIssue={() => {}}
                    />
                  ))}
                </div>
              )}
              {session.result.items
                .filter(
                  (q) =>
                    q.section === reviewSection &&
                    (filter === "all" ||
                      (filter === "wrong" && !!q.answer && !q.correct) ||
                      (filter === "blank" && !q.answer)),
                )
                .map((q) => (
                  <article className="diag-panel mb-4" key={q.id}>
                    <h3 className="font-semibold">
                      {q.id} · {q.prompt}
                    </h3>
                    {q.options.length > 0 && (
                      <p className="my-3 text-sm text-ink/65">
                        {q.options
                          .map((o) => `${o.value}. ${o.label}`)
                          .join(" · ")}
                      </p>
                    )}
                    <p
                      className={`mt-3 text-sm ${q.correct ? "text-brand" : "text-red-800"}`}
                    >
                      {q.correct ? "✓ Đúng" : q.answer ? "Sai" : "Chưa trả lời"}{" "}
                      · Câu trả lời: {q.answer || "—"} · Đáp án đúng:{" "}
                      <b>{q.expected}</b>
                    </p>
                    <p className="mt-3 text-sm leading-relaxed">
                      {q.explanation}
                    </p>
                    {q.evidence && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-brand">
                          Xem căn cứ trong bài · Đoạn {q.evidence}
                        </summary>
                        <p className="mt-3 text-sm leading-loose">
                          {paper.passage["ABCDEF".indexOf(q.evidence)]}
                        </p>
                      </details>
                    )}
                  </article>
                ))}
            </>
          )}
          {
            <div className={resultTab === "plan" ? "" : "diag-print-only"}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-brand">
                  Kế hoạch tự học 4 tuần
                </h2>
              </div>
              <StudyPlan
                report={session.result}
                profile={profile}
                progress={session.progress}
                onProgress={(progress) => {
                  setSession((s) => (s ? { ...s, progress } : s));
                  void api("progress", { progress }).catch(() =>
                    setNotice(
                      "Chưa lưu được tiến độ kế hoạch. Kiểm tra kết nối rồi đánh dấu lại.",
                    ),
                  );
                }}
              />
            </div>
          }
          <div className="mt-10 border-t border-brand/15 pt-8">
            <h2 className="text-xl font-bold text-brand">
              Cùng tìm lộ trình phù hợp với bạn
            </h2>
            <p className="mt-3 text-ink/70">
              Trao đổi với cô Thương về kết quả và cách học phù hợp với mục tiêu
              của bạn.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/tu-van" className="diag-primary">
                Đăng ký tư vấn lộ trình
              </Link>
              <Link href="/phuong-phap" className="diag-secondary">
                Tìm hiểu cách học
              </Link>
              <Link href="/gioi-thieu" className="diag-secondary">
                Về Thương Hồ’s Class
              </Link>
            </div>
          </div>
        </div>
      )}
      {resetPrompt && (
        <div className="diag-modal">
          <div
            className="diag-panel max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Bắt đầu lượt mới"
          >
            <h2 className="text-xl font-bold text-brand">Bắt đầu lượt mới?</h2>
            <p className="my-5">
              Hãy lưu báo cáo hoặc đường dẫn cá nhân để có thể xem lại kết quả
              cũ.
            </p>
            <div className="flex gap-3">
              <button
                className="diag-secondary"
                autoFocus
                onClick={() => setResetPrompt(false)}
              >
                Quay lại lưu báo cáo
              </button>
              <button className="diag-primary" onClick={newAttempt}>
                Bắt đầu lượt mới
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
