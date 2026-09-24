import Link from "next/link";
import { Headphones } from "lucide-react";
import { questionTypeLabel } from "../domain/questionTypeLabels";
import type { ListeningTestSummary } from "../domain/types";

const BADGES = ["bg-[#FF9818]", "bg-[#5C63E6]", "bg-[#B16ED0]", "bg-[#3478D4]"];
const TONES = [
  "from-[#164837] via-[#3A8064] to-[#B1D2C2]",
  "from-[#29305C] via-[#5965A9] to-[#C8CAE5]",
  "from-[#563160] via-[#9A66AA] to-[#DFC7E4]",
  "from-[#184A71] via-[#3478A5] to-[#B9D6E8]",
];

export default function ListeningPartCard({ test, part, title, index }: { test: ListeningTestSummary; part: number; title: string; index: number }) {
  const questionTypes = test.questionTypesBySection?.[String(part)] ?? [];
  return <Link href={`/phong-luyen-tap/listening/${test.slug}?part=${part}`} className="group flex min-h-[350px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-xl">
    <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${TONES[index%TONES.length]}`}><Headphones className="absolute right-6 top-6 text-white/20" size={78} strokeWidth={1.2}/><div className="absolute -bottom-16 -left-8 h-44 w-44 rounded-full border-[28px] border-white/10"/><span className={`absolute bottom-0 left-0 rounded-tr-2xl px-5 py-2 text-sm font-bold text-white ${BADGES[part-1]}`}>Part {part}</span></div>
    <div className="flex flex-1 flex-col p-5"><h3 className="text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">[{test.collection}] - {title || `Listening Part ${part}`}</h3><ul className="mt-3 space-y-1 text-sm leading-relaxed text-ink/70">{questionTypes.map(type=><li key={type}>· {questionTypeLabel(type)}</li>)}</ul></div>
  </Link>;
}
