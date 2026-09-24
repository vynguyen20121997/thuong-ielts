import type {
  IdeaCoach,
  SpeakingGrader,
  TopicProvider,
} from "../application/ports";
import { stubGrader, stubIdeaCoach, stubTopicProvider } from "./stubs";

/*
  Điểm nối duy nhất giữa UI và "cục logic".

  Nối bộ chấm thật: viết `speakingApi.ts` cài đặt cùng ba cổng (gọi route
  server), rồi đổi ba dòng dưới. Không file UI nào import thẳng từ `stubs.ts`.
*/
export const grader: SpeakingGrader = stubGrader;
export const ideaCoach: IdeaCoach = stubIdeaCoach;
export const topicProvider: TopicProvider = stubTopicProvider;
