"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Briefcase, GraduationCap, Loader2, Target, Users } from "lucide-react";

import {
  MAX_AGE,
  MIN_AGE,
  OCCUPATION_LABELS,
  TARGET_BANDS,
  validateProfile,
  type Occupation,
  type StudentProfile,
} from "../domain/types";

/**
 * Hỏi ba thứ trước khi vào phòng thi: tuổi, nghề nghiệp, band mục tiêu.
 *
 * Cả ba đều dùng được ngay chứ không phải hỏi cho có: tuổi và nghề để cô biết
 * lớp mình gồm những ai, còn band mục tiêu để đối chiếu với band ước lượng sau
 * mỗi bài — đó mới là con số học sinh muốn thấy.
 */

const OCCUPATION_ICONS: Record<Occupation, typeof GraduationCap> = {
  student: GraduationCap,
  worker: Briefcase,
  teacher: Users,
};

export default function ProfileForm({
  initial,
  next,
}: {
  initial: StudentProfile | null;
  next: string;
}) {
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [occupation, setOccupation] = useState<Occupation | undefined>(initial?.occupation);
  const [targetBand, setTargetBand] = useState<number | undefined>(initial?.targetBand);
  const [errors, setErrors] = useState<Partial<Record<"age" | "occupation" | "targetBand", string>>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const input = { age: Number(age), occupation, targetBand };
    const found = validateProfile(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFailed(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setFailed(payload?.error ?? "Không lưu được hồ sơ. Thử lại.");
        return;
      }
      window.location.href = next;
    } catch {
      setFailed("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const fieldLabel = "text-2xs font-medium text-[#1A1A1A]/50";

  return (
    <div className="flex flex-col gap-7">
      {/* Tuổi */}
      <div className="flex flex-col gap-2">
        <label htmlFor="age" className={fieldLabel}>
          Bạn bao nhiêu tuổi?
        </label>
        <input
          id="age"
          type="number"
          inputMode="numeric"
          min={MIN_AGE}
          max={MAX_AGE}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="18"
          className="w-32 rounded-full border border-black/10 bg-white px-5 py-3 text-sm tabular-nums text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#14532D]/50 transition-colors"
        />
        {errors.age && <FieldError message={errors.age} />}
      </div>

      {/* Nghề nghiệp */}
      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>Bạn đang là</span>
        <div className="grid sm:grid-cols-3 gap-2">
          {(Object.keys(OCCUPATION_LABELS) as Occupation[]).map((value) => {
            const Icon = OCCUPATION_ICONS[value];
            const active = occupation === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setOccupation(value)}
                aria-pressed={active}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? "border-[#14532D] bg-[#14532D] text-white"
                    : "border-black/10 bg-white text-[#1A1A1A]/70 hover:border-[#14532D]/40 hover:text-[#14532D]"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                {OCCUPATION_LABELS[value]}
              </button>
            );
          })}
        </div>
        {errors.occupation && <FieldError message={errors.occupation} />}
      </div>

      {/* Band mục tiêu */}
      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>Band Overall bạn muốn đạt</span>
        <div className="flex flex-wrap gap-2">
          {TARGET_BANDS.map((band) => {
            const active = targetBand === band;
            return (
              <button
                key={band}
                type="button"
                onClick={() => setTargetBand(band)}
                aria-pressed={active}
                className={`min-w-14 rounded-full border px-4 py-2.5 text-sm font-semibold tabular-nums transition-colors cursor-pointer ${
                  active
                    ? "border-[#14532D] bg-[#14532D] text-white"
                    : "border-black/10 bg-white text-[#1A1A1A]/70 hover:border-[#14532D]/40 hover:text-[#14532D]"
                }`}
              >
                {band.toFixed(1)}
              </button>
            );
          })}
        </div>
        {errors.targetBand && <FieldError message={errors.targetBand} />}
      </div>

      {failed && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{failed}</span>
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="flex items-center justify-center gap-2 w-full rounded-full bg-[#14532D] hover:bg-[#052E16] disabled:cursor-wait px-4 py-4 text-sm font-semibold text-white cursor-pointer transition-colors"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
        ) : (
          <Target size={16} />
        )}
        Lưu và vào làm bài
        {!busy && <ArrowRight size={15} />}
      </button>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <span className="text-2xs text-red-600">{message}</span>;
}
