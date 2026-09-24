import Link from "next/link";
import { Headphones } from "lucide-react";
import type { ListeningBookGroup } from "../domain/listeningCatalog";

const COVER_TONES = [
  "from-[#143D30] via-[#2F7257] to-[#A6C9B8]",
  "from-[#253159] via-[#53639C] to-[#C5CAE2]",
  "from-[#54315C] via-[#9366A0] to-[#DCC7E0]",
];

function testNumber(title: string, slug: string): string {
  return (
    /test\s*(\d+)/i.exec(title)?.[1] ?? /test-?(\d+)/i.exec(slug)?.[1] ?? ""
  );
}

export default function ListeningBookCard({
  group,
  index,
}: {
  group: ListeningBookGroup;
  index: number;
}) {
  const test = group.tests[0];
  const number = testNumber(test.title, test.slug);
  const title = `${group.collection}${number ? ` - Test ${number}` : ` - ${group.label}`}`;

  return (
    <Link
      href={`/phong-luyen-tap/listening/${test.slug}`}
      className="group flex min-h-[315px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div
        className={`relative h-44 overflow-hidden bg-gradient-to-br ${COVER_TONES[index % COVER_TONES.length]}`}
      >
        <Headphones
          className="absolute right-6 top-6 text-white/20"
          size={84}
          strokeWidth={1.15}
        />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full border-[32px] border-white/10" />
        <span className="absolute bottom-0 left-0 rounded-tr-2xl bg-brand px-5 py-2 text-sm font-bold text-white">
          Full test
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">
          {title}
        </h3>
        <p className="mt-2 text-sm text-ink/65">
          Listening · {test.sections.length} parts
        </p>
        <span className="mt-auto pt-5 text-sm font-semibold text-brand">
          Làm toàn bộ đề →
        </span>
      </div>
    </Link>
  );
}
