import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Mic } from "lucide-react";

import PageArch from "../../../../components/PageArch";
import { QUESTION_BANK } from "../../../../features/speaking/domain/bank";
import { TALK_SECONDS } from "../../../../features/speaking/domain/timing";
import type { Part } from "../../../../features/speaking/domain/types";

export const metadata: Metadata = {
  title: "Luyện Speaking IELTS | HNT.IELTS - Hồ Ngọc Thương",
  description:
    "Thu âm câu trả lời theo bộ đề dự đoán, luyện phát triển ý cho Part 3 và bốc chủ đề ngẫu nhiên có kiến thức nền, từ vựng.",
};

const PART_LABEL: Record<Part, string> = {
  1: "Part 1 · câu hỏi ngắn",
  2: "Part 2 · cue card",
  3: "Part 3 · thảo luận",
};

export default function SpeakingCatalogPage() {
  const parts: Part[] = [1, 2, 3];

  return (
    <main className="relative z-10 min-h-screen bg-white pb-24 pt-28 md:pt-32">
      <PageArch />
      <div className="relative z-10 mx-auto max-w-7xl gutter">
        <nav className="mb-6 flex items-center gap-1.5 text-2xs font-medium text-ink/65">
          <Link
            href="/kiem-tra-kien-thuc"
            className="transition-colors hover:text-brand"
          >
            Kiểm tra kiến thức
          </Link>
          <ChevronRight size={12} />
          <span className="text-brand">Speaking</span>
        </nav>

        <div className="mb-10 max-w-2xl">
          <span className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <Mic size={15} />
            Kỹ năng Nói
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-ink md:text-6xl">
            Luyện Speaking
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-ink/70 md:text-base">
            Ba cách luyện. Thu âm theo bộ đề dự đoán rồi nộp cho cô nghe; tập
            phát triển ý cho Part 3 bằng cách gõ ý thô rồi để máy hỏi ngược;
            hoặc bốc một chủ đề ngẫu nhiên, đọc kiến thức nền trong vài phút rồi
            trả lời.
          </p>
        </div>

        <p className="mb-10 max-w-2xl rounded-xl border border-black/5 bg-cream px-4 py-3 text-2xs leading-relaxed text-ink/65">
          Phần chấm tự động <b className="text-ink/70">chưa nối</b>. Bài thu âm
          hiện được giữ trên máy bạn và gửi cho cô; điểm bốn tiêu chí sẽ hiện ở
          đây khi bộ chấm sẵn sàng.
        </p>

        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <Link
            href="/kiem-tra-kien-thuc/speaking/phat-trien-y"
            className="group rounded-2xl border border-sage-3 bg-mist-3 p-6 transition-colors hover:border-brand/40"
          >
            <p className="text-2xs font-extrabold uppercase tracking-wider text-brand-soft">
              Part 3
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-brand">
              Luyện phát triển ý
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Gõ ý đầu tiên trong đầu. Máy nói lại cho tròn câu và hỏi ngược một
              câu — ba vòng là một câu trả lời hoàn chỉnh.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">
              Bắt đầu{" "}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
          <Link
            href="/kiem-tra-kien-thuc/speaking/boc-chu-de"
            className="group rounded-2xl border border-sage-3 bg-mist-3 p-6 transition-colors hover:border-brand/40"
          >
            <p className="text-2xs font-extrabold uppercase tracking-wider text-brand-soft">
              Part 1 · 2 · 3
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-brand">
              Bốc chủ đề ngẫu nhiên
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              5 / 8 / 10 phút đọc kiến thức nền và từ vựng theo part, rồi bảng
              ẩn đi và câu hỏi hiện ra. Giống thi thật.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">
              Bắt đầu{" "}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>

        <h2 className="mb-1 text-2xl font-extrabold text-ink">Bộ đề dự đoán</h2>
        <p className="mb-6 text-sm text-ink/60">
          Q3–Q4 2026 · thu âm từng câu, thu lại tối đa một lần.
        </p>

        <div className="grid gap-8 lg:grid-cols-3">
          {parts.map((part) => (
            <section key={part}>
              <h3 className="mb-3 text-2xs font-extrabold uppercase tracking-wider text-ink/65">
                {PART_LABEL[part]} · nói tối đa{" "}
                {Math.round((TALK_SECONDS[part] / 60) * 10) / 10} phút
              </h3>
              <ul className="grid gap-3">
                {QUESTION_BANK.filter((q) => q.part === part).map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/kiem-tra-kien-thuc/speaking/${q.id}`}
                      className="group flex flex-col gap-1.5 rounded-xl border border-sage-3 bg-white p-4 transition-colors hover:border-brand/40"
                    >
                      <span className="text-2xs font-bold uppercase tracking-wider text-brand-soft">
                        {q.topic}
                      </span>
                      <span className="text-[15px] font-semibold leading-snug text-ink">
                        {q.prompt}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand">
                        Thu âm{" "}
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
