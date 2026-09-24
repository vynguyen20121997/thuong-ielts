"use client";

import { WRITING_TASK, type WritingState } from "@thuong-ielts/diagnostic";

import WritingBandReport from "../../../components/WritingBandReport";

/*
  Bảng điểm Writing của Section 4.

  Cách vẽ nằm ở `components/WritingBandReport.tsx`, dùng chung với màn luyện
  Writing. File này chỉ đưa vào phần chữ riêng của bài 15 phút — và phần chữ
  ấy là thứ KHÔNG được bỏ: con số band đứng một mình sẽ bị đọc thành band
  Writing thi thật, trong khi bài này chỉ có 15 phút và mức tối thiểu 150 từ
  thay vì 250.
*/
export default function WritingReport({
  state,
  essay,
  onRetry,
  retrying,
}: {
  state: WritingState | null;
  essay: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  const minutes = Math.round(WRITING_TASK.seconds / 60);
  return (
    <WritingBandReport
      state={state}
      essay={essay}
      minWords={WRITING_TASK.minWords}
      caption={`band tham khảo cho bài ${minutes} phút`}
      emptyText="Bạn chưa viết gì ở phần 4, nên không có gì để chấm. Ba phần còn lại vẫn được chấm đầy đủ."
      footnote={`Band trên đây chỉ tính riêng bài viết ${minutes} phút này, không phải band Writing thi thật và không cộng vào một điểm Overall — bài kiểm tra nền không đo Speaking nên chưa đủ bốn kỹ năng để quy đổi.`}
      onRetry={onRetry}
      retrying={retrying}
    />
  );
}
