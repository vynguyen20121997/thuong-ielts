import type { EssayCoach } from "../application/essayPorts";

/*
  Điểm nối duy nhất giữa UI và bộ hướng dẫn bài viết.

  Bản tạm khai `available() === false` và trả `null` cho cả ba việc — KHÔNG
  bịa lỗi, không bịa câu nâng cấp, không bịa bài mẫu. Một lỗi bịa ra thì học
  sinh đi sửa một chỗ vốn đúng; một bài mẫu bịa ra thì các em học theo văn của
  máy. Thà để trống và nói rõ.

  Nối model sinh văn bản: viết một file cạnh đây cài đặt `EssayCoach`, rồi đổi
  một dòng cuối.
*/
const notWired: EssayCoach = {
  available: () => false,
  async issues() {
    return null;
  },
  async upgrades() {
    return null;
  },
  async sampleEssay() {
    return null;
  },
};

export const essayCoach: EssayCoach = notWired;
