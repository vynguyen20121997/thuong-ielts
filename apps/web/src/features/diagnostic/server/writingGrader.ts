import "server-only";

import {
  GRADER_CONTEXT,
  WRITING_TASK,
  type WritingState,
} from "@thuong-ielts/diagnostic";

import { gradeEssayBand, graderConfigured } from "../../../server/writingBand";

/*
  Chấm phần Writing (Section 4) của bài kiểm tra nền.

  Cách chấm nằm ở `server/writingBand.ts`, dùng chung với màn luyện Writing —
  hai chỗ cùng một bộ chấm thì không có ngày điểm hai màn lệch nhau. File này
  chỉ còn việc đưa đúng ngữ cảnh của bài 15 phút: `GRADER_CONTEXT` báo cho
  model biết đây không phải Task 2 chuẩn, để nó không trừ điểm vì bài ngắn.
*/

export { graderConfigured };

export function gradeWriting(essay: string): Promise<WritingState> {
  return gradeEssayBand(essay, {
    prompt: WRITING_TASK.prompt,
    minWords: WRITING_TASK.minWords,
    gradableWords: WRITING_TASK.gradableWords,
    context: GRADER_CONTEXT,
    taskVersion: WRITING_TASK.version,
  });
}
