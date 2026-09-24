import { TOPIC_PACKS } from "../domain/bank";
import type {
  IdeaCoach,
  SpeakingGrader,
  TopicProvider,
} from "../application/ports";
import type {
  IdeaFeedback,
  IdeaSeed,
  Part,
  SpeakingState,
  TopicPack,
} from "../domain/types";

/*
  Bản TẠM của ba cổng logic. Không gọi mạng, không bịa điểm.

  Bộ chấm trả `ungraded` với lý do rõ ràng: chưa có dịch vụ nào nghe được âm
  thanh. Bài nói vẫn giữ trên máy học sinh; giao diện hiện nút "chấm lại" để
  khi nối bộ chấm thật thì bấm là xong.

  Gợi ý ý tưởng và bốc chủ đề dùng dữ liệu mẫu trong `domain/bank.ts` — đủ để
  đi hết luồng, không đủ để dạy. Thay bằng bản gọi server khi có.
*/

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const stubGrader: SpeakingGrader = {
  async grade(): Promise<SpeakingState> {
    await wait(600);
    return {
      kind: "ungraded",
      reason:
        "Bộ chấm Speaking chưa được nối — cần dịch vụ nhận dạng lời nói và một model nghe được audio cho tiêu chí Phát âm.",
    };
  },
};

export const stubIdeaCoach: IdeaCoach = {
  async reshape(_questionId, rawIdea, round): Promise<IdeaFeedback | null> {
    await wait(500);
    const trimmed = rawIdea.trim();
    if (!trimmed) return null;
    /*
      Không có model thì không "viết lại" được — trả nguyên ý của học sinh và
      nói thẳng. Bịa một câu văn hay ở đây là dạy sai.
    */
    return {
      reshaped: trimmed,
      probe:
        round < 3
          ? "Bộ gợi ý chưa nối. Khi nối, chỗ này là một câu hỏi gợi mở dựa trên ý bạn vừa gõ."
          : null,
      vocab: [],
    };
  },
  async seeds(): Promise<IdeaSeed[]> {
    await wait(300);
    return [
      {
        title: "Hướng 1 · Kinh nghiệm cá nhân",
        hint: "Một lần bạn tự trải qua, kể ngắn, rút ra một điều.",
      },
      {
        title: "Hướng 2 · So sánh hai phía",
        hint: "Ai được lợi, ai chịu thiệt, rồi bạn nghiêng về đâu.",
      },
      {
        title: "Hướng 3 · Hệ quả lâu dài",
        hint: "Nếu điều này tiếp diễn 10 năm thì sao?",
      },
    ];
  },
};

export const stubTopicProvider: TopicProvider = {
  async draw(part: Part, exclude: string[] = []): Promise<TopicPack | null> {
    await wait(400);
    const pool = TOPIC_PACKS.filter(
      (p) => p.part === part && !exclude.includes(p.topic),
    );
    const fallback = TOPIC_PACKS.filter((p) => p.part === part);
    const list = pool.length ? pool : fallback;
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  },
};
