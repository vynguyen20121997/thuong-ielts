import type { AreaResult, Profile, Report, Section } from "./types";
import {
  DEFAULT_DAILY_MINUTES,
  STUDY_DAYS_PER_WEEK,
  monthsUntilExam,
} from "./profile";

/*
  Lộ trình ôn tập để đi tới MỤC TIÊU IELTS của học sinh.

  Chia vai cho rõ, vì đây là chỗ dễ nhầm nhất:
  - Bài kiểm tra nền chỉ trả lời "đang ở đâu": nền Grammar/Vocab còn hổng chỗ
    nào, Listening/Reading đang yếu dạng nào. Nó quyết định ĐIỂM KHỞI HÀNH và
    chặng đầu dài bao lâu — không phải đích đến.
  - Mục tiêu band quyết định ĐÍCH: phải luyện đủ cả bốn kỹ năng, kể cả Writing
    và Speaking, hai thứ bài này không đo được một câu nào.

  Vì vậy lộ trình luôn có chặng Writing/Speaking dù bài kiểm tra im lặng về
  chúng, và các chặng đều nói bằng ngôn ngữ phòng thi thật (Task 1/Task 2,
  Part 1–3, full test 4 kỹ năng), chứ không phải "làm lại 53 câu này cho đúng".
  Đừng viết câu kiểu "bạn đang 5.0, sẽ lên 6.5": bài không có Writing/Speaking
  nên không có cơ sở quy đổi band đầu vào.
*/

export type Skill =
  "Nền tảng" | "Listening" | "Reading" | "Writing" | "Speaking";

export type Standing = {
  section: Section;
  correct: number;
  total: number;
  ratio: number;
};

export type Phase = {
  id: string;
  title: string;
  subtitle: string;
  skills: Skill[];
  months: number;
  startMonth: number;
  endMonth: number;
  aim: string;
  /* Vì sao chặng này nằm ở đây — lấy từ bài kiểm tra, có thì hiện. */
  because: string;
  areas: AreaResult[];
  steps: string[];
  checkpoint: string;
};

export type Roadmap = {
  target: string;
  targetBand: number | null;
  /* 0 = nền còn yếu, 1 = nền trung bình, 2 = nền khá vững. */
  startTier: 0 | 1 | 2;
  tierLabel: string;
  needRatio: number;
  current: { correct: number; total: number; ratio: number };
  totalMonths: number;
  /* Nhịp học thật, suy từ thời gian tự học học sinh tự khai. */
  hoursPerWeek: number;
  /* Nhịp học nên có cho mục tiêu này; thấp hơn thì lộ trình dài ra. */
  recommendedHoursPerWeek: number;
  /*
    Ngày thi tự khai đến sớm hơn lộ trình bao nhiêu. null = không vướng.
    CỐ Ý không rút ngắn lộ trình cho vừa ngày thi: nhồi việc của 8 tháng vào 3
    tháng rồi vẫn ghi "8 chặng" là hứa suông. Thay vào đó nêu đúng cái giá —
    học bao nhiêu giờ mỗi tuần, hoặc lùi ngày thi.
  */
  deadline: {
    months: number;
    shortBy: number;
    neededHoursPerWeek: number;
  } | null;
  finishBy: Date;
  standings: Standing[];
  phases: Phase[];
  notes: string[];
};

/*
  Tổng thời lượng (THÁNG) cho người có nền trung bình. Con số đi từ mức thông
  dụng trong dạy IELTS: mỗi 0.5 band cần cỡ 150–200 giờ học thật, nên band
  càng cao thì lộ trình càng dài không tuyến tính. Sửa bảng này là sửa độ dài
  của mọi lộ trình — đừng rải số tháng trong UI.

  Đơn vị là tháng, không phải tuần: học sinh và phụ huynh lên kế hoạch theo
  tháng ("thi tháng 6"), và một chặng dưới một tháng thì không đủ để thấy thay
  đổi ở kỹ năng nào cả.
*/
const BASE_MONTHS: Record<string, number> = {
  "5.0": 3,
  "5.5": 4,
  "6.0": 5,
  "6.5": 6,
  "7.0": 8,
  "7.5": 10,
  "8.0": 12,
  "8.5+": 14,
};
const DEFAULT_BASE_MONTHS = 5;

/*
  Mức vững của phần NỀN (grammar, vocab, kỹ năng đọc–nghe cơ bản) nên có trước
  khi dồn sức vào luyện đề, ứng với từng mục tiêu. Đây là ngưỡng đọc trên bài
  kiểm tra nền, không phải bảng quy đổi band.
*/
const NEED: Record<string, number> = {
  "5.0": 0.55,
  "5.5": 0.65,
  "6.0": 0.72,
  "6.5": 0.8,
  "7.0": 0.87,
  "7.5": 0.92,
  "8.0": 0.95,
  "8.5+": 0.97,
};
const DEFAULT_NEED = 0.75;

const VOCAB_SUMMARY = "R_VOCABULARY_OVERALL";
const TIER_LABELS = ["nền còn yếu", "nền trung bình", "nền khá vững"];

const missRate = (a: AreaResult) =>
  a.total ? (a.total - a.correct) / a.total : 0;

/* Nhóm yếu nhất lên trước; cùng mức thì nhóm sai nhiều hơn lên trước. */
const bySeverity = (a: AreaResult, b: AreaResult) =>
  a.level - b.level || missRate(b) - missRate(a) || b.total - a.total;

const listNames = (areas: AreaResult[]) => areas.map((a) => a.name).join("; ");

export function buildRoadmap(
  report: Report,
  profile: Profile,
  from: Date = new Date(),
): Roadmap {
  const sections: Section[] = ["Listening", "Reading", "Grammar"];
  const scored = report.areas.filter((a) => a.id !== VOCAB_SUMMARY);
  const vocab = report.areas.find((a) => a.id === VOCAB_SUMMARY);

  const standings: Standing[] = sections.map((section) => {
    const group = scored.filter((a) => a.section === section);
    const correct = group.reduce((n, a) => n + a.correct, 0);
    const total = group.reduce((n, a) => n + a.total, 0);
    return { section, correct, total, ratio: total ? correct / total : 0 };
  });

  const correct = standings.reduce((n, s) => n + s.correct, 0);
  const total = standings.reduce((n, s) => n + s.total, 0);
  const ratio = total ? correct / total : 0;

  const targetBand = Number.parseFloat(profile.target);
  const needRatio = NEED[profile.target] ?? DEFAULT_NEED;
  const startTier: 0 | 1 | 2 = ratio < 0.45 ? 0 : ratio < 0.7 ? 1 : 2;

  const weak = scored.filter((a) => a.level === 0).sort(bySeverity);
  const mid = scored.filter((a) => a.level === 1).sort(bySeverity);
  const grammarGaps = weak.filter((a) => a.section === "Grammar");
  const receptiveGaps = [...weak, ...mid]
    .filter((a) => a.section !== "Grammar")
    .slice(0, 4);

  /* Nền yếu thì phải bù thêm thời gian; nền vững thì đi nhanh hơn. */
  const tierFactor = startTier === 0 ? 1.35 : startTier === 1 ? 1 : 0.8;
  const recommendedHoursPerWeek =
    !Number.isNaN(targetBand) && targetBand >= 7
      ? 10
      : !Number.isNaN(targetBand) && targetBand >= 6
        ? 8
        : 6;
  const dailyMinutes = profile.dailyMinutes || DEFAULT_DAILY_MINUTES;
  const hoursPerWeek =
    Math.round(((dailyMinutes * STUDY_DAYS_PER_WEEK) / 60) * 10) / 10;
  /*
    Học ít hơn mức nên có thì lộ trình dài ra theo đúng tỉ lệ, chứ không phải
    học ít mà vẫn xong đúng hạn. Chặn ở gấp đôi để con số còn dùng được: dưới
    mức đó thì vấn đề không còn là lịch học nữa.
  */
  const paceFactor = Math.min(
    2,
    Math.max(1, recommendedHoursPerWeek / Math.max(hoursPerWeek, 1)),
  );
  /* Số tháng nếu học ĐÚNG nhịp khuyến nghị — mốc để tính khối lượng thật. */
  const monthsAtFullPace = Math.round(
    (BASE_MONTHS[profile.target] ?? DEFAULT_BASE_MONTHS) * tierFactor,
  );
  const wantedMonths = Math.round(monthsAtFullPace * paceFactor);

  const needsFoundation = startTier === 0 || grammarGaps.length > 0;
  const goalText = Number.isNaN(targetBand)
    ? "mục tiêu bạn chọn sau"
    : `IELTS ${profile.target}`;
  const writingTarget = Number.isNaN(targetBand)
    ? "mức mục tiêu"
    : `band ${Math.max(5, targetBand - 0.5)}`;

  type Draft = Omit<Phase, "startMonth" | "endMonth" | "months"> & {
    weight: number;
  };
  const drafts: Draft[] = [];

  if (needsFoundation) {
    drafts.push({
      id: "foundation",
      title: "Nền ngữ pháp & từ vựng",
      subtitle: "Bù phần thiếu trước khi chạm vào đề thi",
      skills: ["Nền tảng"],
      /*
        Nền yếu thì chặng này phải dài. Nền đã ổn mà chỉ hổng một, hai nhóm
        ngữ pháp thì đừng bắt học lại cả nền — tỉ trọng chạy theo số nhóm hổng.
      */
      weight: startTier === 0 ? 0.24 : Math.min(0.2, 0.06 * grammarGaps.length),
      aim: `Viết và nói được câu đúng ngữ pháp ở các cấu trúc nền, và đọc/nghe không bị chặn vì thiếu từ — điều kiện để các chặng sau tiến được về ${goalText}.`,
      because: grammarGaps.length
        ? `Bài kiểm tra cho thấy đang hổng: ${listNames(grammarGaps.slice(0, 4))}.`
        : `Bài kiểm tra cho thấy nền chung còn yếu (đúng ${correct}/${total} câu), nên chặng này dài hơn bình thường.`,
      areas: grammarGaps.slice(0, 4),
      steps: [
        "Mỗi tuần một nhóm ngữ pháp: học lại quy tắc, rồi tự viết 10 câu của mình và nhờ chữa.",
        "Từ vựng theo chủ đề IELTS (education, environment, technology, health…): 20–25 từ/tuần, học cả collocation và cách phát âm.",
        "Nghe/đọc tài liệu dễ hơn trình độ đề thi mỗi ngày 20 phút để cấu trúc và từ mới thành phản xạ.",
      ],
      checkpoint:
        "Viết một đoạn 150 từ về chủ đề bất kỳ, người chữa không còn phải sửa lỗi ngữ pháp cơ bản.",
    });
  }

  drafts.push({
    id: "orientation",
    title: "Làm quen đề thi 4 kỹ năng",
    subtitle: "Biết đề thi yêu cầu gì rồi mới luyện",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    weight: 0.13,
    aim: `Nắm cấu trúc bài thi và tiêu chí chấm của cả bốn kỹ năng, đặc biệt là barem Writing và Speaking — biết ${goalText} đòi hỏi gì ở từng phần.`,
    because:
      "Bài kiểm tra nền chỉ chạm Listening, Reading và Grammar; Writing và Speaking bắt đầu từ con số 0 thông tin.",
    areas: [],
    steps: [
      "Đọc barem Writing Task 1/Task 2 và Speaking Part 1–3, diễn giải lại bằng lời của mình.",
      "Làm thử mỗi kỹ năng một bài ngắn, không tính điểm, để biết mình lúng túng ở đâu.",
      "Chốt lịch học cố định trong tuần và nguồn tài liệu chuẩn (Cambridge IELTS là gốc).",
    ],
    checkpoint:
      "Nói được yêu cầu của từng phần thi và tự chỉ ra hai kỹ năng mình yếu nhất.",
  });

  drafts.push({
    id: "receptive",
    title: "Luyện Listening & Reading theo dạng",
    subtitle: "Mỗi dạng câu hỏi một quy trình làm",
    skills: ["Listening", "Reading"],
    weight: 0.24,
    aim: "Làm được từng dạng câu hỏi với quy trình cố định: biết tìm gì trước, bẫy paraphrase nằm ở đâu, khi nào nên bỏ câu.",
    because: receptiveGaps.length
      ? `Ưu tiên theo bài kiểm tra: ${listNames(receptiveGaps)}.`
      : "Bài kiểm tra chưa chỉ ra dạng nào yếu rõ rệt, nên luyện lần lượt đủ các dạng.",
    areas: receptiveGaps,
    steps: [
      "Luyện theo cụm cùng dạng (10–15 câu), chưa bấm giờ, bắt buộc ghi lý do chọn đáp án.",
      "Đúng đáp án mà sai lý do vẫn tính là sai — soi lại chỗ paraphrase để hiểu vì sao.",
      "Mỗi tuần một bài Listening và một bài Reading nguyên phần, có bấm giờ, để ghép lại.",
    ],
    checkpoint:
      "Làm nguyên một phần Listening và một phần Reading trong thời gian chuẩn, không bỏ trống câu nào.",
  });

  drafts.push({
    id: "productive",
    title: "Writing & Speaking chuyên sâu",
    subtitle: "Phần cần người chấm, không tự đo được",
    skills: ["Writing", "Speaking"],
    weight: 0.24,
    aim: `Viết được Task 1 và Task 2 đủ ý, đúng bố cục, đúng giờ; nói được Part 2 hai phút không ngắt — nhắm ${writingTarget} trở lên ở hai kỹ năng này.`,
    because:
      "Đây là chặng bài kiểm tra không nói được gì, và cũng là chặng nhiều người tự học đứng lại lâu nhất vì không ai chữa bài.",
    areas: [],
    steps: [
      "Writing: 2 bài/tuần (1 Task 1 + 1 Task 2) có giáo viên hoặc người chấm theo barem, sửa xong viết lại bản thứ hai.",
      "Speaking: ghi âm 3 lần/tuần theo bộ đề Part 1–3, nghe lại tự chấm fluency và phát âm rồi nhờ nhận xét.",
      "Lập sổ mẫu câu và ý theo chủ đề, dùng lại chính từ vựng đã học ở chặng nền.",
    ],
    checkpoint:
      "Ba bài Writing liên tiếp không còn lỗi bố cục/lạc đề, và nói trôi Part 2 trong hai phút mà không dừng giữa câu.",
  });

  drafts.push({
    id: "fulltest",
    title: "Luyện đề & chiến thuật thời gian",
    subtitle: "Ghép bốn kỹ năng vào một buổi thi",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    weight: 0.13,
    aim: "Làm trọn bộ đề Cambridge trong đúng thời gian thật, sai ở đâu biết ngay là do kiến thức hay do hết giờ.",
    because:
      "Sức bền và cách chia thời gian chỉ hiện ra khi làm nguyên bài thi, không hiện ra trong bài kiểm tra nền 45 phút.",
    areas: [],
    steps: [
      "Mỗi tuần một full test Listening + Reading đúng giờ, không tạm dừng.",
      "Writing đúng 60 phút cho hai task; Speaking thi thử với người khác.",
      "Chấm rồi phân loại lỗi: không biết kiến thức / không kịp giờ / đọc sót đề — chỉ nhóm đầu mới quay lại ôn.",
    ],
    checkpoint:
      "Hai full test liên tiếp hoàn thành trong giờ và số câu bỏ trống bằng 0.",
  });

  drafts.push({
    id: "mock",
    title: "Thi thử toàn phần & chốt lịch thi",
    subtitle: "Đo lại bằng bài đủ 4 kỹ năng",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    weight: 0.06,
    aim: `Thi thử đủ bốn kỹ năng có người chấm Writing/Speaking để biết đã tới ${goalText} chưa, rồi mới đăng ký thi thật.`,
    because:
      "Chỉ một buổi thi thử đầy đủ mới cho ra band ước lượng đáng tin; bài kiểm tra nền không làm được việc đó.",
    areas: [],
    steps: [
      "Thi thử một buổi liền mạch, đúng trình tự và thời gian của kỳ thi thật.",
      "Nhận điểm từng kỹ năng, so với mục tiêu, tìm kỹ năng còn cách đích xa nhất.",
      "Còn thiếu thì quay lại chặng của kỹ năng đó; đã đạt thì đăng ký thi và giữ nhịp luyện nhẹ.",
    ],
    checkpoint: `Band ước lượng của cả bốn kỹ năng đạt ${goalText}, không kỹ năng nào thấp hơn mục tiêu quá 0.5.`,
  });

  /*
    Chia số tháng theo tỉ trọng, chặng nào cũng ít nhất một tháng — nên tổng
    không thể ngắn hơn số chặng. Mục tiêu thấp mà nền đã vững thì `wantedMonths`
    có thể rơi xuống dưới ngưỡng đó; khi ấy lấy ngưỡng, vì sáu chặng không thể
    nhồi vào hai tháng.
  */
  const totalMonths = Math.max(wantedMonths, drafts.length);
  const weightSum = drafts.reduce((n, d) => n + d.weight, 0);
  /*
    Chia tháng theo phần dư lớn nhất, chặng nào cũng tối thiểu một tháng. Cách
    cũ dồn phần lẻ vào chặng cuối, làm "thi thử" phình thành hai tháng trong
    khi chặng luyện Writing lại bị bó — phần lẻ phải về chặng nặng nhất.
  */
  const raw = drafts.map((d) => (totalMonths * d.weight) / weightSum);
  const monthsOf = raw.map((r) => Math.max(1, Math.floor(r)));
  /*
    Chặng đã được kéo lên một tháng bởi mức tối thiểu (raw < 1) thì coi như đã
    tiêu hết phần dư của nó — nếu không, "thi thử" (tỉ trọng 0.06, raw 0.6) lại
    có phần dư to nhất và ăn nốt tháng lẻ.
  */
  const eligible = raw
    .map((r, i) => [i, r] as const)
    .filter(([, r]) => Math.floor(r) >= 1);
  const byRemainder = (
    eligible.length ? eligible : raw.map((r, i) => [i, r] as const)
  )
    .map(([i, r]) => [i, r - Math.floor(r)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([i]) => i);
  let left = totalMonths - monthsOf.reduce((a, b) => a + b, 0);
  while (left > 0) {
    for (const i of byRemainder) {
      if (left <= 0) break;
      monthsOf[i] += 1;
      left -= 1;
    }
  }
  while (left < 0) {
    const longest = monthsOf.indexOf(Math.max(...monthsOf));
    if (monthsOf[longest] <= 1) break;
    monthsOf[longest] -= 1;
    left += 1;
  }

  let cursor = 1;
  const phases: Phase[] = drafts.map(({ weight: _weight, ...d }, i) => {
    const months = monthsOf[i];
    const startMonth = cursor;
    cursor += months;
    return { ...d, months, startMonth, endMonth: cursor - 1 };
  });

  const realMonths = cursor - 1;
  const finishBy = new Date(from);
  finishBy.setMonth(finishBy.getMonth() + realMonths);

  const examIn = monthsUntilExam(profile, from);
  const deadline =
    examIn !== null && examIn < realMonths
      ? {
          months: examIn,
          shortBy: realMonths - examIn,
          /*
            Tính từ khối lượng ở nhịp KHUYẾN NGHỊ, không phải từ nhịp học sinh
            đang khai. Lấy nhịp hiện tại mà nhân lên thì ra nghịch lý: người
            học 1.5 giờ/tuần được bảo "học 6 giờ/tuần là kịp", trong khi 6
            giờ/tuần vẫn dưới mức cần và chính là lý do lộ trình dài ra.
          */
          neededHoursPerWeek:
            Math.round(
              ((recommendedHoursPerWeek * monthsAtFullPace) / examIn) * 10,
            ) / 10,
        }
      : null;

  const notes: string[] = [
    `Bài kiểm tra nền chỉ định vị điểm khởi hành (${TIER_LABELS[startTier]}, đúng ${correct}/${total} câu Listening/Reading/Grammar). Đích đến và các chặng phía sau đi theo mục tiêu ${goalText}.`,
    "Writing và Speaking chiếm một nửa kỳ thi nhưng bài kiểm tra này không đo. Hai kỹ năng đó bắt buộc phải có người chấm theo barem — tự học không thấy được lỗi của mình.",
    `Thời lượng ${realMonths} tháng tính theo mức thông dụng (mỗi 0.5 band cần cỡ 150–200 giờ học thật) với nhịp ${hoursPerWeek} giờ/tuần, tức ${dailyMinutes} phút/ngày × ${STUDY_DAYS_PER_WEEK} ngày. Học ít hơn thì lộ trình dài ra, không phải là kém đi.`,
  ];
  if (hoursPerWeek < recommendedHoursPerWeek) {
    /*
      paceFactor chặn ở 2, nên dưới một nửa nhịp cần thiết thì số tháng không
      dài thêm nữa. Phải nói ra, không thì lộ trình 12 tháng trông như lời hứa
      cho người học 15 phút mỗi ngày.
    */
    const capped = paceFactor >= 2;
    notes.push(
      capped
        ? `Mục tiêu này thường cần khoảng ${recommendedHoursPerWeek} giờ/tuần, bạn đang khai ${hoursPerWeek} giờ — chưa tới một nửa. Ở nhịp đó thì ${realMonths} tháng là con số lạc quan: hãy coi nó là mốc tối thiểu, và tăng thời gian học nếu muốn lộ trình này có nghĩa.`
        : `Mục tiêu này thường cần khoảng ${recommendedHoursPerWeek} giờ/tuần, bạn đang khai ${hoursPerWeek} giờ. Lộ trình đã kéo dài ra cho khớp; muốn ngắn lại thì tăng thời gian học chứ không phải bỏ bớt chặng.`,
    );
  }
  if (deadline) {
    /*
      Trên 20 giờ/tuần là mức của người học toàn thời gian. Đưa ra con số kiểu
      "48 giờ/tuần" chỉ là cách nói "không kịp" bằng phép chia — nói thẳng thì
      trung thực hơn.
    */
    notes.push(
      deadline.neededHoursPerWeek > 20
        ? `Bạn dự định thi trong ${deadline.months} tháng, sớm hơn lộ trình ${deadline.shortBy} tháng. Khoảng cách này không lấp được bằng cách học dày hơn — hãy lùi ngày thi, hoặc hạ mục tiêu cho lần thi này rồi thi lại.`
        : `Bạn dự định thi trong ${deadline.months} tháng, sớm hơn lộ trình ${deadline.shortBy} tháng. Hai cách: học khoảng ${deadline.neededHoursPerWeek} giờ/tuần, hoặc lùi ngày thi. Cắt bớt chặng thì Writing và Speaking bị bỏ đầu tiên, mà đó đúng là phần kéo band xuống.`,
    );
  }
  if (Number.isNaN(targetBand)) {
    notes.push(
      "Bạn chưa chọn mục tiêu cụ thể nên lộ trình đang lấy mốc chung. Chọn mục tiêu rồi làm lại để có độ dài sát hơn.",
    );
  }
  if (report.blanks > 0) {
    notes.push(
      `${report.blanks} câu bỏ trống chưa đủ căn cứ để kết luận là lỗ hổng kiến thức — có thể chỉ là thiếu thời gian. Chặng luyện đề là chỗ tách bạch hai nguyên nhân đó.`,
    );
  }
  if (vocab && vocab.level === 0) {
    notes.push(
      "Từ vựng đang là điểm nghẽn chung: giữ việc học từ theo chủ đề chạy xuyên suốt cả lộ trình, đừng bỏ sau chặng nền.",
    );
  }

  return {
    target: profile.target,
    targetBand: Number.isNaN(targetBand) ? null : targetBand,
    startTier,
    tierLabel: TIER_LABELS[startTier],
    needRatio,
    current: { correct, total, ratio },
    totalMonths: realMonths,
    hoursPerWeek,
    recommendedHoursPerWeek,
    deadline,
    finishBy,
    standings,
    phases,
    notes,
  };
}

export function roadmapToText(roadmap: Roadmap): string[] {
  const pct = (n: number) => Math.round(n * 100) + "%";
  return [
    "LỘ TRÌNH TỚI MỤC TIÊU IELTS",
    [
      `Mục tiêu: IELTS ${roadmap.target || "chưa chọn"}`,
      `Điểm khởi hành (theo bài kiểm tra nền): ${roadmap.tierLabel}, đúng ${roadmap.current.correct}/${roadmap.current.total} câu (${pct(roadmap.current.ratio)})`,
      `Thời lượng dự kiến: ${roadmap.totalMonths} tháng · ${roadmap.hoursPerWeek} giờ/tuần`,
      ...(roadmap.deadline
        ? [
            `Ngày thi tự khai sớm hơn lộ trình ${roadmap.deadline.shortBy} tháng — cần khoảng ${roadmap.deadline.neededHoursPerWeek} giờ/tuần nếu giữ nguyên ngày thi.`,
          ]
        : []),
      `Mốc thi thử toàn phần: khoảng ${roadmap.finishBy.toLocaleDateString("vi-VN")}`,
      "Bài kiểm tra nền không đo Writing và Speaking — hai kỹ năng này cần người chấm theo barem.",
    ].join("\n"),
    roadmap.standings
      .map((s) => `${s.section}: ${s.correct}/${s.total} (${pct(s.ratio)})`)
      .join("\n"),
    ...roadmap.phases.map((p) =>
      [
        `Chặng ${p.startMonth === p.endMonth ? `tháng ${p.startMonth}` : `tháng ${p.startMonth}–${p.endMonth}`} · ${p.title} (${p.skills.join(", ")})`,
        p.subtitle,
        `Đích: ${p.aim}`,
        `Vì sao: ${p.because}`,
        ...(p.areas.length ? [`Nội dung ưu tiên: ${listNames(p.areas)}`] : []),
        ...p.steps.map((s, i) => `${i + 1}. ${s}`),
        `Mốc kiểm tra: ${p.checkpoint}`,
      ].join("\n"),
    ),
    ...roadmap.notes,
  ];
}
