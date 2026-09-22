import type { AreaResult, Report } from "./types";
import type { Roadmap } from "./roadmap";

/*
  Tổng hợp điểm mạnh — điểm yếu.

  Tab "Nhận xét chi tiết" đã liệt kê đủ 16 nhóm, nhưng liệt kê đều tay thì
  không trả lời được câu học sinh thực sự hỏi: *mạnh nhất chỗ nào, yếu nhất
  chỗ nào, và ai lo chỗ yếu đó?* Nên khối này chỉ lấy 3 + 3, và mỗi dòng gắn
  thẳng vào chặng của lộ trình sẽ xử lý nó — thông tin mới, không chép lại
  nhận xét đã có.

  Chỉ đọc kết quả có thật. Bài không đo Writing/Speaking nên tuyệt đối không
  suy ra điểm mạnh/yếu cho hai kỹ năng đó.
*/

export type Highlight = {
  id: string;
  name: string;
  section: string;
  correct: number;
  total: number;
  /*
    Chặng nào trong lộ trình xử lý nhóm này. Chỉ gắn cho chỗ yếu: gắn cho điểm
    mạnh thì thành "Nền ngữ pháp & từ vựng" nằm cạnh một nhóm đúng 3/3 — đọc ra
    như đang bảo học sinh đi sửa thứ vốn đã tốt.
  */
  handledBy: string | null;
};

export type Verdict = {
  headline: string;
  strengths: Highlight[];
  weaknesses: Highlight[];
  note: string | null;
};

const VOCAB_SUMMARY = "R_VOCABULARY_OVERALL";

const ratioOf = (a: AreaResult) => (a.total ? a.correct / a.total : 0);

export function buildVerdict(report: Report, roadmap: Roadmap): Verdict {
  const scored = report.areas.filter((a) => a.id !== VOCAB_SUMMARY && a.total);

  /*
    Chặng phụ trách: ưu tiên chặng có nhắc đích danh nhóm này; không có thì
    lấy chặng đầu tiên chạm tới kỹ năng của nó. Grammar quy về "Nền tảng" vì
    lộ trình không có chặng Grammar riêng.
  */
  const phaseFor = (area: AreaResult) => {
    const named = roadmap.phases.find((p) =>
      p.areas.some((x) => x.id === area.id),
    );
    if (named)
      return `Chặng ${roadmap.phases.indexOf(named) + 1} · ${named.title}`;
    const wanted = area.section === "Grammar" ? "Nền tảng" : area.section;
    const bySkill = roadmap.phases.find((p) =>
      p.skills.some((s) => s === wanted),
    );
    return bySkill
      ? `Chặng ${roadmap.phases.indexOf(bySkill) + 1} · ${bySkill.title}`
      : null;
  };

  const toHighlight =
    (withPhase: boolean) =>
    (a: AreaResult): Highlight => ({
      id: a.id,
      name: a.name,
      section: a.section,
      correct: a.correct,
      total: a.total,
      handledBy: withPhase ? phaseFor(a) : null,
    });

  const strengths = [...scored]
    .sort((a, b) => ratioOf(b) - ratioOf(a) || b.total - a.total)
    .filter((a) => ratioOf(a) >= 0.6)
    .slice(0, 3)
    .map(toHighlight(false));

  const weaknesses = [...scored]
    .sort((a, b) => ratioOf(a) - ratioOf(b) || b.total - a.total)
    .filter((a) => ratioOf(a) < 0.6)
    .slice(0, 3)
    .map(toHighlight(true));

  const best = [...roadmap.standings].sort((a, b) => b.ratio - a.ratio)[0];
  const worst = [...roadmap.standings].sort((a, b) => a.ratio - b.ratio)[0];
  /*
    Ba mốc phải tách riêng, không gộp vào một câu "sàn sàn nhau": đúng hết và
    sai hết đều cho best.ratio === worst.ratio, mà nói "sàn sàn nhau" với người
    đúng 53/53 thì vô nghĩa, với người 0/53 thì như trêu.
  */
  const gap = best.ratio - worst.ratio;
  const headline =
    roadmap.current.correct === 0
      ? "Chưa có câu nào đúng, nên chưa tách được điểm mạnh — điểm yếu. Làm lại khi có thời gian để kết quả nói được điều gì đó."
      : roadmap.current.correct === roadmap.current.total
        ? "Cả ba phần đều đúng trọn vẹn. Phần nền không còn gì để đo; chỗ cần biết bây giờ là Writing và Speaking, hai kỹ năng bài này không chạm tới."
        : gap < 0.1
          ? `Ba phần cho kết quả sàn sàn nhau (quanh mức ${worst.correct}/${worst.total} ở ${worst.section}), chưa có kỹ năng nào vượt hẳn lên.`
          : `Vững nhất ở ${best.section} (${best.correct}/${best.total}), hụt nhất ở ${worst.section} (${worst.correct}/${worst.total}).`;

  let note: string | null = null;
  if (!strengths.length) {
    note =
      "Chưa nhóm nào đúng quá 60%, nên phần này chỉ nêu chỗ yếu. Điểm mạnh sẽ rõ hơn sau khi làm lại ở chặng cuối.";
  } else if (!weaknesses.length) {
    note =
      "Không nhóm nào rơi xuống dưới 60% — phần nền đã đều tay, lộ trình vì vậy nghiêng về luyện đề và hai kỹ năng bài này không đo.";
  } else if (report.blanks > 0) {
    note = `${report.blanks} câu bỏ trống đang được tính là sai. Nếu bỏ trống vì hết giờ chứ không phải vì không biết, chỗ yếu thật sự nằm ở tốc độ làm bài.`;
  }

  return { headline, strengths, weaknesses, note };
}

export function verdictToText(verdict: Verdict): string {
  const line = (h: Highlight) =>
    `- ${h.name} (${h.section}): ${h.correct}/${h.total}${h.handledBy ? ` → xử lý ở ${h.handledBy}` : ""}`;
  return [
    "ĐIỂM MẠNH & ĐIỂM YẾU",
    verdict.headline,
    verdict.strengths.length
      ? ["Điểm mạnh:", ...verdict.strengths.map(line)].join("\n")
      : "Điểm mạnh: chưa có nhóm nào đúng quá 60%.",
    verdict.weaknesses.length
      ? ["Cần cải thiện:", ...verdict.weaknesses.map(line)].join("\n")
      : "Cần cải thiện: không nhóm nào dưới 60%.",
    ...(verdict.note ? [verdict.note] : []),
  ].join("\n\n");
}
