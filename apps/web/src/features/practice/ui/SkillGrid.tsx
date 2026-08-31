import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, Lock, Mic, PenLine } from "lucide-react";

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
};

function SkillCard({ skill, compact }: { skill: PracticeSkill; compact?: boolean }) {
  const Icon = ICONS[skill.id];
  const isOpen = skill.status === "available";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? "bg-leaf text-brand group-hover:bg-brand group-hover:text-white" : "bg-black/[0.06] text-ink/35"}`}
        >
          <Icon size={20} />
        </span>

        {isOpen ? (
          <span className="text-2xs font-medium text-brand bg-leaf/30 rounded-full px-2.5 py-1">
            Miễn phí
          </span>
        ) : (
          <span className="text-2xs font-medium text-ink/40 bg-black/[0.04] rounded-full px-2.5 py-1 flex items-center gap-1">
            <Lock size={10} />
            Sắp ra mắt
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3
          className={`font-serif text-xl font-bold tracking-tight ${isOpen ? "text-ink" : "text-ink/45"}`}
        >
          {skill.name}
        </h3>
        <span
          className={`text-2xs font-medium block mt-1 ${isOpen ? "text-brand/70" : "text-ink/30"}`}
        >
          {skill.label}
        </span>

        {!compact && (
          <p
            className={`text-sm leading-relaxed mt-3 ${isOpen ? "text-ink/65" : "text-ink/35"}`}
          >
            {skill.description}
          </p>
        )}
      </div>

      <div
        className={`mt-5 pt-4 border-t flex items-center justify-between gap-2 ${isOpen ? "border-black/5" : "border-black/[0.03]"}`}
      >
        <span
          className={`text-2xs font-medium ${isOpen ? "text-ink/50" : "text-ink/25"}`}
        >
          {skill.hint}
        </span>
        {isOpen && (
          <ArrowRight
            size={16}
            className="text-brand transition-transform duration-300 group-hover:translate-x-1"
          />
        )}
      </div>
    </>
  );

  const shell =
    "group flex flex-col h-full text-left bg-white border rounded-2xl p-6 transition-all duration-300";

  if (!isOpen) {
    return (
      <div
        aria-disabled="true"
        title="Kỹ năng này đang được biên soạn"
        className={`${shell} border-black/5 opacity-70 cursor-not-allowed select-none`}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={skill.href}
      className={`${shell} border-black/5 shadow-sm hover:shadow-xl hover:border-brand/30 hover:-translate-y-1 cursor-pointer`}
    >
      {body}
    </Link>
  );
}

export default function SkillGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {PRACTICE_SKILLS.map((skill) => (
        <SkillCard key={skill.id} skill={skill} compact={compact} />
      ))}
    </div>
  );
}
