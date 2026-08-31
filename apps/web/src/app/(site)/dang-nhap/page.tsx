import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { phoneOtpEnabled } from "../../../auth";
import { currentStudent } from "../../../features/account/server/guard";
import { isProfileComplete } from "../../../features/account/domain/types";
import LoginPanel from "../../../features/account/ui/LoginPanel";

export const metadata: Metadata = {
  title: "Đăng nhập | HNT.IELTS",
  description: "Đăng nhập để làm đề Reading và Listening, lưu kết quả và theo dõi tiến bộ.",
};

export const dynamic = "force-dynamic";

/** Chỉ nhận đường dẫn nội bộ: `next=https://…` là mở cửa cho chuyển hướng lừa đảo. */
function safeNext(raw: string | undefined): string {
  if (!raw) return "/kiem-tra-kien-thuc";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/kiem-tra-kien-thuc";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);

  // Đã đăng nhập rồi thì đừng bắt đăng nhập lại — đẩy tiếp tới chỗ còn thiếu.
  const student = await currentStudent();
  if (student) {
    redirect(isProfileComplete(student.profile) ? target : `/ho-so?next=${encodeURIComponent(target)}`);
  }

  const providers = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    facebook: Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET),
    // Tạm tắt; bật lại bằng AUTH_PHONE_OTP_ENABLED="true".
    phone: phoneOtpEnabled,
  };

  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-7 md:p-9">
          <span className="flex items-center gap-1.5 text-2xs font-medium text-brand">
            <BookOpen size={14} />
            Kiểm tra kiến thức
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight mt-2">
            Đăng nhập để làm bài
          </h1>
          <p className="text-sm text-ink/65 leading-relaxed mt-2 mb-7">
            Có tài khoản thì điểm và lịch sử làm bài mới lưu lại được, để lần sau còn biết mình
            tiến tới đâu.
          </p>

          <LoginPanel providers={providers} next={target} />
        </div>

        {/*
          Đường lùi. Chạy thử với persona lần đầu vào: bấm một đề rồi bị đẩy
          sang đây, trong phần nội dung không có một link nào để quay lại xem
          tiếp các đề khác — muốn thoát phải dùng menu ở đầu trang.
        */}
        <p className="text-center mt-6">
          <Link
            href="/kiem-tra-kien-thuc"
            className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink/50 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} />
            Quay lại xem các đề
          </Link>
        </p>

        <p className="text-2xs text-ink/40 text-center mt-5 leading-relaxed">
          Đăng nhập nghĩa là bạn đồng ý để HNT.IELTS lưu tên, ảnh đại diện và kết quả làm bài của
          mình.
        </p>
      </div>
    </main>
  );
}
