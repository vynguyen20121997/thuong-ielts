import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import SkillGrid from "../../../features/practice/ui/SkillGrid";

import PageArch from "../../../components/PageArch";

export const metadata: Metadata = {
  title: "Luyện kĩ năng IELTS tại nhà | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Bộ đề luyện tập IELTS 4 kĩ năng để luyện tập thêm tại nhà và theo dõi tiến bộ trong điểm số.",
};

export default function PracticeHubPage() {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <PageArch />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-4xl mb-12">
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-brand mb-3 flex items-center gap-1.5">
            <GraduationCap size={15} />
            Phòng Luyện Tập
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink leading-[1.05] text-balance">
            Làm bài luyện tập IELTS theo 4 kĩ năng
          </h1>
          <p className="max-w-3xl text-ink/70 text-sm md:text-base leading-relaxed mt-5">
            Bộ đề luyện tập IELTS 4 kĩ năng để luyện tập thêm tại nhà &amp; theo dõi tiến bộ
            trong điểm số
          </p>
        </div>

        <SkillGrid />

      </div>
    </main>
  );
}
