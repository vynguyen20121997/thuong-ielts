import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { passageLabelOf } from "../domain/catalog";
import { passageNumberFromTitle } from "../domain/paper";
import { questionTypeLabel } from "../domain/questionTypeLabels";
import type { ReadingTestSummary } from "../domain/types";

const BADGES = [
  "bg-[#FF9818]",
  "bg-[#5C63E6]",
  "bg-[#B16ED0]",
];

const VISUALS = [
  "from-[#153D31] via-[#34745B] to-[#A5C9B8]",
  "from-[#222B55] via-[#5964A4] to-[#C7CAE5]",
  "from-[#503159] via-[#9665A4] to-[#DDC5E1]",
];

export default function ReadingPassageCard({
  test,
  index,
}: {
  test: ReadingTestSummary;
  index: number;
}) {
  const passage = Math.min(3, Math.max(1, passageNumberFromTitle(test.title)));
  const rawTitle = passageLabelOf(test).replace(/^Passage\s+\d+\s*:?\s*/i, "").trim();
  const title = rawTitle || `Reading Passage ${passage}`;

  return (
    <Link
      href={`/phong-luyen-tap/reading/${test.slug}`}
      className="group flex min-h-[350px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-xl"
    >
      <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${VISUALS[(index + passage - 1) % VISUALS.length]}`}>
        {test.coverImageUrl ? (
          <Image
            src={test.coverImageUrl}
            alt={`Minh họa cho ${title}`}
            fill
            sizes="(min-width: 1536px) 260px, (min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <>
            <BookOpen className="absolute right-6 top-6 text-white/20" size={76} strokeWidth={1.2} />
            <div className="absolute -bottom-16 -left-8 h-44 w-44 rounded-full border-[28px] border-white/10" />
          </>
        )}
        <span className={`absolute bottom-0 left-0 rounded-tr-2xl px-5 py-2 text-sm font-bold text-white ${BADGES[passage - 1]}`}>
          Passage {passage}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">
          [{test.collection}] - {title}
        </h3>
        <ul className="mt-3 space-y-1 text-sm leading-relaxed text-ink/70">
          {test.questionTypes.map((type) => (
            <li key={type}>· {questionTypeLabel(type)}</li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
