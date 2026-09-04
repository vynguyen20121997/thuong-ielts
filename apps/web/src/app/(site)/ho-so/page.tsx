import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";

import { currentStudent } from "../../../features/account/server/guard";
import ProfileForm from "../../../features/account/ui/ProfileForm";

import PageArch from "../../../components/PageArch";

export const metadata: Metadata = {
  title: "Hồ sơ học viên | HNT.IELTS",
};

export const dynamic = "force-dynamic";

function safeNext(raw: string | undefined): string {
  if (!raw) return "/kiem-tra-kien-thuc";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/kiem-tra-kien-thuc";
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);

  const student = await currentStudent();
  if (!student) {
    redirect(`/dang-nhap?next=${encodeURIComponent(`/ho-so?next=${target}`)}`);
  }

  const greeting = student.name?.split(" ").slice(-1)[0];

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <PageArch />
      <div className="relative z-10 max-w-xl mx-auto px-6">
        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-7 md:p-9">
          <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <UserRound size={14} />
            Hồ sơ học viên
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight mt-2">
            {greeting ? `Chào ${greeting}, cho hỏi thêm ba điều` : "Cho hỏi thêm ba điều"}
          </h1>
          <p className="text-sm text-ink/65 leading-relaxed mt-2 mb-7">
            Hỏi một lần thôi. Band mục tiêu sẽ được đặt cạnh band ước lượng sau mỗi bài, để bạn
            biết mình còn cách đích bao xa.
          </p>

          <ProfileForm initial={student.profile} next={target} />
        </div>
      </div>
    </main>
  );
}
