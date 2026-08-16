import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";

import { currentStudent } from "../../../features/account/server/guard";
import ProfileForm from "../../../features/account/ui/ProfileForm";

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
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-[#FAF9F6] min-h-screen">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-7 md:p-9">
          <span className="flex items-center gap-1.5 text-2xs font-medium text-[#14532D]">
            <UserRound size={14} />
            Hồ sơ học viên
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A] leading-tight mt-2">
            {greeting ? `Chào ${greeting}, cho hỏi thêm ba điều` : "Cho hỏi thêm ba điều"}
          </h1>
          <p className="text-sm text-[#1A1A1A]/65 leading-relaxed mt-2 mb-7">
            Hỏi một lần thôi. Band mục tiêu sẽ được đặt cạnh band ước lượng sau mỗi bài, để bạn
            biết mình còn cách đích bao xa.
          </p>

          <ProfileForm initial={student.profile} next={target} />
        </div>
      </div>
    </main>
  );
}
