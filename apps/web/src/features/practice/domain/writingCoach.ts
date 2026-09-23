/**
 * Gợi ý ý tưởng trong lúc viết — phần thuần.
 *
 * ## Vai của file này
 *
 * Nhận về "máy đọc được gì trong bài" (`Tracking`) rồi trả lời đúng một câu:
 * *đoạn tiếp theo nên là gì, và gợi ý nào hiện ra*. Không gọi mạng, không React.
 *
 * ## Suy ra chặng từ BÀI, không đếm đoạn
 *
 * Cám dỗ là đếm số lần xuống dòng: đoạn 1 là mở bài, đoạn 2 là thân 1… Sai
 * ngay với học sinh viết thân bài dài thành hai đoạn, hoặc gộp mặt trái vào
 * kết. Nên chặng suy từ NỘI DUNG: đã có quan điểm chưa, đã phát triển mấy ý,
 * đã chạm phe đối lập chưa, đã có kết bài chưa. Viết kiểu gì cũng đúng.
 *
 * ## Học sinh không khai gì, và cũng không thấy bảng tiến độ
 *
 * Toàn bộ kết quả theo dõi chỉ lộ ra ở MỘT chỗ: gợi ý nào được chọn. Không
 * checklist, không "x/5 đoạn" — đã thử và đó là thứ biến trang viết thành cái
 * bảng điều khiển. Cái máy biết thì nói thành lời dẫn, ví dụ "đoạn vừa rồi đã
 * nói về tầm với", chứ không bày thành ô tick.
 */

export type Stance = "pos" | "neg" | "unclear";

export type Idea = {
  id: string;
  side: "pos" | "neg";
  /** Hiện cho học sinh, tiếng Việt. */
  label: string;
  /** Câu tiếng Anh hỏi model xem bài đã phát triển ý này chưa. */
  probe: string;
  /**
   * Ba câu MẪU cho ba phần của một đoạn thân bài.
   *
   * Là câu hoàn chỉnh, không còn chỗ trống — cô chốt như vậy. Đổi lại, chúng
   * phải cụ thể và có chi tiết thật, để học sinh thấy một câu đạt trông thế
   * nào rồi viết lại bằng chuyện của mình; câu chung chung ai điền cũng vừa
   * thì chỉ tổ được chép thẳng vào bài.
   */
  starter: string;
  explain: string;
  example: string;
  questions: string[];
};

/** Những gì đọc được từ bài. Mọi trường đều có thể "không biết". */
export type Tracking = {
  stance: Stance;
  /** Id những ý đã thấy trong bài. */
  usedIdeaIds: string[];
  /** Mở bài có hứa sẽ nói mặt trái không (kiểu "although…"). */
  promisedOtherSide: boolean;
  /** Đã có kết bài chưa. */
  hasConclusion: boolean;
  /** Đoạn vừa viết xong có ví dụ cụ thể không. `null` = chưa đủ chắc. */
  lastParagraphHasExample: boolean | null;
  /**
   * Số đoạn hiện có. KHÔNG dùng để suy ra chặng — chỉ làm chốt chặn cho
   * `hasConclusion`: một bài hai đoạn thì dù model nói gì cũng chưa thể kết.
   */
  paragraphs: number;
};

/** Ít hơn ngần này đoạn thì chưa thể có kết bài, model nói gì cũng vậy. */
const MIN_PARAGRAPHS_FOR_CONCLUSION = 3;

/**
 * Số đoạn thân bài đã viết = tổng số đoạn trừ mở bài.
 *
 * Dùng làm TRẦN cho số ý được tính. Đo thật thấy một đoạn có thể khớp hai ý
 * cùng lúc — đoạn "tầm với" viết "trước đây phải bay và mất một tuần chuẩn bị"
 * cũng đọc ra như ý "tốc độ", và không sai. Nhưng nếu tin thẳng con số đó thì
 * mới viết một đoạn thân bài mà bảng đã nhảy sang "viết mặt trái đi", bỏ qua
 * cả một chặng. Một đoạn thì nhiều nhất tính là một ý.
 */
function bodyParagraphs(t: Tracking): number {
  return Math.max(0, t.paragraphs - 1);
}

export type Stage = "intro" | "body1" | "body2" | "counter" | "conclusion" | "done";

export type Coaching = {
  stage: Stage;
  title: string;
  body: string;
  /** Ý còn gợi được cho chặng này. Rỗng ở chặng kết bài và khi xong. */
  ideas: Idea[];
  /** Lời nhắc khi bài thiếu một thứ sửa được ngay. `null` = không có gì để nhắc. */
  warning: string | null;
};

const SIDE_WORD: Record<"pos" | "neg", string> = {
  pos: "tích cực",
  neg: "tiêu cực",
};

/** Ý thuộc phe đối lập với quan điểm học sinh — dùng cho đoạn phản biện. */
function opposite(stance: Stance): "pos" | "neg" | null {
  if (stance === "pos") return "neg";
  if (stance === "neg") return "pos";
  return null;
}

function listLabels(ideas: Idea[], ids: string[]): string {
  const names = ideas.filter((i) => ids.includes(i.id)).map((i) => i.label.toLowerCase());
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
}

export function deriveStage(t: Tracking, ideas: Idea[]): Stage {
  /*
    Chốt cấu trúc trước khi tin model. Câu hỏi "đã có kết bài chưa" từng trả
    `true` cho một bài mới có mỗi mở bài — vì mở bài cũng nêu quan điểm. Một
    câu hỏi ngôn ngữ không phân biệt nổi chỗ đó, nhưng số đoạn thì phân biệt
    được, và nó miễn phí.
  */
  if (t.hasConclusion && t.paragraphs >= MIN_PARAGRAPHS_FOR_CONCLUSION) return "done";

  // Chưa rõ quan điểm thì mọi bước sau đều chưa có căn cứ — quay về mở bài.
  if (t.stance === "unclear") return "intro";

  const own = t.stance as "pos" | "neg";
  const used = ideas.filter((i) => t.usedIdeaIds.includes(i.id));
  const bodies = bodyParagraphs(t);
  const ownCount = Math.min(used.filter((i) => i.side === own).length, bodies);
  const hasOther = used.some((i) => i.side !== own);

  /*
    Đã chạm phe đối lập = đã viết đoạn phản biện, chỉ còn kết bài. Kiểm tra
    trước hai nhánh dưới: học sinh viết mặt trái sớm (ngay sau thân 1) thì
    không nên bị đẩy ngược về "viết thêm lý do".

    Đòi ít nhất hai đoạn thân bài, cùng lý do với trần ở trên: một đoạn thân
    bài duy nhất mà đã tính là "đã phản biện xong" thì bài chỉ còn ba đoạn.
  */
  if (hasOther && bodies >= 2) return "conclusion";

  if (ownCount === 0) return "body1";
  if (ownCount === 1) return "body2";
  return "counter";
}

export function coach(t: Tracking, ideas: Idea[]): Coaching {
  const stage = deriveStage(t, ideas);
  const own = t.stance === "pos" || t.stance === "neg" ? t.stance : null;
  const other = opposite(t.stance);
  /**
   * Ý còn gợi được cho một phe.
   *
   * Lọc bỏ ý đã thấy trong bài, NHƯNG nếu lọc xong không còn gì thì trả lại
   * cả phe. Lý do: chặng được tính với trần "một đoạn thân bài nhiều nhất một
   * ý", còn bộ lọc này thì không — nên có cảnh bài gộp cả ba ý vào một đoạn,
   * chặng vẫn là "viết thân bài 1" mà danh sách rỗng. Đo được: bảng nói "chọn
   * một ý" rồi không đưa ý nào để chọn.
   *
   * Thà gợi lại một ý đã chạm còn hơn đưa ra một danh sách trống: ý đã chạm
   * qua một câu vẫn đáng được viết thành hẳn một đoạn.
   */
  const unused = (side: "pos" | "neg" | null) => {
    const ofSide = ideas.filter((i) => side === null || i.side === side);
    const fresh = ofSide.filter((i) => !t.usedIdeaIds.includes(i.id));
    return fresh.length ? fresh : ofSide;
  };

  /*
    Lời nhắc thiếu ví dụ chỉ bám vào ĐOẠN VỪA VIẾT, và chỉ khi model đủ chắc.
    Nhắc trên cả bài thì học sinh không biết quay lại chỗ nào; nhắc lúc model
    lưỡng lự thì có ngày bảo sửa một đoạn vốn đã có ví dụ.
  */
  const missingExample =
    t.lastParagraphHasExample === false &&
    stage !== "intro" &&
    stage !== "done" &&
    /*
      Chỉ nhắc khi đoạn cuối THẬT SỰ là một đoạn thân bài. Mở bài không có ví
      dụ là bình thường — đo thật thấy bài mới có mỗi mở bài đã bị nhắc "thiếu
      ví dụ", vừa sai vừa làm học sinh nản ngay câu đầu tiên.
    */
    t.paragraphs >= 2
      ? "Đoạn vừa rồi chưa có trường hợp cụ thể nào. Thêm một câu “for instance…” ngay bây giờ dễ hơn sửa sau khi kết bài."
      : null;

  if (stage === "intro") {
    const unclear = t.stance === "unclear";
    return {
      stage,
      title: unclear
        ? "Chưa rõ em nghiêng về bên nào"
        : "Đề hỏi một câu: tích cực hay tiêu cực?",
      body: unclear
        ? "Đọc mở bài, máy không đoán được em chọn bên nào — giám khảo cũng sẽ thấy vậy. Thêm một câu kiểu “In my view, this has been a largely positive/negative development, because…”"
        : "Cứ viết mở bài theo hướng em nghiêng về, không cần khai gì ở đây. Bấm một ý bên dưới để xem câu hỏi gợi.",
      ideas: unused(null),
      warning: null,
    };
  }

  if (stage === "body1") {
    return {
      stage,
      title: "Đoạn kế: lý do mạnh nhất của em",
      body: `Mở bài của em nghiêng về hướng ${SIDE_WORD[own!]}, nên đây là những ý cùng hướng. Chọn một — ba ý trong một đoạn là không ý nào được phát triển.`,
      ideas: unused(own),
      warning: missingExample,
    };
  }

  if (stage === "body2") {
    const done = listLabels(ideas, t.usedIdeaIds);
    return {
      stage,
      title: "Đoạn kế: một lý do khác hẳn",
      body: `Đoạn vừa rồi đã nói về ${done}. Lặp lại cùng ý là mất điểm phát triển ý, nên ý đó không còn trong danh sách.`,
      ideas: unused(own),
      warning: missingExample,
    };
  }

  if (stage === "counter") {
    return {
      stage,
      title: t.promisedOtherSide
        ? "Đến lúc trả nợ câu “although” ở mở bài"
        : "Đoạn kế: nói về mặt trái",
      body: t.promisedOtherSide
        ? "Em đã hứa ở mở bài là sẽ nói mặt trái. Ba đến bốn câu, rồi giải thích vì sao lợi vẫn hơn hại."
        : "Hai lý do đã đủ. Một đoạn thừa nhận mặt trái rồi phản bác lại là cách nhanh nhất để bài có chiều sâu.",
      ideas: unused(other),
      warning: missingExample,
    };
  }

  if (stage === "conclusion") {
    const done = listLabels(ideas, t.usedIdeaIds);
    return {
      stage,
      title: "Kết bài: nhắc lại quan điểm kèm một điều kiện",
      body: `Em đã nói ${done}. Kết bằng “…provided that…” giữ được quan điểm mà vẫn công bằng với mặt trái vừa nêu.`,
      ideas: [],
      warning: missingExample,
    };
  }

  return {
    stage: "done",
    title: "Bài đã đủ bốn phần",
    body: "Giờ để máy soi lỗi trước khi gửi cô: lạc đề, bố cục, ví dụ, mạch lạc, từ vựng. Không phải band điểm.",
    ideas: [],
    warning: null,
  };
}

/**
 * Số đoạn hiện có, tính theo dòng trống — dùng làm NHỊP gọi, không dùng để
 * suy ra chặng.
 */
export function paragraphCount(essay: string): number {
  return essay
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

/** Đoạn cuối cùng, để hỏi riêng câu "đoạn này có ví dụ chưa". */
export function lastParagraph(essay: string): string {
  const parts = essay
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
