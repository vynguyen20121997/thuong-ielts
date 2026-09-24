"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Lightbulb,
  Loader2,
  PenLine,
  RotateCcw,
  Timer,
  X,
} from "lucide-react";

import {
  WRITING_CHECKABLE_WORDS,
  WRITING_MINUTES,
  WRITING_MIN_WORDS,
  countWords,
} from "../domain/writing";
import {
  paragraphCount,
  type Coaching,
  type Idea,
} from "../domain/writingCoach";
import { trackWriting } from "../infrastructure/writingApi";
import WritingBandReport from "../../../components/WritingBandReport";
import EssayCoachPanel, { type CoachData } from "./EssayCoachPanel";
import type { WritingState } from "@thuong-ielts/diagnostic";
import ChecklistPanel from "./ChecklistPanel";
import KnowledgePanel from "./KnowledgePanel";
import type { WritingPrompt } from "../server/writingRepository";

/**
 * Bàn viết Task 2: đề bên trái, ô viết bên phải, checklist hiện sau khi bấm.
 *
 * ## Ba điều màn này cố ý KHÔNG làm
 *
 * 1. **Không tự chấm khi đang gõ.** Mỗi lần gọi là một request tính tiền, và
 *    quan trọng hơn: nhận xét nhảy loạn trong lúc viết là thứ phá mạch viết.
 *    Học sinh chủ động bấm khi thấy xong.
 * 2. **Không gộp checklist thành band.** Band là một nút riêng, chấm bằng
 *    đường riêng (`server/writingBand.ts`), và hiện ở một khối riêng dưới ô
 *    viết. Xem chú thích đầu `domain/writing.ts`.
 * 3. **Không tự nộp khi hết giờ.** Khác Reading/Listening: ở đó hết giờ là hết
 *    lượt vì có đáp án đúng/sai; ở đây bài viết là của học sinh, cắt ngang giữa
 *    câu chẳng phục vụ ai. Đồng hồ chỉ đếm để biết mình viết nhanh hay chậm.
 *
 * ## Bản nháp giữ trong `sessionStorage`
 *
 * Gõ 40 phút rồi lỡ tay tải lại trang mà mất sạch là lỗi không thể tha. Dùng
 * `sessionStorage` chứ không `localStorage`: bài của phiên này, đóng tab là
 * thôi — giống cách `useReadingSession` giữ bài đang làm dở.
 */

const draftKey = (promptId: string) => `thuong-writing-draft:${promptId}`;

/**
 * Đọc/xoá bản nháp — export để `WritingGate` biết có bài dở hay không mà không
 * phải tự đoán tên khoá. Hai nơi cùng dựng chuỗi khoá thì sẽ có ngày lệch một
 * dấu hai chấm và bài dở biến mất không ai hiểu vì sao.
 */
export function readWritingDraft(promptId: string): string | null {
  try {
    return window.sessionStorage.getItem(draftKey(promptId));
  } catch {
    return null;
  }
}

export function clearWritingDraft(promptId: string): void {
  try {
    window.sessionStorage.removeItem(draftKey(promptId));
  } catch {
    /* bị chặn: không sao, bản nháp cũ sẽ bị ghi đè ngay khi gõ */
  }
}

/**
 * Ngưng gõ bấy nhiêu thì coi là ĐANG BÍ, và chỉ lúc đó mới hỏi gợi ý.
 *
 * Đây là cả cơ chế, không phải một con số điều chỉnh vặt. Học sinh đang viết
 * trôi chảy thì không cần ai mách — chen gợi ý vào lúc đó là cắt mạch nghĩ.
 * Người dừng hẳn mười giây giữa bài mới là người đang không biết viết gì tiếp,
 * và đó đúng là lúc một câu hỏi gợi có ích.
 *
 * Mười giây đủ dài để không bắt nhầm người đang nghĩ một chữ, đủ ngắn để
 * không bỏ mặc người đang nhìn màn hình trống.
 */
const STUCK_MS = 10000;
/**
 * Màn hình còn trắng thì chờ lâu hơn trước khi gợi ý.
 *
 * Vừa vào bài ai cũng cần một lúc để đọc đề và nghĩ — nhảy vào mách ngay giây
 * đầu tiên là cắt ngang đúng lúc em đang tự nghĩ, mà đó mới là phần đáng giá.
 * Hai mươi giây nhìn màn hình trắng thì khác: lúc đó là bí thật.
 */
const FIRST_IDLE_MS = 20000;
/**
 * Ngồi im tiếp thì bao lâu ĐỔI SANG GỢI Ý KHÁC.
 *
 * Bản đầu gọi lại API mỗi nhịp này, và đo ra đúng chỗ sai: bài không đổi thì
 * server trả về y hệt — cùng `stage`, cùng tiêu đề, cùng sáu ý. Học sinh ngồi
 * nhìn màn hình đứng im suốt, còn mình thì trả tiền cho câu trả lời giống hệt
 * câu trước.
 *
 * Nên nhịp này giờ KHÔNG gọi mạng. Nó xoay sang phần kế của đoạn (chủ đề →
 * giải thích → ví dụ), hết ba phần thì sang ý kế tiếp. Em bí thì cứ ngồi đó,
 * cứ 25 giây lại có một câu mẫu mới hiện ra — và không tốn thêm đồng nào.
 *
 * API chỉ được gọi lại khi bài THẬT SỰ đổi. Đó mới là lúc gợi ý có thể khác.
 */
const IDLE_REPEAT_MS = 25000;
/** Gọi hỏng thì thử lại sau bấy nhiêu, tối đa `MAX_RETRIES` lần. */
const RETRY_MS = 5000;
const MAX_RETRIES = 3;
/**
 * Bí lần nữa mà bài gần như không đổi thì đừng hỏi lại: gợi ý sẽ y hệt, mà
 * vẫn mất một request. Ngưỡng thấp vì sang đoạn mới cũng tính là đã đổi.
 */
const MIN_NEW_WORDS = 8;
/*
  KHÔNG có ngưỡng số từ ở phía client nữa.

  Trước đây chặn dưới 25 từ, và hậu quả là người cần giúp nhất — em mở trang
  ra rồi ngồi nhìn màn hình trắng — không bao giờ nhận được gì. Server mới là
  chỗ biết khi nào đáng gọi Jev: dưới 25 từ nó trả gợi ý mở đầu mà không gọi
  model, tức là miễn phí.
*/

function clock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Ba phần của một đoạn thân bài. Vừa là sơ đồ, vừa là ba NÚT chọn khung câu.
 *
 * Ba khối cao thấp khác nhau là có ý: câu chủ đề một câu, giải thích hai tới
 * ba câu, ví dụ một câu nhưng phải cụ thể. Học sinh nhìn tỉ lệ là biết đoạn
 * của mình đang lệch chỗ nào — thường là phần giải thích quá mỏng.
 *
 * Cả ba câu mẫu đều lấy theo TỪNG Ý (cột `starter` / `frame_explain` /
 * `frame_example` trong DB): một câu ví dụ chung chung cho mọi ý thì vô dụng,
 * vì cái làm nên câu ví dụ đạt chính là chi tiết riêng của ý đó.
 */
const PARAGRAPH_SHAPE = [
  {
    label: "Câu chủ đề",
    hint: "1 câu — nói thẳng ý chính",
    box: "bg-brand text-white",
    dot: "bg-brand",
    height: 44,
    /* Ba hướng bay khác nhau — cùng một phía thì thành danh sách trượt xuống,
       không ra cảm giác lắp ghép. */
    from: "hint-piece--down",
    /* Lấy câu mẫu nào của ý đang mở. */
    pick: (i: Idea) => i.starter,
    /* Câu chủ đề MỞ một đoạn mới; hai phần kia viết tiếp trong cùng đoạn. */
    newPara: true,
  },
  {
    label: "Giải thích",
    hint: "2–3 câu — vì sao lại thế",
    box: "bg-brand/10 text-brand",
    dot: "bg-brand/40",
    height: 58,
    from: "hint-piece--left",
    pick: (i: Idea) => i.explain,
    newPara: false,
  },
  {
    label: "Ví dụ thật",
    hint: "1 câu — ở đâu, khi nào, ai",
    box: "border border-dashed border-warn text-warn bg-warn-soft",
    dot: "bg-warn",
    height: 44,
    from: "hint-piece--right",
    pick: (i: Idea) => i.example,
    newPara: false,
  },
] as const;

/** Hộp cũ xẹp xong mới dựng hộp mới. Khớp với `hint-close` trong `globals.css`. */
const HINT_EXIT_MS = 180;

export default function WritingDesk({
  prompt,
  knowledge = [],
  autoStart = false,
  resume = false,
}: {
  prompt: WritingPrompt;
  /** Tên các ghi chú kiến thức nền của đề; nội dung tải khi học sinh bấm. */
  knowledge?: { id: string; topic: string }[];
  /** Đồng hồ chạy ngay từ lúc mount — màn bìa đã hỏi "bắt đầu chưa" rồi. */
  autoStart?: boolean;
  /** Vào để viết tiếp bài dở, không phải bắt đầu bài mới. */
  resume?: boolean;
}) {
  const [essay, setEssay] = useState("");
  /*
    Hộp "Kiểm tra nháp" tự giữ kết quả của nó (xem `ChecklistPanel`). Ở đây chỉ
    giữ một con số để ép nó dựng lại khi học sinh xoá bài làm lại — chuyền một
    đường dây reset xuống chỉ để xoá đúng một chỗ thì đắt hơn.
  */
  const [resetKey, setResetKey] = useState(0);
  /*
    Chấm band là thao tác RIÊNG, không gộp vào "Kiểm tra nháp".

    Checklist trả lời "bài đã đủ những thứ sửa được trong năm phút chưa";
    band trả lời "bài này đang ở mức nào". Hai câu hỏi khác nhau, và gộp lại
    thì học sinh chỉ đọc con số rồi bỏ qua phần sửa được.
  */
  const [band, setBand] = useState<WritingState | null>(null);
  const [banding, setBanding] = useState(false);
  /*
    Năm mục hướng dẫn quanh bảng điểm. Lấy trong CÙNG lúc chấm band, không đợi
    học sinh bấm sang từng mục: cả năm nằm trên một màn, tải lười từng mục là
    năm vòng chờ cho thứ người ta thấy cùng lúc.
  */
  const [coach, setCoach] = useState<CoachData | null>(null);
  /* Hộp thoại kết quả: mở ngay lúc bấm nộp, đóng được mà không mất `band`. */
  const [showBand, setShowBand] = useState(false);
  /* `createPortal` chỉ chạy được ở trình duyệt — lần vẽ đầu trên server thì chưa. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const area = useRef<HTMLTextAreaElement>(null);

  /* Gợi ý ý tưởng: trạng thái do SERVER trả về, client không tự suy ra gì. */
  const [guide, setGuide] = useState<Coaching | null>(null);
  const [reading, setReading] = useState(false);
  /* Học sinh vừa gõ, đồng hồ chờ đang chạy — máy sẽ đọc khi em dừng bút. */
  const [pending, setPending] = useState(false);
  const [openIdea, setOpenIdea] = useState<string | null>(null);
  /*
    Màn đang THỰC SỰ được vẽ trong bảng, và cờ báo nó đang xẹp đi.

    `null` = màn danh sách ý; một id = màn sơ đồ của ý đó. Hai màn KHÔNG bao
    giờ cùng hiện: bấm một ý là cả khối tiêu đề và dãy chip nhường chỗ cho sơ
    đồ, bấm "chọn ý khác" thì ngược lại.

    Cần hai biến chứ không một, vì mỗi lần đổi màn là một chu trình hai pha:
    màn cũ phải xẹp hết rồi màn mới mới được dựng. Vẽ thẳng theo `openIdea` thì
    nội dung đổi ngay trong lúc màn cũ còn đó, và cú bấm mất nhân quả.
  */
  const [shownIdea, setShownIdea] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  /*
    Các ý học sinh đã chọn, theo thứ tự chọn — đây là DÀN Ý đang hình thành.

    Giữ riêng chứ không lấy từ `guide`: `guide.ideas` chỉ còn những ý CHƯA dùng
    (đó là điểm của nó), nên nếu đọc dàn ý từ đó thì mỗi lần máy nhận ra một ý
    đã viết xong, ý ấy biến mất khỏi dàn ý — đúng lúc nó đáng được ghi nhận nhất.
  */
  /**
   * Nhật ký những câu đã nhận, THEO THỨ TỰ nhận.
   *
   * Mảng chứ không phải `Set`: hộp tóm tắt kể lại bài theo đúng trình tự em
   * viết, mà `Set` thì không giữ thứ tự. Thứ tự chính là thứ đáng xem — nó cho
   * thấy đoạn nào xong trước, và chỗ nào bỏ dở giữa chừng.
   */
  const [written, setWritten] = useState<{ idea: string; part: number }[]>([]);
  /*
    Con trỏ có đang ở CUỐI bài không.

    Chữ mờ chỉ được hiện khi con trỏ ở cuối: lớp chữ mờ nằm trên một `div` sao
    chép lại toàn bộ bài viết, và nó chỉ vẽ đúng chỗ khi gợi ý nối tiếp phần
    cuối cùng. Con trỏ đang ở giữa bài mà vẫn vẽ thì chữ mờ rơi lạc chỗ.
  */
  const [caretAtEnd, setCaretAtEnd] = useState(true);
  /** Học sinh đã bấm Esc để tắt gợi ý cho lần gõ này. */
  const [ghostOff, setGhostOff] = useState(false);
  /**
   * Phần đang CHỌN của đoạn: 0 chủ đề, 1 giải thích, 2 ví dụ.
   *
   * `shapePart` là thứ vừa bấm, `shownPart` là thứ đang được vẽ — cùng cặp
   * với `openIdea` / `shownIdea` và cùng lý do: đổi phần cũng là một lần đổi
   * màn, nên hộp cũ phải xẹp rồi hộp mới mới ráp lại. Không tách hai biến thì
   * nội dung đổi ngay trong lúc hộp cũ còn trên màn hình.
   */
  const [shapePart, setShapePart] = useState<number | null>(0);
  const [shownPart, setShownPart] = useState<number | null>(0);
  /*
    Những phần học sinh đã NHẬN, khoá `"<ý>:<phần>"`.

    Cần nó để vòng lặp biết đi tiếp: nhận xong câu chủ đề thì lần bí sau phải
    gợi "giải thích", không gợi lại đúng câu vừa chép. Và sơ đồ đánh dấu được
    phần nào đã có trong bài — đó chính là "diagram những gì user đã bấm".
  */

  /** Vùng sao chép bài viết, nằm dưới ô nhập để vẽ chữ mờ. */
  const mirror = useRef<HTMLDivElement>(null);
  /* Mốc của lần hỏi gần nhất, để biết đã đủ thay đổi để hỏi lại chưa. */
  const sent = useRef({ paras: -1, words: 0, at: 0 });
  /*
    Nhịp đếm lúc ngồi im. Tăng một nấc mỗi `IDLE_REPEAT_MS` KHÔNG GÕ; mỗi lần
    gõ là bộ đếm dựng lại từ đầu. Nằm trong `state` vì nó phải kích hoạt lại
    effect hỏi gợi ý — trên một bài không đổi thì không có gì khác làm việc đó.
  */
  const [idleTick, setIdleTick] = useState(0);
  /* Request đang bay, giữ để huỷ khi có request mới. */
  const inflight = useRef<AbortController | null>(null);
  /* Đã có gợi ý lần nào chưa. */
  const hasGuide = useRef(false);
  /*
    Số lần đã thử hỏi mà hỏng. Nằm trong `state` chứ không phải `ref` vì nó
    phải kích hoạt lại effect: trên trang trắng, `essay` không bao giờ đổi, nên
    nếu lần gọi đầu hỏng thì KHÔNG có gì chạy lại nữa — học sinh ngồi mãi không
    thấy gợi ý. Đúng lỗi đã gặp.
  */
  const [attempt, setAttempt] = useState(0);

  const words = useMemo(() => countWords(essay), [essay]);

  /*
    Khôi phục bản nháp sau khi mount (`sessionStorage` không tồn tại ở server),
    và CHỈ khi màn bìa nói đây là "viết tiếp". Bấm "viết lại từ đầu" mà bài cũ
    vẫn hiện lại thì cú bấm đó vô nghĩa.
  */
  useEffect(() => {
    if (!resume) return;
    const saved = readWritingDraft(prompt.id);
    if (saved) setEssay(saved);
  }, [prompt.id, resume]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(draftKey(prompt.id), essay);
    } catch {
      /* hết chỗ: không chặn việc viết */
    }
  }, [essay, prompt.id]);

  /* Đồng hồ chạy từ ký tự đầu tiên, không phải từ lúc mở trang — thời gian đọc
     đề không tính vào thời gian viết. */
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  /*
    Khi nào hỏi gợi ý: học sinh NGƯNG GÕ `STUCK_MS`, và bài đã khác lần hỏi
    trước. Không có nhịp nào khác — không hỏi theo số từ, không hỏi theo đoạn,
    không hỏi định kỳ.

    Đây là chỗ bản này khác hẳn bản trước. Bản trước hỏi cứ mỗi 8 giây khi
    đang viết, và đo ra 3 lần gọi cho 99 từ — nhưng cả 3 lần đều rơi vào lúc
    học sinh đang gõ ngon lành, tức là ba lần chen ngang không ai cần. Giờ mỗi
    lần hỏi đều ứng với một lần thật sự khựng lại.

    `essay` nằm trong deps nên mỗi phím gõ là một lần `clearTimeout` + đặt lại
    — đồng hồ 10 giây chỉ chạy hết khi tay thật sự rời bàn phím.

    `AbortController` vẫn giữ: học sinh gõ tiếp ngay sau khi hết 10 giây thì
    câu trả lời đang bay đã lạc hậu, huỷ rẻ hơn để nó về ghi đè.

    Chi phí: ~700 token mỗi lần ≈ $0,00003. Một bài 40 phút bí chừng 5–10 lần,
    tức khoảng một phần nghìn cent.
  */
  useEffect(() => {
    const words = countWords(essay);
    const paras = paragraphCount(essay);

    /*
      Lần đầu thì hỏi NGAY, không chờ 10 giây: bảng phải có chữ từ lúc trang
      vừa mở. Mười giây im lặng trước một màn hình trắng là đúng cái làm học
      sinh tưởng chỗ này hỏng.
    */
    const first = !hasGuide.current;
    const enoughChange =
      paras !== sent.current.paras ||
      words - sent.current.words >= MIN_NEW_WORDS;
    if (!first && !enoughChange) return;

    /*
      Ba nhịp khác nhau, và sự khác nhau là có lý do:
      - thử lại sau lỗi: 5 giây, đừng để học sinh chờ lâu vì mạng của mình;
      - trang còn trắng: 20 giây, xem chú thích ở `FIRST_IDLE_MS`;
      - đang viết dở: 10 giây, tức là đã khựng lại thật.
    */
    const delay =
      attempt > 0 ? RETRY_MS : words === 0 ? FIRST_IDLE_MS : STUCK_MS;

    /*
      Bật ngay từ phím đầu tiên, không đợi hết 10 giây. Học sinh phải thấy máy
      đang theo dõi TRONG LÚC viết — nếu chỉ hiện lúc gọi API thì suốt mười
      giây chờ màn hình đứng im, và cái vòng quay xuất hiện đột ngột trông như
      trang vừa lỗi gì đó.
    */
    // Trang còn trắng thì đừng hiện "sẽ đọc khi em dừng bút": em chưa viết gì
    // để mà dừng, và một vòng quay chạy suốt 20 giây chỉ làm rối mắt.
    if (!first && words > 0) {
      setPending(true);
    }

    const timer = window.setTimeout(() => {
      // Chốt lại ngay khi bắt đầu hỏi, để lần bí kế tiếp so với mốc này.
      sent.current = { paras, words, at: Date.now() };

      inflight.current?.abort();
      const ctl = new AbortController();
      inflight.current = ctl;

      setPending(false);
      setReading(true);
      trackWriting(prompt.id, essay, ctl.signal)
        .then((next) => {
          // `null` = server không đọc được lúc này. Giữ nguyên gợi ý đang hiện:
          // mất gợi ý giữa chừng khó chịu hơn nhiều so với gợi ý cũ một nhịp.
          if (!next) return;
          hasGuide.current = true;
          setAttempt(0);
          setGuide(next);
          /*
            GIỮ sơ đồ đang mở, kể cả khi ý đó đã rời khỏi danh sách gợi ý.

            Nó rời danh sách chính vì em vừa viết xong nó — đóng sơ đồ ngay lúc
            đó là xoá mất bản tóm tắt việc em vừa làm, đúng khoảnh khắc nó đáng
            xem nhất. Chỉ đóng khi chặng mới KHÔNG còn ý nào để gợi (kết bài,
            hoặc bài đã xong), vì lúc ấy lời dẫn mới là thứ cần đọc.
          */
          setOpenIdea((cur) => (cur && next.ideas.length > 0 ? cur : null));
        })
        .catch((err) => {
          // Bị huỷ vì học sinh gõ tiếp: không phải lỗi, và lần gõ đó đã đặt
          // lịch hỏi mới rồi — thử lại ở đây là gọi hai lần cho cùng một việc.
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (inflight.current !== ctl) return;
          if (attempt < MAX_RETRIES) setAttempt((a) => a + 1);
        })
        .finally(() => {
          // Chỉ dọn khi CHÍNH request này còn là request mới nhất. Request đã
          // bị huỷ mà vẫn tắt spinner thì cái đang chạy hoá ra không có báo.
          if (inflight.current === ctl) {
            inflight.current = null;
            setReading(false);
          }
        });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [essay, prompt.id, attempt]);

  /* Chu trình tháo → ráp mỗi khi ý đang mở đổi. */
  useEffect(() => {
    const sameIdea = openIdea === shownIdea;
    if (sameIdea && shapePart === shownPart) return;

    /*
      Đổi qua lại giữa ba phần của đoạn KHÔNG dựng lại hộp — chỉ đổi chữ mờ và
      vòng sáng. Hộp vẫn là hộp của ý đó, nội dung chỉ khác một dòng; tháo ra
      ráp lại là bắt mắt đi một vòng thừa cho một thay đổi nhỏ.

      Chu trình tháo → ráp chỉ chạy khi ĐỔI Ý, hoặc khi gợi ý bật/tắt — nhận
      xong thì hộp biến thành bản tóm tắt, đó là một màn khác hẳn.
    */
    const toggledSuggestion = (shapePart === null) !== (shownPart === null);
    if (sameIdea && !toggledSuggestion) {
      setShownPart(shapePart);
      return;
    }

    setExiting(true);
    setGhostOff(false);

    const timer = window.setTimeout(() => {
      setShownIdea(openIdea);
      // Mở ý khác thì quay về câu chủ đề — đó là chỗ bắt đầu một đoạn.
      if (!sameIdea) {
        setShapePart(0);
        setShownPart(0);
      } else {
        setShownPart(shapePart);
      }
      setExiting(false);
    }, HINT_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [openIdea, shownIdea, shapePart, shownPart]);

  /* Vào từ màn bìa là đã sẵn sàng viết — đặt con trỏ vào ô luôn, đỡ một cú bấm. */
  useEffect(() => {
    if (autoStart) area.current?.focus({ preventScroll: true });
  }, [autoStart]);

  /* Đồng hồ ngồi im: gõ một phím là `essay` đổi, effect dựng lại, đếm từ đầu. */
  useEffect(() => {
    const id = window.setInterval(
      () => setIdleTick((t) => t + 1),
      IDLE_REPEAT_MS,
    );
    return () => window.clearInterval(id);
  }, [essay]);

  /*
    Mỗi nhịp ngồi im: xoay sang gợi ý kế tiếp. Không gọi mạng — xem chú thích
    ở `IDLE_REPEAT_MS`.

    Vòng xoay đi hết ba phần của đoạn rồi mới sang ý khác, vì đó là thứ tự
    viết: biết câu chủ đề mà chưa biết viết tiếp gì thì cần "giải thích", chứ
    không cần một ý hoàn toàn mới.
  */
  useEffect(() => {
    if (idleTick === 0) return;
    const ideas = guide?.ideas ?? [];
    if (!ideas.length) return;

    if (shownIdea === null) {
      setOpenIdea(ideas[0].id);
      setShapePart(0);
      return;
    }

    /* Phần kế tiếp của ý này mà học sinh CHƯA nhận. */
    const from = shownPart === null ? -1 : shownPart;
    const next = PARAGRAPH_SHAPE.findIndex(
      (_, i) => i > from && !doneKeys.has(`${shownIdea}:${i}`),
    );
    if (next >= 0) {
      setShapePart(next);
      return;
    }

    /* Hết ba phần của ý này — sang ý kế tiếp, bắt đầu lại từ câu chủ đề. */
    const at = ideas.findIndex((i) => i.id === shownIdea);
    setOpenIdea(ideas[(at + 1) % ideas.length].id);
    setShapePart(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleTick]);

  /* Rời trang giữa chừng thì đừng để request treo lại. */
  useEffect(() => () => inflight.current?.abort(), []);

  const onChange = (value: string) => {
    // Chỉ còn dùng cho trường hợp không qua màn bìa (nhúng ở chỗ khác).
    if (!running && value.trim()) setRunning(true);
    setEssay(value);
    setGhostOff(false);
    const el = area.current;
    if (el) setCaretAtEnd(el.selectionStart === value.length);
  };

  /** Bấm chuột hay di chuyển con trỏ cũng phải cập nhật — không chỉ lúc gõ. */
  const onCaretMove = () => {
    const el = area.current;
    if (el) setCaretAtEnd(el.selectionStart === el.value.length);
  };

  /** Bản bài viết ứng với `band` đang giữ — để biết có cần chấm lại không. */
  const gradedEssay = useRef("");

  const runBand = async () => {
    if (banding) return;
    setBanding(true);
    setBand(null);
    setError(null);
    try {
      const res = await fetch("/api/practice/writing/band", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, essay }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chấm band thất bại.");
      setBand(data.writing as WritingState);
      gradedEssay.current = essay;

      /*
        Hướng dẫn tải SAU điểm và không chặn: điểm là thứ học sinh chờ, còn
        năm mục kia đọc sau. Hỏng thì bảng điểm vẫn đứng nguyên.
      */
      void fetch("/api/practice/writing/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, essay }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setCoach(d as CoachData))
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chấm band thất bại.");
    } finally {
      setBanding(false);
    }
  };

  /**
   * Nộp bài — LỐI VÀO DUY NHẤT của hộp thoại kết quả.
   *
   * Mở hộp thoại TRƯỚC rồi mới gọi chấm: chấm mất tới hàng chục giây, mở sau
   * khi có kết quả thì học sinh bấm xong nhìn một màn hình không nhúc nhích,
   * tưởng nút hỏng và bấm tiếp. Mở trước thì chỗ chờ có mặt ngay, và
   * `WritingBandReport` với `state={null}` đã là màn đang-chấm sẵn có.
   *
   * Bài KHÔNG đổi một chữ nào kể từ lần chấm trước thì mở lại đúng kết quả cũ,
   * không gọi lại dịch vụ. Đóng hộp thoại xem lại bài rồi nộp lại là thao tác
   * thường gặp; chấm lại mỗi lần vừa tốn một request tính tiền vừa có thể ra
   * con số khác chút, trông như máy chấm lung tung.
   */
  const submit = () => {
    setShowBand(true);
    if (band && essay === gradedEssay.current) return;
    void runBand();
  };

  /* Đóng khi đang chấm cũng được — request vẫn chạy, mở lại là thấy kết quả. */
  const closeBand = () => setShowBand(false);

  /*
    Esc đóng hộp thoại. Bắt ở `window` chứ không ở chính hộp thoại: không có
    phần tử nào trong đó nhận focus bắt buộc, nên nghe phím trên hộp là nghe
    hụt ngay lần bấm đầu.
  */
  useEffect(() => {
    if (!showBand) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowBand(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBand]);

  /*
    Tra trong `allIdeas`, không chỉ `guide.ideas`: một ý vừa được viết xong sẽ
    rời khỏi danh sách gợi ý, nhưng học sinh vẫn có quyền mở lại nó để xem
    khung câu. Danh sách này tích dần nên không bao giờ mất ý nào.
  */
  const allIdeas = useRef(new Map<string, Idea>());
  for (const i of guide?.ideas ?? []) allIdeas.current.set(i.id, i);
  const openQuestions = shownIdea
    ? (allIdeas.current.get(shownIdea) ?? null)
    : null;
  /** Tra nhanh "phần này viết chưa" cho các nút sơ đồ. */
  const doneKeys = new Set(written.map((w) => `${w.idea}:${w.part}`));
  /** Nhật ký để vẽ hộp tóm tắt: nhãn ý + nhãn phần, đúng thứ tự viết. */
  const journal = written.map((w) => ({
    key: `${w.idea}:${w.part}`,
    idea: allIdeas.current.get(w.idea)?.label ?? w.idea,
    part: PARAGRAPH_SHAPE[w.part]?.label ?? "",
    dot: PARAGRAPH_SHAPE[w.part]?.dot ?? "bg-brand",
  }));

  /*
    Chữ mờ hiện ra: khung câu của ý đang mở, nối tiếp ngay sau chỗ đang gõ.

    Không hiện khi con trỏ ở giữa bài (chữ mờ sẽ lạc chỗ), khi bài đã có sẵn
    khung đó, hoặc khi học sinh đã bấm Esc để tắt.
  */
  const part = shownPart === null ? null : PARAGRAPH_SHAPE[shownPart];
  const starter = part && openQuestions ? part.pick(openQuestions) : "";
  /*
    Câu chủ đề mở một ĐOẠN MỚI (hai dòng trống — đúng nhịp `paragraphCount`
    đếm); giải thích và ví dụ viết tiếp trong cùng đoạn, nên chỉ cách một dấu
    cách. Dùng chung một kiểu nối thì đoạn bị cắt làm ba.
  */
  const sep = essay.trim() ? (part?.newPara ? "\n\n" : " ") : "";
  const ghost =
    starter && caretAtEnd && !ghostOff && !essay.includes(starter)
      ? sep + starter
      : "";

  /** Nhận gợi ý: chép chữ mờ vào bài, rồi bôi đen ngay chỗ trống đầu tiên. */
  const acceptGhost = () => {
    if (!ghost) return;
    const base = essay.replace(/\s+$/, "");
    const next = (essay.trim() ? base : "") + ghost;
    setEssay(next);
    if (!running) setRunning(true);

    /*
      Nhận xong là TẮT gợi ý: bảng bên phải quay về chỉ còn sơ đồ, với phần
      vừa nhận đánh dấu xong. Để nguyên gợi ý đang bật thì học sinh nhìn thấy
      đúng câu vừa chép vẫn nằm đó mờ mờ — như thể chưa nhận được.

      Bí tiếp thì nhịp ngồi im bật lại, ở phần kế tiếp. Vòng lặp chạy tới khi
      hết ba phần rồi sang ý khác, rồi tới kết bài.
    */
    /*
      Ghi lúc NHẬN, không phải lúc bấm chip. Bấm chip mới chỉ là xem thử, và
      nhịp ngồi im cũng tự xoay sang ý khác — tính cả hai thứ đó thì hộp tóm
      tắt liệt kê những câu chưa hề có trong bài.
    */
    if (shownIdea !== null && shownPart !== null) {
      const idea = shownIdea;
      const part = shownPart;
      setWritten((w) =>
        w.some((x) => x.idea === idea && x.part === part)
          ? w
          : [...w, { idea, part }],
      );
    }
    setShapePart(null);

    /* Câu đã đủ chữ nên con trỏ về cuối, sẵn sàng viết câu tiếp theo. */
    requestAnimationFrame(() => {
      const el = area.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(next.length, next.length);
      setCaretAtEnd(true);
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!ghost) return;
    if (event.key === "Tab") {
      // Tab trong ô viết vốn là "nhảy sang nút kế" — nhưng khi có gợi ý thì
      // nhận gợi ý là việc người ta muốn làm hơn nhiều. Không có gợi ý thì
      // hàm này thoát ở dòng trên, nên Tab vẫn đi tiếp bình thường.
      event.preventDefault();
      acceptGhost();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setGhostOff(true);
    }
  };

  /** Ô nhập và vùng sao chép phải cuộn cùng nhau, nếu không chữ mờ trôi lệch. */
  const syncScroll = () => {
    if (mirror.current && area.current) {
      mirror.current.scrollTop = area.current.scrollTop;
    }
  };

  const reset = () => {
    if (!window.confirm("Xoá bài đang viết và bắt đầu lại?")) return;
    setEssay("");
    setResetKey((k) => k + 1);
    setBand(null);
    setShowBand(false);
    setSeconds(0);
    setRunning(false);
    setGuide(null);
    setOpenIdea(null);
    setShownIdea(null);
    setExiting(false);
    setWritten([]);
    setShapePart(0);
    setShownPart(0);
    hasGuide.current = false;
    setAttempt(0);
    setPending(false);
    setReading(false);
    sent.current = { paras: -1, words: 0, at: 0 };
    inflight.current?.abort();
    area.current?.focus();
  };

  const overTime = seconds > WRITING_MINUTES * 60;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
      <div className="min-w-0">
        <div className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-5 md:p-6">
          <span className="text-2xs font-bold uppercase tracking-[0.12em] text-brand">
            Writing Task 2 · {prompt.topic}
          </span>
          {/* `whitespace-pre-line` giữ đúng các dòng trống của đề gốc. Đề IELTS
              tách "You should spend about 40 minutes…" khỏi câu hỏi chính bằng
              dòng trống, gộp lại thành một khối chữ là học sinh đọc lướt mất
              chính câu hỏi. */}
          <p className="text-ink text-[15px] md:text-base leading-relaxed mt-3 whitespace-pre-line">
            {prompt.prompt}
          </p>
          <p className="text-2xs text-ink/45 mt-4">
            Viết ít nhất {WRITING_MIN_WORDS} từ trong khoảng {WRITING_MINUTES}{" "}
            phút, như thi thật.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                words >= WRITING_MIN_WORDS ? "text-brand" : "text-ink/50"
              }`}
            >
              {words}
              <span className="text-ink/35 font-medium">
                {" "}
                / {WRITING_MIN_WORDS} từ
              </span>
            </span>
            <span
              className={`flex items-center gap-1.5 font-mono text-sm tabular-nums ${
                overTime ? "text-warn" : "text-ink/45"
              }`}
            >
              <Timer size={14} />
              {clock(seconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-2xs font-medium text-ink/45 hover:text-brand cursor-pointer transition-colors"
          >
            <RotateCcw size={12} />
            Viết lại từ đầu
          </button>
        </div>

        {/*
          Ô viết + lớp chữ mờ.

          `<textarea>` không cho tô màu một phần chữ bên trong, nên gợi ý được
          vẽ ở một `<div>` NẰM DƯỚI, chép lại y nguyên bài viết bằng chữ trong
          suốt rồi nối thêm phần gợi ý màu nhạt. Ô nhập đặt lên trên với nền
          trong suốt, nên hai lớp chồng khít và con trỏ vẫn là con trỏ thật.

          Vì là hai lớp nên MỌI thứ ảnh hưởng tới vị trí chữ phải giống hệt
          nhau: cỡ chữ, `leading`, `padding`, độ dày viền, `white-space`. Lệch
          một pixel là chữ mờ lệch một pixel — và mắt nhận ra ngay.
        */}
        <div className="relative mt-3">
          <div
            ref={mirror}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl border border-transparent p-5 text-[15px] leading-[1.9] whitespace-pre-wrap break-words"
          >
            <span className="invisible">{essay}</span>
            {ghost && <span className="text-ink/30">{ghost}</span>}
          </div>

          <textarea
            ref={area}
            id="writing-essay"
            value={essay}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onClick={onCaretMove}
            onKeyUp={onCaretMove}
            onSelect={onCaretMove}
            onScroll={syncScroll}
            spellCheck={false}
            placeholder={ghost ? "" : "Bắt đầu viết ở đây."}
            className="relative w-full min-h-[460px] rounded-2xl border border-black/10 bg-transparent p-5 text-[15px] leading-[1.9] text-ink placeholder:text-ink/25 focus:outline-none focus:border-brand/40 transition-colors resize-y"
          />
        </div>

        {!ghost && shownIdea && (
          <p className="mt-2 text-2xs text-ink/40">
            Bí tiếp thì cứ dừng bút — bảng bên phải sẽ gợi phần kế tiếp của
            đoạn.
          </p>
        )}

        {ghost && (
          <p className="mt-2 flex items-center gap-2 text-2xs text-ink/40">
            <kbd className="rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/60">
              Tab
            </kbd>
            nhận gợi ý<span className="text-ink/25">·</span>
            <kbd className="rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/60">
              Esc
            </kbd>
            bỏ qua
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={banding || words < WRITING_CHECKABLE_WORDS}
            className="flex items-center justify-center gap-2 rounded-full bg-brand hover:bg-brand-deep disabled:bg-black/15 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white cursor-pointer transition-colors"
          >
            {banding ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin motion-reduce:animate-none"
                />
                Đang chấm…
              </>
            ) : (
              <>
                <PenLine size={16} />
                Nộp bài
              </>
            )}
          </button>
          {words < WRITING_CHECKABLE_WORDS && (
            <span className="text-2xs text-ink/40">
              Viết được khoảng {WRITING_CHECKABLE_WORDS} từ rồi nộp sẽ có ích
              hơn.
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </p>
        )}

        {/*
          Kết quả chấm hiện trong HỘP THOẠI phủ kín màn hình, không phải một
          khối dưới ô viết.

          Nộp bài là lúc học sinh dừng bút, và con số band là thứ duy nhất đáng
          đọc lúc đó — để nó nằm lẫn dưới ô viết thì phải cuộn đi tìm, mà phía
          trên vẫn còn đề, đồng hồ, gợi ý tranh mắt. Nền mờ đi là để nói: đọc
          xong cái này đã.

          Lớp phủ `fixed` là NGOẠI LỆ hợp lệ của luật "không cuộn lồng nhau"
          (xem CLAUDE.md): bảng band dài hơn màn hình mà trang nền thì không
          với tới được, nên chính lớp phủ phải cuộn.

          Cắm thẳng vào `document.body` qua portal. Để nguyên tại chỗ thì header
          dính (`fixed z-50`) vẽ ĐÈ lên nền mờ — đã đo thấy — vì lớp phủ nằm
          trong một ngữ cảnh xếp lớp con của trang. Ra `body` thì chỉ còn so
          z-index với header, và `z-[110]` ăn đứt.
        */}
        {mounted &&
          showBand &&
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Kết quả chấm bài"
              onClick={closeBand}
              data-lenis-prevent
              className="fixed inset-0 z-[110] overflow-y-auto bg-ink/50 backdrop-blur-sm px-4 py-10 flex items-start justify-center"
            >
              <div
                /* Bấm trong bảng không được tính là bấm ra ngoài để đóng. */
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl rounded-2xl bg-white p-5 md:p-7 shadow-xl"
              >
                <button
                  type="button"
                  onClick={closeBand}
                  aria-label="Đóng"
                  className="absolute right-4 top-4 rounded-full p-2 text-ink/40 hover:bg-black/5 hover:text-ink cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
                <WritingBandReport
                  state={banding ? null : band}
                  essay={essay}
                  minWords={WRITING_MIN_WORDS}
                  caption="band tham khảo cho bài này"
                  emptyText="Chưa có chữ nào để chấm."
                  footnote="Band này do máy chấm theo bốn tiêu chí, dùng để ước lượng mình đang ở đâu. Bài vẫn cần cô Thương chấm theo barem — máy không đọc được ý hay, cũng không biết em đã tiến bộ tới đâu."
                  onRetry={runBand}
                  retrying={banding}
                  issues={coach ? coach.issues : undefined}
                />

                {coach && (
                  <div className="mt-6 border-t border-sage pt-6">
                    <EssayCoachPanel data={coach} />
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>

      {/*
        Bảng gợi ý chỉ làm MỘT việc: gợi ý lúc đang viết. Checklist đã dọn sang
        hộp riêng (`ChecklistPanel`) — trước đây hai thứ tranh nhau khung này,
        và muốn vừa xem lỗi vừa xem dàn ý thì phải bấm qua bấm lại.

        Cố ý KHÔNG có bảng tiến độ, không tick "x/5 đoạn". Việc theo dõi chạy ở
        server và chỉ lộ ra ở một chỗ: gợi ý nào được hiện. Đã thử bày ra thành
        checklist các chặng và đó là thứ biến trang viết thành cái bảng điều
        khiển — học sinh đi tick cho đủ thay vì viết.
      */}
      {/*
        Cột phải: bảng gợi ý ở trên, kiến thức nền ở dưới. Cả cột cùng dính khi
        cuộn, nên học sinh kéo bài dài tới đâu thì hai hộp vẫn theo tới đó.
      */}
      <div className="lg:sticky lg:top-24 lg:w-[380px] flex flex-col gap-4">
        {/*
        Trạng thái đọc nằm ở VIỀN của bảng, không ở một con quay trong tiêu đề
        — xem chú thích `panel-reading` trong `globals.css`.
      */}
        <aside
          /*
          Cột phải DÍNH theo màn hình, nên hộp dài hơn viewport là phần cuối
          không cách nào đọc tới — nó không trôi theo trang. Vì vậy chặn chiều
          cao và cho cuộn bên trong; `data-lenis-prevent` + lớp `panel-scroll`
          là cặp bắt buộc, xem chú thích trong `globals.css`.
        */
          data-lenis-prevent
          className={`panel-scroll w-full lg:max-h-[52vh] rounded-2xl border bg-white p-5 md:p-6 shadow-sm ${
            reading
              ? "panel-reading"
              : pending
                ? "panel-waiting"
                : "border-black/5"
          }`}
        >
          <>
            <span className="text-2xs font-bold uppercase tracking-[0.12em] text-ink/45 flex items-center gap-1.5">
              <Lightbulb size={13} />
              Gợi ý ý tưởng
            </span>

            {!guide ? (
              <p className="mt-4 text-sm text-ink/45 leading-relaxed">
                {attempt >= MAX_RETRIES
                  ? "Chưa lấy được gợi ý — có thể mạng đang trục trặc. Bài viết của em vẫn giữ nguyên, và phần kiểm tra nháp vẫn dùng được."
                  : "Cứ đọc đề và bắt đầu viết. Khi nào bí, dừng bút một lát là gợi ý hiện ra ở đây."}
              </p>
            ) : (
              <>
                {/*
                  Hai màn thay nhau trong cùng một chỗ, không bao giờ cùng
                  hiện. Trước đây sơ đồ nằm DƯỚI dãy chip, nên bấm xong bảng
                  dài ra và phần quan trọng nhất — sơ đồ vừa ráp — bị đẩy xuống
                  khỏi tầm mắt. Giờ nó chiếm đúng chỗ của dãy chip.
                */}
                {shownIdea === null ? (
                  <div className={exiting ? "hint-box--out" : "hint-box"}>
                    <h2 className="mt-3 text-[17px] font-bold tracking-tight text-ink leading-snug">
                      {guide.title}
                    </h2>
                    <p className="mt-1.5 text-[13.5px] text-ink/70 leading-relaxed">
                      {guide.body}
                    </p>

                    {guide.ideas.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {guide.ideas.map((idea: Idea) => (
                          <button
                            key={idea.id}
                            type="button"
                            onClick={() => setOpenIdea(idea.id)}
                            className="rounded-full border border-brand/35 bg-white px-3.5 py-2 text-[13px] font-semibold text-brand cursor-pointer transition-colors hover:bg-brand/[0.06] hover:border-brand/60"
                          >
                            {idea.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : openQuestions && shownPart === null ? (
                  /*
                    HỘP TÓM TẮT — hiện sau khi nhận một câu.

                    Chỉ kể lại bài theo đúng thứ tự đã viết, không có câu hỏi
                    gợi ý và không có ba nút chọn phần. Hai việc khác nhau thì
                    hai hộp khác nhau: lúc đang bí thì cần gợi, lúc vừa viết
                    xong thì cần thấy mình đang ở đâu.
                  */
                  <div
                    key={`${openQuestions.id}:done`}
                    className={`rounded-xl bg-mist p-4 flex flex-col gap-3 ${
                      exiting ? "hint-box--out" : "hint-box"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="hint-step text-xs font-bold text-brand"
                        style={{ "--i": 0 } as CSSProperties}
                      >
                        Bài của em đã có
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenIdea(null)}
                        className="hint-step flex items-center gap-1 text-2xs font-semibold text-ink/45 hover:text-brand cursor-pointer transition-colors"
                        style={{ "--i": 0 } as CSSProperties}
                      >
                        <ArrowLeft size={12} />
                        Chọn ý khác
                      </button>
                    </div>

                    {/* Mốc thời gian dọc: mỗi câu đã nhận là một mốc, theo đúng
                        thứ tự viết. Đường nối vẽ sau khi các mốc đã vào chỗ. */}
                    <div className="relative pl-5">
                      <span
                        aria-hidden
                        className="hint-rail absolute left-[7px] top-2 bottom-2 w-px bg-brand/25"
                      />
                      <ol className="flex flex-col gap-2">
                        {journal.map((row, i) => (
                          <li
                            key={row.key}
                            className="hint-step relative flex items-baseline gap-2"
                            style={{ "--i": i + 1 } as CSSProperties}
                          >
                            <span
                              aria-hidden
                              className={`absolute -left-5 top-1.5 h-[9px] w-[9px] rounded-full ${row.dot}`}
                            />
                            <span className="font-mono text-[10px] tabular-nums text-ink/35">
                              {i + 1}
                            </span>
                            <span className="text-[13px] font-semibold text-ink">
                              {row.idea}
                            </span>
                            <span className="text-2xs text-ink/50">
                              · {row.part}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <p
                      className="hint-step text-2xs text-ink/45 leading-relaxed"
                      style={{ "--i": journal.length + 1 } as CSSProperties}
                    >
                      Viết tiếp bằng lời của em. Bí thì cứ dừng bút — gợi ý sẽ
                      hiện lại.
                    </p>
                  </div>
                ) : openQuestions ? (
                  <div
                    // `key` để sang ý khác là dựng lại từ đầu, animation ráp chạy lại.
                    // Khoá gồm cả phần đang chọn: bấm "Giải thích" cũng là
                    // một hộp mới, nên animation ráp phải chạy lại.
                    // Khoá chỉ đổi khi sang ý khác hoặc khi gợi ý bật/tắt —
                    // đổi phần thì hộp giữ nguyên, không ráp lại.
                    key={`${openQuestions.id}:${shownPart === null ? "done" : "live"}`}
                    className={`rounded-xl bg-mist p-4 flex flex-col gap-3.5 ${
                      exiting ? "hint-box--out" : "hint-box"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="hint-step text-xs font-bold text-brand"
                        style={{ "--i": 0 } as CSSProperties}
                      >
                        {openQuestions.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenIdea(null)}
                        className="hint-step flex items-center gap-1 text-2xs font-semibold text-ink/45 hover:text-brand cursor-pointer transition-colors"
                        style={{ "--i": 0 } as CSSProperties}
                      >
                        <ArrowLeft size={12} />
                        Chọn ý khác
                      </button>
                    </div>

                    {/*
                      Hai câu hỏi tự vấn chỉ có nghĩa khi ĐANG gợi ý. Nhận câu
                      xong rồi mà vẫn để chúng đó thì bảng vẫn trông như đang
                      mời làm tiếp việc vừa làm xong — lúc này chỉ còn sơ đồ,
                      để em thấy đoạn của mình đã có gì và còn thiếu gì.
                    */}
                    {shownPart !== null && (
                      <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-[13px] text-ink/80 leading-relaxed">
                        {openQuestions.questions.map((q, i) => (
                          <li
                            key={q}
                            className="hint-step"
                            style={{ "--i": i + 1 } as CSSProperties}
                          >
                            {q}
                          </li>
                        ))}
                      </ol>
                    )}

                    {/*
                      Ba lựa chọn, RÁP từng mảnh: mỗi nút bay vào từ một phía
                      rồi khớp lại. Cùng bay từ một phía thì thành danh sách
                      trượt xuống, không ra cảm giác lắp ghép.

                      Cố ý KHÔNG có đường nối và chấm mốc như hộp tóm tắt: ở
                      đây ba nút là ba LỰA CHỌN song song, bấm cái nào cũng
                      được. Vẽ đường nối là ngụ ý phải đi theo thứ tự, mà đó là
                      chuyện của hộp tóm tắt — nơi thứ tự có thật.
                    */}
                    <ul className="flex flex-col gap-2">
                      {PARAGRAPH_SHAPE.map((step, i) => (
                        <li key={step.label}>
                          <button
                            type="button"
                            aria-pressed={shownPart === i}
                            onClick={() => {
                              setShapePart(i);
                              setGhostOff(false);
                              area.current?.focus({ preventScroll: true });
                            }}
                            className={`hint-piece ${step.from} w-full text-left rounded-lg px-3 py-2 cursor-pointer transition-shadow ${step.box} ${
                              shownPart === i
                                ? "ring-2 ring-offset-1 ring-brand/60"
                                : "hover:ring-2 hover:ring-offset-1 hover:ring-brand/25"
                            } ${
                              // Phần đã có trong bài thì lùi lại một bước để
                              // phần chưa viết nổi lên.
                              shownIdea &&
                              doneKeys.has(`${shownIdea}:${i}`) &&
                              shownPart !== i
                                ? "opacity-55"
                                : ""
                            }`}
                            style={
                              {
                                minHeight: step.height,
                                "--d": 200 + i * 90,
                              } as CSSProperties
                            }
                          >
                            <span className="flex items-center gap-1.5 text-2xs font-bold leading-tight">
                              {shownIdea &&
                                doneKeys.has(`${shownIdea}:${i}`) && (
                                  <Check size={11} className="shrink-0" />
                                )}
                              {step.label}
                            </span>
                            <span className="block text-2xs font-medium opacity-70 leading-tight mt-0.5">
                              {shownPart === i
                                ? "đang gợi ý — Tab để nhận"
                                : shownIdea && doneKeys.has(`${shownIdea}:${i}`)
                                  ? "đã viết"
                                  : step.hint}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {guide.warning && (
                  <p className="mt-3 flex items-start gap-2.5 rounded-xl border border-warn bg-warn-soft px-3.5 py-3 text-[12.5px] leading-relaxed">
                    <AlertTriangle
                      size={15}
                      className="shrink-0 mt-0.5 text-warn"
                    />
                    <span>{guide.warning}</span>
                  </p>
                )}
              </>
            )}

            <p className="mt-5 pt-3 border-t border-black/5 text-2xs text-ink/40 leading-relaxed">
              Gợi ý do cô Thương soạn sẵn cho đề này. Máy chỉ đọc bài để chọn
              gợi ý khớp với chỗ em đang viết — không viết thay em, và không
              chấm điểm.
            </p>
          </>
        </aside>

        <KnowledgePanel promptId={prompt.id} topics={knowledge} />

        {/* Kiểm tra nháp ở dưới cùng cột phải: nó là việc làm SAU khi đã viết
            được một đoạn, nên đứng sau hai hộp phục vụ lúc đang viết. */}
        <ChecklistPanel
          key={resetKey}
          promptId={prompt.id}
          essay={essay}
          words={words}
        />
      </div>
    </div>
  );
}
