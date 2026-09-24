import type {
  IdeaCoach,
  SpeakingGrader,
  TopicProvider,
} from "../application/ports";
import { apiGrader } from "./speakingApi";
import { stubIdeaCoach, stubTopicProvider } from "./stubs";

/*
  Điểm nối duy nhất giữa UI và "cục logic".

  `grader` đã nối thật (`speakingApi.ts` → `/api/speaking/grade`) cho phần
  chấm được từ bản ghi chữ. Hai cổng còn lại vẫn là bản tạm; nối chúng cũng
  theo cách đó — viết một file cài đặt cùng cổng rồi đổi một dòng dưới đây.
  Không file UI nào import thẳng từ `stubs.ts`.
*/
export const grader: SpeakingGrader = apiGrader;
export const ideaCoach: IdeaCoach = stubIdeaCoach;
export const topicProvider: TopicProvider = stubTopicProvider;
