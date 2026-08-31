import { Sparkles } from "lucide-react";
import CountUp from "./CountUp";

export interface HeaderAvatar {
  label: string;
  imageUrl?: string;
}

interface StudentPageHeaderProps {
  eyebrow: string;
  count: number | string;
  heading: string;
  description: string;
  avatars: HeaderAvatar[];
  showAvatars?: boolean;
  maxAvatars?: number;
  overflow?: number;
}

// On-brand colorful palette for the avatar row (all dark enough for white text).
const AVATAR_COLORS = [
  "#14532D",
  "#15803D",
  "#2563EB",
  "#DB2777",
  "#F59E0B",
  "#7C3AED",
  "#0891B2",
  "#DC2626",
  "#059669",
  "#EA580C",
];

export default function StudentPageHeader({
  eyebrow,
  count,
  heading,
  description,
  avatars,
  showAvatars = true,
  maxAvatars = 14,
  overflow = 0,
}: StudentPageHeaderProps) {
  const shown = avatars.slice(0, maxAvatars);

  return (
    <div className="relative overflow-hidden pt-28 md:pt-32 pb-4">
      {/* Soft brand arch background */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[160%] h-[560px] bg-gradient-to-b from-leaf/30 via-leaf/10 to-transparent rounded-b-[50%] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <span className="text-xs text-brand mb-5 font-medium inline-flex items-center gap-1.5">
          <Sparkles size={14} className="text-brand" />
          {eyebrow}
        </span>

        {/* Big underlined total */}
        <div className="mb-4">
          <span className="relative inline-block font-serif text-6xl md:text-8xl font-bold tracking-tighter text-brand leading-none">
            {typeof count === "number" ? <CountUp value={count} /> : count}
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 md:-bottom-3 h-1.5 md:h-2 w-2/3 bg-leaf rounded-full" />
          </span>
        </div>

        <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-ink leading-tight mb-5 text-balance">
          {heading}
        </h1>

        <p className="text-ink/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-8">
          {description}
        </p>

        {/* Avatar row */}
        {showAvatars && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {shown.map((a, i) => (
            <div
              key={i}
              className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm shrink-0"
              style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              title={a.label}
            >
              {a.imageUrl ? (
                <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-serif font-bold text-sm md:text-base leading-none">
                  {a.label}
                </span>
              )}
            </div>
            ))}
            {overflow > 0 && (
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center bg-brand ring-2 ring-white shadow-sm shrink-0">
              <span className="text-white font-mono font-bold text-2xs md:text-xs leading-none">
                +{overflow}
              </span>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
