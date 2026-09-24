import Link from "next/link";
import { BookOpen, Headphones, Layers, Lock, Mic, PenLine } from "lucide-react";

import { PRACTICE_SKILLS } from "../domain/skills";
import type { PracticeSkill, SkillId } from "../domain/types";

/**
 * Presentation only. Which skills exist and which are open is decided in
 * `domain/skills.ts`; this file just knows how a skill card should look.
 */

const ICONS: Record<SkillId, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
  vocab: Layers,
};

function SkillCard({ skill, compact }: { skill: PracticeSkill; compact?: boolean }) {
  const Icon = ICONS[skill.id];
  const isOpen = skill.status === "available";

  if (isOpen) {
    return (
      <Link
        href={skill.href}
        className="group flex min-h-44 flex-col items-center justify-center gap-5 rounded-2xl border border-black/5 bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
          <Icon size={28} />
        </span>
        <h3 className="text-2xl font-bold tracking-tight text-ink">{skill.name}</h3>
      </Link>
    );
  }
  return (
    <div
      aria-disabled="true"
      className="relative flex min-h-44 select-none flex-col items-center justify-center gap-5 rounded-2xl border border-black/5 bg-white p-7 text-center opacity-70"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/[0.06] text-ink/35"><Icon size={28}/></span>
      <h3 className="text-2xl font-bold tracking-tight text-ink/50">{skill.name}</h3>
      <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/[0.05] px-2.5 py-1 text-2xs font-medium text-ink/45"><Lock size={10}/>Sắp ra mắt</span>
    </div>
  );
}

export default function SkillGrid({ compact = false }: { compact?: boolean }) {
  return (
    /* Năm thẻ: 4 cột thì thẻ cuối đứng lẻ một hàng, nên chia 5 từ `xl` và giữ
       3 cột ở `lg` để không thẻ nào bị bóp còn hơn 200px. */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      {PRACTICE_SKILLS.map((skill) => (
        <SkillCard key={skill.id} skill={skill} compact={compact} />
      ))}
    </div>
  );
}
