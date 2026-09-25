"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Clock3,
  Headphones,
  Loader2,
  BookOpen,
  PenLine,
  Settings,
  X,
} from "lucide-react";
import type {
  Tab,
  WritingState,
  Paper,
  Profile,
  Question,
  Section,
  Session,
  Workspace,
} from "../types";
import {
  WRITING_TASK as writingTask,
  countWords,
} from "@thuong-ielts/diagnostic";
import HighlightableText from "../../practice/ui/HighlightableText";
import ExamQuestionNavigator from "../../practice/ui/ExamQuestionNavigator";
import AudioPlayer from "./AudioPlayer";
import BusyOverlay from "../../../components/BusyOverlay";
import WritingReport from "./WritingReport";
import StudyPlan from "./StudyPlan";
import Roadmap from "./Roadmap";
import Verdict from "./Verdict";
import { buildRoadmap, roadmapToText } from "../domain/roadmap";
import { buildVerdict, verdictToText } from "../domain/verdict";
import {
  DAILY_MINUTES,
  EXAM_TIMINGS,
  LEVELS,
  NEEDS_MONTH,
  NEEDS_SCORE,
  PURPOSES,
  TARGETS,
  emptyProfile,
} from "../domain/profile";
import "./diagnostic.css";

const sections: Section[] = ["Listening", "Reading", "Grammar"];
/*
  Thanh điều hướng có bốn mục, nhưng CHẤM ĐIỂM vẫn chỉ có ba.

  `Section` là đơn vị của `scores`, của nhóm nội dung và của phần xem lại —
  nhét "Writing" vào đó là mọi chỗ cộng điểm phải xử lý một phần không có câu
  hỏi nào. Nên Writing chỉ là một TAB, và `sections` giữ nguyên nghĩa cũ.
*/
const tabs: Tab[] = [...sections, "Writing"];
/*
  Highlight lưu theo `blockId`, mà blockId luôn bắt đầu bằng mã câu (L01, R07,
  G13) hoặc `R-passage-…`. Chữ cái đầu đủ để biết vệt highlight thuộc phần nào,
  không cần lưu thêm trường mới vào workspace.
*/
const blockSection = (blockId: string): Section | null =>
  blockId.startsWith("L")
    ? "Listening"
    : blockId.startsWith("R")
      ? "Reading"
      : blockId.startsWith("G")
        ? "Grammar"
        : null;
/*
  Mở lớp phủ thì focus vào chính hộp thoại, không vào nút bên trong: `autoFocus`
  trên nút làm trình duyệt cuộn lớp phủ xuống tới nút, và trên màn thấp thì
  tiêu đề bị đẩy khỏi tầm nhìn (đo được scrollTop 111px, đỉnh hộp ở -92px).
  React không áp `autoFocus` cho <div>, nên phải gọi tay qua ref.
*/
const DIALOG_STOPS =
  'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/*
  …và GIAM Tab lại trong hộp thoại.

  Đo được trước khi sửa: hộp "Đã có lượt làm trước đó" có đúng hai điểm dừng,
  đứng ở nút cuối bấm Tab MỘT cú là focus rơi ra logo trang — tức lớp phủ khai
  `aria-modal="true"` nhưng 20 điểm dừng phía sau vẫn vào được. Người dùng bàn
  phím bị đẩy ra sau một lớp mờ họ không đóng được, đúng lỗi đã sửa cho hộp
  thoại kết quả Writing mà ba hộp ở đây bị bỏ sót.

  Đặt ở ref callback để cả ba hộp thoại dùng chung một bản: React 19 cho phép
  ref callback trả về hàm dọn dẹp, nên gỡ listener không cần thêm effect.
*/
const focusDialog = (el: HTMLDivElement | null) => {
  if (!el) return;
  if (!el.contains(document.activeElement)) el.focus();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const stops = Array.from(
      el.querySelectorAll<HTMLElement>(DIALOG_STOPS),
    ).filter((node) => node.offsetParent !== null);
    /* Hộp chỉ có chữ thì giữ focus ở chính nó, đừng thả ra ngoài. */
    if (!stops.length) {
      event.preventDefault();
      el.focus();
      return;
    }
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === el)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  el.addEventListener("keydown", onKeyDown);
  return () => el.removeEventListener("keydown", onKeyDown);
};
const clock = (n: number) =>
  `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
const totals = { Listening: 20, Reading: 13, Grammar: 20 };
const totalQuestions = Object.values(totals).reduce((sum, total) => sum + total, 0);
const names = ["Tốt", "Khá", "Cần cải thiện"];

function getOverallAssessment(scores: Record<Section, number>) {
  const score = sections.reduce((sum, section) => sum + scores[section], 0);
  const percentage = Math.round((score / totalQuestions) * 100);

  if (percentage < 40) {
    return {
      score,
      percentage,
      level: "Yếu",
      description: "Cần xây nền lại trước khi bắt đầu học IELTS.",
    };
  }

  if (percentage < 70) {
    return {
      score,
      percentage,
      level: "Trung bình",
      description:
        "Có thể học lớp IELTS nền tảng nhưng vẫn cần tiếp tục củng cố Vocabulary, Grammar, Reading và Listening.",
    };
  }

  return {
    score,
    percentage,
    level: "Khá tốt",
    description: "Nền vững, sẵn sàng học lớp IELTS nền tảng.",
  };
}
const emptyWorkspace: Workspace = {
  bookmarks: [],
  highlights: [],
  section: "Listening",
  audio: [0, 0],
  audioDone: [false, false],
  scroll: {},
  issues: [],
};
const initialProfile: Profile = emptyProfile;
const STORAGE = "thuong-diagnostic-v1";
/*
  Token của lượt đã nộp gần nhất trên thiết bị này, giữ tách khỏi bản nháp.
  Bản nháp (STORAGE) bị xoá mỗi khi bắt đầu lượt mới; nếu chỉ dựa vào nó thì
  bấm "Làm lượt mới" rồi F5 là kết quả cũ biến mất khỏi máy, không còn đường
  quay lại. Con trỏ này sống lâu hơn, nên hộp thoại chọn lượt hiện lại được.
*/
const DONE = STORAGE + "-last";
const isLocalDemo = process.env.NODE_ENV === "development";
type Draft = {
  token: string;
  answers: Record<string, string>;
  workspace: Workspace;
  /* Thiếu ở bản nháp cũ nên có thể không có; đọc ra thì coi như rỗng. */
  essay?: string;
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
  const [essay, setEssay] = useState(""),
    [remaining, setRemaining] = useState(3600),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [saveStatus, setSaveStatus] = useState("Đã lưu");
  const [ready, setReady] = useState([false, false]),
    [heard, setHeard] = useState(false),
    /* Tăng lên một là dựng lại thẻ <audio>; xem `retryAudio`. */
    [audioAttempt, setAudioAttempt] = useState(0),
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
  /*
    Lượt cũ ĐÃ NỘP tìm thấy trên thiết bị: hỏi trước khi mở, thay vì nhảy thẳng
    vào bảng kết quả của lần trước. Chỉ hỏi ở đúng trường hợp đó — bài đang làm
    dở phải vào tiếp không hỏi han (đặc tả §13: mở lại trước hạn thì tiếp tục
    với thời gian còn lại), còn vào bằng đường dẫn cá nhân thì ý định đã rõ.
  */
  const [oldAttempt, setOldAttempt] = useState<Session | null>(null);
  /*
    Đang hỏi server xem lượt cũ đó đã nộp chưa — chưa biết thì CHƯA cho bắt đầu.

    Hộp thoại "Bạn đã làm bài này rồi" chỉ dựng được sau HAI request nối tiếp:
    tải đề, rồi `resume` theo token. Nút "Bắt đầu kiểm tra" trước đây chỉ khoá
    theo `paper`, tức mở ngay sau request thứ nhất — có một khoảng học sinh bấm
    được vào bài trong khi hộp thoại còn đang trên đường về, rồi nó đổ ập lên
    màn hình khi người ta đã đi tiếp. Đo được trên máy dev, mạng thật còn rộng
    khoảng đó hơn.

    Chỉ bật cờ khi thiết bị CÓ token cũ. Người mới hoàn toàn thì không có gì để
    chờ, và bắt họ đợi một request không liên quan là tự làm chậm trang.
  */
  const [resuming, setResuming] = useState(false);
  const token = useRef(""),
    editor = useRef(""),
    draftLoaded = useRef(false),
    dirty = useRef(false),
    sending = useRef(false),
    deadline = useRef(0),
    pendingSubmit = useRef(false),
    lastWarn = useRef(0);
  const progressState = useRef<Record<string, boolean>>({});
  const essayWords = countWords(essay);
  /** Chưa có đề, hoặc chưa biết lượt cũ đã nộp chưa — hai thứ đều chặn vào bài. */
  const loading = !paper || resuming;
  const [writing, setWriting] = useState<WritingState | null>(null),
    [gradingWriting, setGradingWriting] = useState(false);
  const latest = useRef({ answers, workspace, stage, profile, essay });
  latest.current = { answers, workspace, stage, profile, essay };
  /*
    Đổi màn thì kéo về đầu trang. Các màn cao thấp rất khác nhau: bảng kết quả
    dài gấp đôi màn giới thiệu, nên bấm "Bắt đầu lượt mới" ở cuối bảng điểm là
    rơi xuống chân màn giới thiệu — đo được nút "Bắt đầu kiểm tra" nằm ở top
    -159px, tức học sinh nhìn thấy một trang trống và tưởng hỏng.
    `window.scrollTo` vẫn ăn khi Lenis đang chạy (đã đo), không cần chạm vào
    instance Lenis nằm trong ClientShell.
  */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);
  const local = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          token: token.current,
          answers: latest.current.answers,
          workspace: latest.current.workspace,
          /*
            Bài viết phải nằm trong bản nháp như đáp án.
            Thiếu nó thì mất mạng rồi tải lại trang là mất đoạn vừa gõ, trong
            khi đáp án trắc nghiệm vẫn còn — đo được: gõ một câu rồi F5 ngay,
            câu đó biến mất còn các ô đáp án thì không.
          */
          essay: latest.current.essay,
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
    /*
      Server luôn trả về token của lượt nó vừa tra/ tạo. Nhận lại token đó thay
      vì tin vào token phía client: nếu hai bên lệch nhau thì lời gọi kế tiếp
      tra không ra hàng và trả 404 — đúng lỗi đã gặp ở nút demo.
    */
    if (/^[a-f0-9]{64}$/.test(data.token ?? "")) token.current = data.token;
    return data as Session & { token: string };
  }
  function rememberDone() {
    try {
      if (token.current) localStorage.setItem(DONE, token.current);
    } catch {
      /* Hết chỗ lưu thì chỉ mất lối tắt, kết quả vẫn nguyên trên server. */
    }
  }
  function apply(data: Session) {
    progressState.current = data.progress ?? {};
    setEssay(data.essay ?? "");
    setWriting(data.writing ?? null);
    setSession(data);
    setPaper(data.paper);
    setProfile(data.profile);
    deadline.current = performance.now() + data.remaining * 1000;
    setRemaining(Math.ceil(data.remaining));
    if (data.submittedAt) {
      setStage("result");
      pendingSubmit.current = false;
      rememberDone();
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
        essay: current.essay,
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
        const done = localStorage.getItem(DONE) ?? "";
        token.current = /^[a-f0-9]{64}$/.test(linkToken)
          ? linkToken
          : /^[a-f0-9]{64}$/.test(draft?.token ?? "")
            ? draft!.token
            : /* Không còn nháp thì dò lại lượt đã nộp gần nhất để hỏi. */
              /^[a-f0-9]{64}$/.test(done)
              ? done
              : "";
        const savedProfile = localStorage.getItem(STORAGE + "-profile");
        if (savedProfile) setProfile(JSON.parse(savedProfile));
        if (token.current) {
          setResuming(true);
          const data = await api("resume").finally(() => {
            if (!cancelled) setResuming(false);
          });
          if (cancelled) return;
          const useDraft =
            draft?.token === token.current && draft?.dirty && !data.submittedAt;
          setAnswers(useDraft ? draft!.answers : data.answers);
          setEssay(useDraft ? (draft!.essay ?? "") : (data.essay ?? ""));
          setWorkspace({
            ...emptyWorkspace,
            ...(useDraft ? draft!.workspace : data.workspace),
          });
          dirty.current = !!useDraft;
          if (data.submittedAt && !linkToken) {
            rememberDone();
            setOldAttempt(data);
          } else apply(data);
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
  /*
    Ghi bản nháp mỗi khi bài làm đổi. `essay` phải nằm trong danh sách phụ
    thuộc: thiếu nó thì gõ bài viết không kích hoạt hiệu ứng này, bản nháp đứng
    yên ở lần đổi đáp án gần nhất, và đoạn vừa gõ mất khi tải lại trang.
  */
  useEffect(() => {
    if (!draftLoaded.current) return;
    local();
  }, [answers, workspace, essay, local]);
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
  /*
    Rời phần Listening mà audio còn chạy thì học sinh không thấy player nữa và
    tưởng tiếng đã tắt. Giữ trạng thái phát ở đây để dựng một thanh thu gọn
    trên header — vẫn một thẻ <audio> duy nhất, chỉ là điều khiển từ xa.
  */
  const [clearAsk, setClearAsk] = useState(false);
  const [live, setLive] = useState<{
    index: number;
    current: number;
    duration: number;
  } | null>(null);
  useEffect(() => {
    const onState = (event: Event) => {
      const d = (event as CustomEvent).detail as {
        index: number;
        playing: boolean;
        current: number;
        duration: number;
      };
      setLive((old) =>
        d.playing
          ? { index: d.index, current: d.current, duration: d.duration }
          : old && old.index === d.index
            ? null
            : old,
      );
    };
    window.addEventListener("diagnostic-audio-state", onState);
    return () => window.removeEventListener("diagnostic-audio-state", onState);
  }, []);
  /*
    Tải lại hai bài nghe mà không tải lại trang.

    Drive rớt kết nối khá thường (chú thích trong route proxy đo được cỡ một
    lần hỏng trên hai lần gọi nguội). Hỏng một lần là `ready` kẹt ở false và
    nút "Bắt đầu tính giờ" tắt vĩnh viễn — lối thoát duy nhất trước đây là F5,
    mà F5 ở màn hướng dẫn thì mất cả form vừa điền.

    Đổi `key` của <AudioPlayer> là React tháo thẻ <audio> cũ ra dựng thẻ mới,
    nên trình duyệt xin lại file từ đầu. Đặt lại `ready` về false trước, vì
    thẻ mới sẽ tự bắn `onReady` khi tải xong.
  */
  /*
    Xin điểm phần Writing. Tách khỏi `submit` vì bộ chấm là dịch vụ ngoài, trần
    chờ 25 giây: gộp vào nộp bài là bắt học sinh nhìn màn trắng ngần ấy lâu
    trước khi thấy điểm ba phần trắc nghiệm vốn đã chấm xong từ lâu.

    Server tự bỏ qua nếu đã chấm rồi, nên gọi lại không tốn thêm tiền.
  */
  async function askWritingGrade() {
    if (gradingWriting) return;
    setGradingWriting(true);
    try {
      const data = (await api("grade-writing")) as unknown as {
        writing?: WritingState;
      };
      if (data.writing) setWriting(data.writing);
    } catch {
      /* Hỏng thì giữ nguyên trạng thái cũ; nút "Chấm lại bài viết" vẫn còn đó. */
    } finally {
      setGradingWriting(false);
    }
  }
  /*
    Vào màn kết quả mà chưa có điểm Writing thì hỏi ngay một lần.

    Điều kiện `writing === null` là "chưa gọi lần nào" — đã gọi mà hỏng thì
    server lưu `{kind:"ungraded"}`, và lúc đó phải để học sinh tự bấm chấm lại
    chứ không tự gọi vòng lại: dịch vụ đang hỏng thì gọi lại tự động chỉ tạo ra
    một vòng lặp tốn tiền.
  */
  useEffect(() => {
    if (stage !== "result" || writing !== null || !essay.trim()) return;
    void askWritingGrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, writing, essay]);
  function retryAudio() {
    setReady([false, false]);
    updateWorkspace((w) => (w.issues.length ? { ...w, issues: [] } : w));
    setAudioAttempt((n) => n + 1);
    setMessage("");
  }
  const audioIssue = useCallback((issue: string) => {
    updateWorkspace((w) =>
      w.issues.includes(issue) ? w : { ...w, issues: [...w.issues, issue] },
    );
  }, []);
  /*
    Lộ trình và kế hoạch 4 tuần cùng ghi vào một bản đồ tiến độ, và mỗi lần
    tick là ghi đè cả bản đồ. Nhận vào một ô chứ không nhận cả bản đồ: hai ô
    tick liền nhau trong cùng một nhịp render đều đọc ra `progress` cũ, gửi
    lên thì lần sau xoá mất lần trước. `progressState` giữ bản mới nhất ngay
    trong lúc gọi, không chờ React render lại.
  */
  /*
    Đổi thời lượng tự học: chia lại khối lượng mỗi buổi và co giãn lộ trình,
    KHÔNG đụng tới điểm hay nhận xét — điểm nằm trong `result` đã chấm xong.
  */
  function setDailyMinutes(dailyMinutes: number) {
    setProfile((p) => ({ ...p, dailyMinutes }));
    setSession((s) =>
      s ? { ...s, profile: { ...s.profile, dailyMinutes } } : s,
    );
    void api("study-time", { dailyMinutes }).catch(() =>
      setNotice("Chưa lưu được thời lượng học. Kiểm tra kết nối rồi chọn lại."),
    );
  }
  function saveProgress(key: string, value: boolean) {
    const progress = { ...progressState.current, [key]: value };
    progressState.current = progress;
    setSession((s) => (s ? { ...s, progress } : s));
    void api("progress", { progress }).catch(() =>
      setNotice("Chưa lưu được tiến độ. Kiểm tra kết nối rồi đánh dấu lại."),
    );
  }
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
  async function startDemo(preset: "foundation" | "intermediate" | "advanced") {
    setBusy(true);
    setMessage("");
    try {
      // A fresh token keeps the synthetic result separate from any real draft.
      token.current = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      localStorage.removeItem(STORAGE);
      dirty.current = false;
      const data = await api("demo", { preset });
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
    setEssay("");
    setRemaining(3600);
    setNotice("");
    setMessage("");
    setReady([false, false]);
    setHeard(false);
    setConfirmed(false);
    /*
      Về màn ĐIỀN THÔNG TIN, không về màn giới thiệu.

      Màn giới thiệu là trang chào bán cho người chưa biết bài kiểm tra là gì;
      người vừa làm xong một lượt thì không cần bán lại. Trước đây `newAttempt`
      trả về "intro", và vì màn đó trông hệt như lúc mới mở trang, bấm "Làm
      lượt mới" nhìn ra thành "hộp thoại tự tắt, không có gì xảy ra" — phải bấm
      thêm "Bắt đầu kiểm tra" nữa mới đi tiếp.

      Không nhảy thẳng vào đề: `profile` giữ nguyên nên form hiện sẵn thông tin
      cũ, nhưng mục tiêu band, số giờ tự học và ngày thi là thứ đổi giữa hai
      lượt, mà cả ba đều nắn lộ trình (xem `roadmap.ts`). Lấy lại số cũ không
      hỏi là in ra một lộ trình sai mà không ai biết nó sai.
    */
    setStage("profile");
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
        className={`diag-question ${q.section === "Listening" ? "diag-listening-question" : ""} ${q.section === "Listening" && q.id >= "L17" && q.id <= "L20" ? "diag-listening-choice-question" : ""} ${activeQuestion === q.id ? "is-current" : ""} ${workspace.bookmarks.includes(q.id) ? "is-review" : ""}`}
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
  const sectionHighlights = workspace.highlights.filter(
    (h) => blockSection(h.blockId) === workspace.section,
  ).length;
  const overallAssessment = session?.result
    ? getOverallAssessment(session.result.scores)
    : null;
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
  const formField = (
    key: keyof Profile,
    label: string,
    options?: readonly string[],
    extra?: { optional?: boolean; type?: string; hint?: string },
  ) => (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {options ? (
        <select
          className="diag-input"
          required={!extra?.optional}
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
          required={!extra?.optional}
          type={extra?.type ?? (key === "email" ? "email" : "text")}
          value={String(profile[key] ?? "")}
          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
        />
      )}
      {extra?.hint && (
        <span className="text-2xs font-normal text-ink/60">{extra.hint}</span>
      )}
    </label>
  );
  return (
    <main
      data-lenis-prevent={stage === "exam" ? true : undefined}
      className={`diagnostic ${stage === "exam" ? "diagnostic-exam" : ""} ${stage === "exam" ? `diag-theme-${examTheme} diag-font-${fontFamily}` : ""}`}
    >
      {/*
        Tạo lượt làm là một cú POST ghi cả đề vào DB — đo ở máy dev mất khoảng
        2,3 giây. Trước đây chỉ có chữ trên nút đổi thành "Đang tạo lượt làm…",
        mà nút ấy thường nằm ngoài tầm nhìn sau khi cuộn, nên màn hình trông
        như đứng im. `BusyOverlay` chỉ hiện sau 180ms nên mạng nhanh không thấy.
      */}
      <BusyOverlay
        open={busy}
        label="Đang tạo lượt làm…"
        hint="Giữ trang này mở, sắp vào bài."
      />
      {stage !== "exam" && stage !== "instructions" && (
        <div className="diag-intro-header">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
            THƯƠNG HỒ’S CLASS · IELTS DIAGNOSTIC TEST
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-brand md:text-5xl">
            Bài kiểm tra nền tảng IELTS
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
            {/*
              Còn chờ dữ liệu thì nút phải NÓI là đang chờ, kèm con quay.

              Một nút mờ đi với chữ đứng yên đọc ra thành "hỏng", và học sinh
              bấm liên tục vào đó. Con quay là thứ duy nhất nói được "máy vẫn
              đang chạy, đợi một nhịp".
            */}
            <button
              disabled={loading}
              onClick={() => setStage("profile")}
              className="diag-primary mt-8"
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin motion-reduce:animate-none"
                  />{" "}
                  {paper ? "Đang kiểm tra lượt trước…" : "Đang tải đề…"}
                </>
              ) : (
                <>
                  Bắt đầu kiểm tra <ArrowUpRight size={19} />
                </>
              )}
            </button>
          </div>
          <div className="diag-outline">
            <div className="flex items-center justify-between border-b border-brand/20 pb-5">
              <span className="flex items-center gap-2 font-semibold">
                <Clock3 size={20} />
                60 phút
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
          {isLocalDemo && (
            <aside
              className="diag-demo-lab col-span-full"
              aria-label="Môi trường dữ liệu thử nghiệm"
            >
              <div>
                <p className="diag-demo-kicker">CHỈ HIỂN THỊ Ở LOCALHOST</p>
                <h2>Môi trường học sinh ảo</h2>
                <p>
                  Tạo một bài làm hoàn chỉnh để kiểm tra report, nhận xét và kế
                  hoạch học. Dữ liệu này là giả lập và tách biệt với học viên
                  thật.
                </p>
              </div>
              <div className="diag-demo-actions">
                <button
                  disabled={busy}
                  onClick={() => void startDemo("foundation")}
                >
                  Tạo học sinh 4.5
                </button>
                <button
                  disabled={busy}
                  onClick={() => void startDemo("intermediate")}
                >
                  Tạo học sinh 5.5
                </button>
                <button
                  disabled={busy}
                  onClick={() => void startDemo("advanced")}
                >
                  Tạo học sinh 6.5
                </button>
              </div>
            </aside>
          )}
          <div className="col-span-full border-t border-brand/15 pt-6 text-sm leading-relaxed text-ink/65">
            <p className="font-semibold text-brand">Lưu ý:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Đây là bài đánh giá sơ bộ, chưa bao gồm Speaking. Kết quả không
                phải điểm IELTS chính thức.
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
            {formField("phone", "Số điện thoại", undefined, {
              optional: true,
              type: "tel",
            })}
            {formField("level", "Trình độ hiện tại *", LEVELS)}
            {/*
              Điểm IELTS cũ chỉ hiện khi học sinh tự nhận đã thi. Đây là thông
              tin tự khai, không tham gia chấm bài — nói rõ để không ai tưởng
              khai điểm cao thì bài dễ hơn.
            */}
            {profile.level === NEEDS_SCORE && (
              <div className="grid gap-5 md:grid-cols-2">
                {formField("ieltsScore", "Điểm IELTS gần nhất", undefined, {
                  optional: true,
                  hint: "Tự khai, không ảnh hưởng kết quả bài kiểm tra.",
                })}
                {formField("ieltsDate", "Thời điểm thi", undefined, {
                  optional: true,
                  type: "month",
                })}
              </div>
            )}
            {formField("target", "Mục tiêu *", TARGETS)}
            {formField("purpose", "Mục đích học IELTS *", PURPOSES)}
            {formField("examTiming", "Thời gian dự kiến thi *", EXAM_TIMINGS)}
            {profile.examTiming === NEEDS_MONTH &&
              formField("examMonth", "Tháng/năm dự kiến thi *", undefined, {
                type: "month",
              })}
            <label className="grid gap-2 text-sm font-semibold">
              Bạn có thể dành bao nhiêu thời gian tự học mỗi ngày? *
              <select
                className="diag-input"
                required
                value={String(profile.dailyMinutes ?? "")}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    dailyMinutes: Number(e.target.value),
                  }))
                }
              >
                <option value="">Chọn một mục</option>
                {DAILY_MINUTES.map((o) => (
                  <option key={o.label} value={o.minutes}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-2xs font-normal text-ink/60">
                Chưa rõ thì kế hoạch lấy mặc định 30 phút/ngày, 6 ngày/tuần.
              </span>
            </label>
          </div>
          <div className="mt-6 grid gap-3 border-t border-brand/10 pt-5 text-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 h-5 w-5 shrink-0 accent-brand"
                checked={!!profile.consent}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, consent: e.target.checked }))
                }
              />
              <span>
                Tôi đồng ý cho Thương Hồ’s Class lưu thông tin và kết quả bài
                làm để chấm bài, tạo báo cáo và kế hoạch học.{" "}
                <Link
                  href="/kiem-tra-nen-tang-ielts/bao-mat"
                  target="_blank"
                  className="text-brand underline"
                >
                  Chính sách bảo mật
                </Link>
                .
              </span>
            </label>
            {/*
              Nhận tư vấn là lựa chọn RIÊNG và không tích sẵn: xem kết quả không
              được đi kèm điều kiện phải đồng ý nhận quảng cáo.
            */}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-brand"
                checked={!!profile.contactOptIn}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, contactOptIn: e.target.checked }))
                }
              />
              <span>
                Tôi muốn nhận tư vấn lộ trình và thông tin khóa học. Không chọn
                mục này vẫn xem được đầy đủ kết quả.
              </span>
            </label>
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
                Bài kiểm tra nền tảng IELTS
              </p>
              <h2 className="text-3xl font-bold text-ink">
                Hướng dẫn làm bài kiểm tra
              </h2>
              <ol className="my-7 ml-5 list-decimal space-y-3 text-sm leading-relaxed text-ink/75">
                <li>
                  Bạn có 60 phút cho toàn bài kiểm tra 4 phần (Listening /
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
                key={`${id}-${audioAttempt}`}
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
                <div className="mb-4">
                  <p className="text-sm" role="status">
                    {workspace.issues.length
                      ? "Chưa tải được bài nghe. Kết nối tới kho file chập chờn, thường thử lại một lượt là được."
                      : "Đang tải hai bài nghe trước khi bắt đầu…"}
                  </p>
                  {workspace.issues.length > 0 && (
                    <button
                      className="diag-secondary mt-3"
                      onClick={retryAudio}
                    >
                      Thử tải lại bài nghe
                    </button>
                  )}
                </div>
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
                  Bài kiểm tra nền tảng IELTS
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
                  href="/phong-luyen-tap"
                  aria-label="Thoát về phòng luyện tập"
                  className="diag-exit"
                >
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </div>
            {live && workspace.section !== "Listening" && (
              <div className="diag-live-audio" role="status">
                <b>Đang phát · Part {live.index + 1}</b>
                <span className="diag-live-time">
                  {clock(live.current)} / {clock(live.duration)}
                </span>
                <button
                  type="button"
                  className="diag-secondary"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("diagnostic-audio", { detail: -1 }),
                    )
                  }
                >
                  Tạm dừng
                </button>
                <button
                  type="button"
                  className="diag-secondary"
                  onClick={() =>
                    updateWorkspace((w) => ({ ...w, section: "Listening" }))
                  }
                >
                  Về phần nghe
                </button>
              </div>
            )}
            <div className="diag-exam-meta">
              <span role="status">{saveStatus}</span>
              <span className="diag-exam-progress">
                {sections.map((s) => (
                  <span key={s}>
                    {s}{" "}
                    <b>
                      {
                        paper.questions.filter(
                          (q) => q.section === s && answers[q.id]?.trim(),
                        ).length
                      }
                      /{totals[s]}
                    </b>
                  </span>
                ))}
              </span>
              {/*
                Xoá highlight là thao tác không hoàn lại nên phải hỏi, nhưng
                hỏi bằng lớp phủ thì che mất câu đang làm — dùng xác nhận tại
                chỗ ngay trên thanh.
              */}
              {sectionHighlights > 0 &&
                (clearAsk ? (
                  <span className="diag-clear-ask">
                    Xoá {sectionHighlights} vệt highlight ở phần{" "}
                    {workspace.section}?
                    <button
                      type="button"
                      onClick={() => {
                        updateWorkspace((w) => ({
                          ...w,
                          highlights: w.highlights.filter(
                            (h) =>
                              blockSection(h.blockId) !== workspace.section,
                          ),
                        }));
                        setClearAsk(false);
                      }}
                    >
                      Xoá
                    </button>
                    <button type="button" onClick={() => setClearAsk(false)}>
                      Giữ lại
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="diag-clear-highlights"
                    onClick={() => setClearAsk(true)}
                  >
                    Xoá highlight phần này
                  </button>
                ))}
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
                {isLocalDemo && (
                  <button
                    type="button"
                    className="diag-demo-quick"
                    disabled={busy}
                    onClick={() => void startDemo("intermediate")}
                  >
                    Tạo báo cáo học sinh ngẫu nhiên
                  </button>
                )}
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
                      <h2 className="diag-section-heading">PHẦN 2: READING</h2>
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
                  {s !== "Reading" && (
                    <h2 className="diag-section-heading">
                      PHẦN {sections.indexOf(s) + 1}: {s.toUpperCase()}
                    </h2>
                  )}
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
                                  <b>{Number(q.id.slice(1))}</b>
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
                                <span>
                                  <strong>{q.id}.</strong> {q.prompt}
                                </span>
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
                                  <b>{Number(q.id.slice(1))}</b>
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
            {/*
              Phần 4. Nằm ngoài `sections.map` vì nó không có câu hỏi nào: mọi
              thứ bên trong vòng lặp kia đều dựng từ `paper.questions`.
            */}
            <div
              className={`diag-section ${workspace.section === "Writing" ? "" : "is-hidden"}`}
            >
              <div className="diag-questions diag-scroll" style={{ fontSize }}>
                <h2 className="diag-section-heading">PHẦN 4: WRITING</h2>
                <div className="diag-writing-task">
                  <p className="diag-writing-kind">
                    {writingTask.type} · khoảng{" "}
                    {Math.round(writingTask.seconds / 60)} phút · tối thiểu{" "}
                    {writingTask.minWords} từ
                  </p>
                  {writingTask.prompt.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <label className="diag-writing-label" htmlFor="essay">
                  Bài làm của bạn
                </label>
                <textarea
                  id="essay"
                  className="diag-writing-input"
                  value={essay}
                  spellCheck={false}
                  placeholder="Viết bài của bạn ở đây…"
                  onChange={(e) => {
                    dirty.current = true;
                    setEssay(e.target.value);
                    setSaveStatus("Đang lưu…");
                  }}
                />
                <p
                  className="diag-writing-count"
                  data-short={
                    essayWords < writingTask.minWords ? "" : undefined
                  }
                  aria-live="polite"
                >
                  {essayWords} từ
                  {essayWords < writingTask.minWords
                    ? ` · còn thiếu ${writingTask.minWords - essayWords} từ so với mức tối thiểu`
                    : " · đã đủ số chữ tối thiểu"}
                </p>
              </div>
            </div>
          </fieldset>
          <div className="diag-nav-summary">
            <span>
              {totalAnswered}/53 câu đã trả lời · {essayWords} từ ở phần viết ·{" "}
              {workspace.bookmarks.length} câu xem lại
            </span>
            <span>
              <i className="diag-legend-answered" /> Đã trả lời{" "}
              <i className="diag-legend-review" /> Xem lại
            </span>
          </div>
          <ExamQuestionNavigator
            className="diag-question-nav"
            sections={tabs.map((tab) =>
              tab === "Writing"
                ? {
                    id: tab,
                    label: tab,
                    /*
                      Writing không có câu hỏi để đánh số, nên đếm theo "đã đủ
                      số chữ tối thiểu hay chưa" — đó là mốc duy nhất ở phần này
                      mà học sinh tự kiểm được, và cũng là mốc bộ chấm dùng.
                    */
                    answered: essayWords >= writingTask.minWords ? 1 : 0,
                    total: 1,
                    /* "0 of 1" không nói gì về một bài viết; đếm chữ thì có. */
                    hint: `${essayWords}/${writingTask.minWords} từ`,
                    questions: [],
                  }
                : {
                    id: tab,
                    label: tab,
                    answered: paper.questions.filter(
                      (q) => q.section === tab && answers[q.id]?.trim(),
                    ).length,
                    total: totals[tab],
                    questions: paper.questions
                      .filter((q) => q.section === tab)
                      .map((q) => ({
                        id: q.id,
                        number: Number(q.id.slice(1)),
                        answered: Boolean(answers[q.id]?.trim()),
                        bookmarked: workspace.bookmarks.includes(q.id),
                        active: activeQuestion === q.id,
                      })),
                  },
            )}
            activeIndex={tabs.indexOf(workspace.section)}
            onSelectSection={(index) =>
              updateWorkspace((w) => ({ ...w, section: tabs[index] }))
            }
            onSelectQuestion={(question) => jump(question.id)}
            onPrevious={() =>
              updateWorkspace((w) => ({
                ...w,
                section: tabs[tabs.indexOf(w.section) - 1],
              }))
            }
            onNext={() =>
              updateWorkspace((w) => ({
                ...w,
                section: tabs[tabs.indexOf(w.section) + 1],
              }))
            }
            onSubmit={() => setSubmitDialog(true)}
            submitDisabled={locked}
          />
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
              {selectedHighlight ? "Xóa highlight" : "Highlight"}
            </button>
          )}
          {submitDialog && (
            <div className="diag-modal" data-lenis-prevent>
              <div
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                ref={focusDialog}
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
          <div className="diag-report-header">
            <div>
              <p className="diag-report-kicker">KẾT QUẢ BÀI LÀM</p>
              <h1>{session.profile.name}</h1>
              <p className="diag-report-meta">
                {new Date(session.startedAt).toLocaleString("vi-VN")} ·{" "}
                {session.autoSubmitted
                  ? "Bài đã được tự động nộp khi hết giờ."
                  : "Đã nộp bài."}
              </p>
            </div>
            <p className="diag-report-disclaimer">
              Ba con số dưới đây đếm theo số câu đúng, KHÔNG gồm Writing —
              Writing chấm bằng bốn tiêu chí band riêng, xem ở tab nhận xét. Bài
              kiểm tra không đo Speaking.
            </p>
          </div>
          {overallAssessment && (
            <section className="diag-overall-assessment" aria-label="Đánh giá tổng quan">
              <div className="diag-overall-score">
                <span>Điểm tổng 3 kỹ năng</span>
                <strong>
                  {overallAssessment.score}
                  <small>/{totalQuestions}</small>
                </strong>
              </div>
              <div className="diag-overall-copy">
                <p className="diag-overall-level">Nền tảng: {overallAssessment.level}</p>
                <p>{overallAssessment.description}</p>
              </div>
              <span className="diag-overall-percent">{overallAssessment.percentage}%</span>
            </section>
          )}
          <div className="diag-score-grid">
            {sections.map((s, index) => {
              const Icon = [Headphones, BookOpen, PenLine][index];
              const score = session.result!.scores[s];
              const percent = Math.round((score / totals[s]) * 100);
              return (
                <article className="diag-score-card" key={s}>
                  <div className="diag-score-card-top">
                    <span className="diag-score-icon">
                      <Icon size={20} />
                    </span>
                    <p>{s}</p>
                    <strong>
                      {score}
                      <small>/{totals[s]}</small>
                    </strong>
                  </div>
                  <span className="diag-score-track">
                    <i style={{ width: `${percent}%` }} />
                  </span>
                  <p className="diag-score-caption">
                    {score === 0
                      ? "Chưa có câu trả lời đúng ở phần này."
                      : score / totals[s] >= 0.7
                        ? "Bạn đã có nền tảng tốt và có thể tiếp tục phát huy."
                        : "Hãy ưu tiên củng cố các nội dung còn chưa vững."}
                  </p>
                </article>
              );
            })}
          </div>
          {notice && (
            <p role="alert" className="diag-notice">
              {notice}
            </p>
          )}
          <div className="my-6 flex flex-wrap gap-2 print:hidden">
            {(["report", "plan", "answers"] as const).map((t, i) => (
              <button
                key={t}
                className={`diag-tab ${resultTab === t ? "active" : ""}`}
                onClick={() => setResultTab(t)}
              >
                {
                  [
                    "Nhận xét chi tiết",
                    "Đáp án & lời giải",
                    "Lộ trình & kế hoạch",
                  ][i]
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
                  ...(() => {
                    const roadmap = buildRoadmap(
                      report,
                      session.profile,
                      new Date(session.startedAt),
                    );
                    return [
                      verdictToText(buildVerdict(report, roadmap)),
                      ...roadmapToText(roadmap),
                    ];
                  })(),
                  "KẾ HOẠCH TỰ HỌC 4 TUẦN ĐẦU",
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
              Tải nhận xét & kế hoạch học
            </button>
          </div>
          {
            <div
              className={
                resultTab === "report"
                  ? "diag-feedback"
                  : "diag-feedback diag-print-only"
              }
            >
              <Verdict
                report={session.result}
                profile={profile}
                startedAt={session.startedAt}
              />
              {/*
                Phần 4 nằm ngay dưới khối tổng hợp, trước danh sách 16 nhóm nội
                dung: nó là một kỹ năng riêng chấm bằng thang riêng, để lẫn vào
                giữa các nhóm trắc nghiệm là mời người đọc so hai thang khác nhau.
              */}
              <WritingReport
                /*
                  Bỏ trống phần 4 thì vẫn phải hiện khối này, và hiện ngay trạng
                  thái "chưa viết gì" thay vì chờ bộ chấm. Trước đây cả khối bị
                  ẩn khi bài rỗng, mà dòng chú thích phía trên vẫn bảo "xem
                  Writing ở tab nhận xét" — học sinh đi tìm một thứ không có.
                */
                state={essay.trim() ? writing : { kind: "empty" }}
                essay={essay}
                onRetry={askWritingGrade}
                retrying={gradingWriting}
              />
              <div className="diag-feedback-heading">
                {/*
                  Phần tổng hợp 3+3 đã đứng ngay trên, nên tiêu đề ở đây phải
                  nói đúng vai của danh sách: đủ cả 16 nhóm, không phải một bản
                  "điểm mạnh & điểm yếu" thứ hai.
                */}
                <h2>Chi tiết từng nhóm nội dung</h2>
                <p>
                  Đủ {session.result.areas.length} nhóm. Trong mỗi kỹ năng, nhóm
                  yếu nhất nằm trên cùng. Chọn từng mục để xem nhận xét và gợi ý
                  ôn tập.
                </p>
              </div>
              {!session.result.areas.some((a) => a.level === 2) && (
                <p className="diag-feedback-empty">
                  Chưa có nhóm ở mức Tốt. Bạn có thể bắt đầu từ nhóm có kết quả
                  cao nhất và củng cố từng nội dung bên dưới.
                </p>
              )}
              {/*
                Chia theo ba kỹ năng, đúng cách học sinh nghĩ về bài thi và
                khớp ba thẻ điểm ngay phía trên. Chỉ là cách BÀY: điểm, mức và
                nhận xét vẫn lấy nguyên từ `result.areas`, không tính lại gì.
              */}
              <div className="diag-feedback-cols">
                {sections.map((s) => {
                  const group = session.result!.areas.filter(
                    (a) => a.section === s,
                  );
                  return (
                    <section className="diag-feedback-col" key={s}>
                      <header>
                        <b>{s}</b>
                        <strong>
                          {session.result!.scores[s]}
                          <small>/{totals[s]}</small>
                        </strong>
                      </header>
                      {[...group]
                        .sort(
                          (a, b) =>
                            a.correct / a.total - b.correct / b.total ||
                            b.total - a.total,
                        )
                        .map((a) => (
                          <details className="diag-feedback-row" key={a.id}>
                            <summary>
                              <span className="diag-feedback-title">
                                <b>{a.name}</b>
                                <strong className="diag-feedback-score">
                                  {a.correct}
                                  <small>/{a.total}</small>
                                </strong>
                              </span>
                              <span
                                className="diag-feedback-track"
                                data-level={a.level}
                              >
                                <i
                                  style={{
                                    width: `${Math.round((a.correct / a.total) * 100)}%`,
                                  }}
                                />
                              </span>
                              <span className="diag-feedback-meta">
                                <small>{names[2 - a.level]}</small>
                                <span
                                  className="diag-feedback-chevron"
                                  aria-hidden
                                >
                                  ⌄
                                </span>
                              </span>
                            </summary>
                            <div className="diag-feedback-detail">
                              <p>{a.feedback}</p>
                              {a.id === "R_VOCABULARY_OVERALL" && (
                                <p className="diag-feedback-note">
                                  Nhận xét suy ra từ toàn bộ bài Reading, không
                                  phải điểm từ vựng độc lập.
                                </p>
                              )}
                              {a.review.length > 0 && (
                                <ul className="diag-feedback-review">
                                  {a.review.map((q) => (
                                    <li key={q.id}>
                                      <b>{q.id}</b>
                                      <span>{q.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </details>
                        ))}
                    </section>
                  );
                })}
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
                <div className="mb-6 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
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
              <Roadmap
                report={session.result}
                profile={profile}
                startedAt={session.startedAt}
                rulesVersion={session.rulesVersion}
                progress={session.progress}
                onProgress={saveProgress}
              />
              <div className="mb-5 mt-12 border-t border-brand/15 pt-8">
                <h2 className="text-2xl font-bold text-brand">
                  Bốn tuần đầu, chi tiết từng buổi
                </h2>
                <p className="mt-2 text-ink/70">
                  Phần này chỉ dựa trên các câu bạn vừa làm, để bắt đầu chặng
                  đầu tiên ngay hôm nay. Lộ trình dài tới mục tiêu nằm bên trên.
                </p>
              </div>
              <StudyPlan
                report={session.result}
                profile={profile}
                progress={session.progress}
                onProgress={saveProgress}
                onDailyMinutes={setDailyMinutes}
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
      {/*
        Trên thiết bị này đã có một lượt đã nộp. Hỏi trước, vì hai ý định rất
        khác nhau: xem lại kết quả cũ, hay làm lại từ đầu. Nhảy thẳng vào bảng
        điểm của lần trước làm người mới tưởng đó là bài mình vừa làm.
      */}
      {oldAttempt && (
        <div className="diag-modal" data-lenis-prevent>
          <div
            className="diag-panel max-w-lg"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            ref={focusDialog}
            aria-label="Đã có lượt làm trước đó"
          >
            <h2 className="text-xl font-bold text-brand">
              Bạn đã làm bài này rồi
            </h2>
            <p className="mt-4 text-sm text-ink/70">
              {oldAttempt.profile.name} ·{" "}
              {new Date(oldAttempt.submittedAt!).toLocaleString("vi-VN")}
              {oldAttempt.autoSubmitted && " · tự nộp khi hết giờ"}
            </p>
            {oldAttempt.result && (
              <ul className="diag-old-scores">
                {sections.map((s) => (
                  <li key={s}>
                    <span>{s}</span>
                    <b>
                      {oldAttempt.result!.scores[s]}
                      <small>/{totals[s]}</small>
                    </b>
                  </li>
                ))}
              </ul>
            )}
            <p className="my-5 text-sm">
              Làm lượt mới không xoá kết quả cũ: chừng nào chưa bắt đầu lượt
              mới, mở lại trang là hộp thoại này hiện lên để bạn chọn lần nữa.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="diag-primary"
                onClick={() => {
                  apply(oldAttempt);
                  setOldAttempt(null);
                }}
              >
                Xem lại kết quả cũ
              </button>
              <button
                className="diag-secondary"
                onClick={() => {
                  setOldAttempt(null);
                  newAttempt();
                }}
              >
                Làm lượt mới
              </button>
            </div>
          </div>
        </div>
      )}
      {resetPrompt && (
        <div className="diag-modal" data-lenis-prevent>
          <div
            className="diag-panel max-w-lg"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            ref={focusDialog}
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
