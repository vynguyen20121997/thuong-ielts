import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { QUESTION_BANK } from "../../../../../features/speaking/domain/bank";
import IdeaCoach from "../../../../../features/speaking/ui/IdeaCoach";

export const metadata: Metadata = {
  title: "Luyện phát triển ý Speaking Part 3 | HNT.IELTS",
  description:
    "Gõ ý đầu tiên trong đầu, máy nói lại cho tròn câu và hỏi ngược một câu. Ba vòng là một câu trả lời Part 3 hoàn chỉnh.",
};

export default function IdeaCoachPage() {
  const questions = QUESTION_BANK.filter((q) => q.part === 3);

  return (
    <main className="relative z-10 min-h-screen bg-white pb-20 pt-24 md:pt-28">
      <div className="mx-auto max-w-5xl gutter">
        <nav className="mb-6 flex items-center gap-1.5 text-2xs font-medium text-ink/65">
          <Link
            href="/kiem-tra-kien-thuc"
            className="transition-colors hover:text-brand"
          >
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <Link
            href="/kiem-tra-kien-thuc/speaking"
            className="transition-colors hover:text-brand"
          >
            Speaking
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Phát triển ý</span>
        </nav>
        <IdeaCoach questions={questions} />
      </div>
    </main>
  );
}
