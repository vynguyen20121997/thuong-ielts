import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import SkillGrid from "../../../features/practice/ui/SkillGrid";

import PageArch from "../../../components/PageArch";

export const metadata: Metadata = {
  title: "Kiểm tra kiến thức IELTS | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Luyện tập IELTS miễn phí theo 4 kỹ năng Reading, Listening, Writing, Speaking. Bấm giờ như thi thật, chấm điểm và giải thích ngay khi nộp bài.",
};

export default function PracticeHubPage() {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <PageArch />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mb-12">
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand mb-3 flex items-center gap-1.5">
            <GraduationCap size={15} />
            Phòng Luyện Tập
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
            Kiểm Tra Kiến Thức IELTS
          </h1>
          <p className="text-ink/70 text-sm md:text-base leading-relaxed mt-5">
            Chọn kỹ năng bạn muốn luyện. Mỗi bài đều được bấm giờ như phòng thi, nộp bài là có ngay
            số câu đúng, band ước lượng và lời giải thích cho từng câu — để bạn biết mình sai ở đâu
            chứ không chỉ sai bao nhiêu.
          </p>
        </div>

        <SkillGrid />

        <p className="text-2xs text-ink/40 font-medium mt-8">
          Listening · Writing · Speaking đang được cô Thương biên soạn và sẽ mở lần lượt.
        </p>
      </div>
    </main>
  );
}
