import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import NavigationButtonLabel from "../../../../components/NavigationButtonLabel";
import { notFound } from "next/navigation";

import { SKILL_SECTIONS } from "../page";

const READING_ILLUSTRATIONS = [
  "/images/reading-method/reading-01-structure.png",
  "/images/reading-method/reading-02-strategy.png",
  "/images/reading-method/reading-03-understanding.png",
  "/images/reading-method/reading-04-evidence.png",
  "/images/reading-method/reading-05-vocabulary.png",
  "/images/reading-method/reading-06-practice.png",
  "/images/reading-method/reading-07-progress.png",
  "/images/reading-method/reading-08-goal.png",
] as const;

type SkillPageProps = {
  params: Promise<{ skill: string }>;
};

export function generateStaticParams() {
  return SKILL_SECTIONS.map(({ id }) => ({ skill: id }));
}

export default async function SkillMethodPage({ params }: SkillPageProps) {
  const { skill } = await params;
  const section = SKILL_SECTIONS.find(({ id }) => id === skill);
  if (!section) notFound();

  const Icon = section.icon;

  return (
    <main className="relative z-10 min-h-screen bg-white pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        <Link
          href="/phuong-phap"
          className="group inline-flex items-center gap-2 text-sm font-bold text-brand/70 transition-colors hover:text-brand"
        >
          <ArrowLeft size={17} className="transition-transform group-hover:-translate-x-1" />
          Phương pháp giảng dạy
        </Link>

        <header className="mb-12 mt-7 border-b-2 border-brand/15 pb-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf text-brand">
              <Icon size={22} />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-brand md:text-5xl">Phương pháp Dạy {section.name}</h1>
          </div>
        </header>

        <div className="space-y-6">
          {section.items.map((item, itemIndex) => (
            <article key={item.title} className="rounded-[24px] bg-mist p-7 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                {section.id === "reading" && (
                  <img
                    src={READING_ILLUSTRATIONS[itemIndex]}
                    alt={`Minh họa: ${item.title}`}
                    className="aspect-square w-full rounded-2xl object-cover md:w-44 md:shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="mb-4 text-lg font-bold text-brand md:text-xl">
                    <span className="mr-2 text-brand/60">{itemIndex + 1}.</span>
                    {item.title}
                  </h2>
                  {item.paras?.map((paragraph, index) => (
                    <p key={`${item.title}-para-${index}`} className="mb-3 text-sm leading-relaxed text-brand/75 md:text-base">
                      {paragraph}
                    </p>
                  ))}
                  {item.bullets && (
                    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand/75 marker:text-brand md:text-base">
                      {item.bullets.map((bullet, index) => <li key={`${item.title}-bullet-${index}`}>{bullet}</li>)}
                    </ul>
                  )}
                  {item.after?.map((paragraph, index) => (
                    <p key={`${item.title}-after-${index}`} className="mb-3 text-sm leading-relaxed text-brand/75 last:mb-0 md:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <nav aria-label="Các kỹ năng khác" className="mt-14 border-t-2 border-brand/15 pt-8">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-brand/60">Khám phá kỹ năng khác</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SKILL_SECTIONS.filter(({ id }) => id !== section.id).map((other) => (
              <Link
                key={other.id}
                href={`/phuong-phap/${other.id}`}
                className="group flex items-center justify-between rounded-2xl border border-brand/10 px-5 py-4 font-bold text-brand transition-colors hover:bg-sage"
              >
                <NavigationButtonLabel>Dạy {other.name}</NavigationButtonLabel>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
