import Link from "next/link";
import { redirect } from "next/navigation";
import { conMo, luotDaLam, timBaiGiaoTheoToken } from "@thuong-ielts/db";

import { currentStudent } from "../../../features/account/server/guard";
import { khachHienTai } from "../../../features/account/server/khach";
import VaoBangTen from "./VaoBangTen";

export const dynamic = "force-dynamic";

/**
 * Cửa vào bằng link cô gửi.
 *
 * Ba điều khác hẳn luồng học sinh tự vào làm bài:
 *
 * 1. **Không bắt khai hồ sơ.** Cô gửi link giữa buổi dạy; bắt cả lớp khai
 *    tuổi/nghề/target ở đây là chặn đứng buổi học. Hồ sơ vẫn hỏi ở luồng kia.
 * 2. **Cho gõ tên là vào** nếu cô bật — không cần tài khoản Google.
 * 3. **Một link làm một lần**: vào lại thì thấy kết quả lần trước chứ không mở
 *    lại đề, và đó là một trang bình thường chứ không phải màn báo lỗi.
 */
export default async function TrangVaoBangLink({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bai = await timBaiGiaoTheoToken(token);

  if (!bai) {
    return (
      <Khung tieuDe="Không tìm thấy buổi học này">
        <p>
          Link có thể bị chép thiếu một đoạn. Nhờ thầy cô gửi lại giúp, hoặc kiểm tra xem đã dán
          trọn vẹn chưa.
        </p>
      </Khung>
    );
  }

  const student = await currentStudent();
  const khach = await khachHienTai();

  // Đã làm rồi thì cho xem lại kết quả, không mở lại đề. Kiểm TRƯỚC khi xét
  // link còn mở hay không: buổi học đóng rồi mà em ấy vẫn có quyền xem điểm
  // của chính mình.
  if (bai.oneAttempt) {
    const cu = await luotDaLam(bai.id, {
      studentId: student?.id ?? null,
      guestKey: khach?.key ?? null,
    });
    if (cu && cu.status === "submitted") {
      return (
        <Khung tieuDe="Em đã làm bài này rồi">
          <p className="text-lg">
            Kết quả: <b className="tabular-nums">{cu.correct}</b>
            <span className="text-ink/65">/{cu.total} câu</span>
            {cu.band !== null && (
              <>
                {" "}
                · band ước tính <b className="tabular-nums">{cu.band.toFixed(1)}</b>
              </>
            )}
          </p>
          <p className="text-sm text-ink/65">
            Buổi này thầy cô đặt mỗi bạn làm một lần. Muốn luyện thêm thì vào mục Kiểm tra kiến
            thức chọn đề khác.
          </p>
          <Link
            href="/phong-luyen-tap"
            className="inline-block rounded-full bg-brand hover:bg-brand-deep px-5 py-2.5 text-sm font-bold text-white transition-colors"
          >
            Luyện đề khác
          </Link>
        </Khung>
      );
    }
    // Còn dở dang thì vào làm tiếp — rơi xuống dưới.
  }

  // Writing tự lo "đã nộp chưa" ở trang viết bài (bài nằm ở `writing_submissions`,
  // không phải `attempts`), kể cả khi buổi đã đóng.
  if (bai.skill === "writing" && (student || khach)) {
    const { baiNopCua } = await import("../../../features/practice/server/writingAssignment");
    const cu = await baiNopCua(bai.id, { studentId: student?.id ?? null, guestKey: khach?.key ?? null, guestName: null });
    if (cu) redirect(`/phong-luyen-tap/writing/bai/${token}`);
  }

  if (!conMo(bai)) {
    return (
      <Khung tieuDe="Buổi học này đã kết thúc">
        <p>Thầy cô đã đóng link. Nếu em vào muộn, nhắn thầy cô mở lại giúp nhé.</p>
        <Link
          href="/phong-luyen-tap"
          className="inline-block rounded-full bg-brand hover:bg-brand-deep px-5 py-2.5 text-sm font-bold text-white transition-colors"
        >
          Tự luyện đề khác
        </Link>
      </Khung>
    );
  }

  const duongDenBai =
    bai.skill === "writing"
      ? `/phong-luyen-tap/writing/bai/${token}`
      : bai.skill === "listening"
      ? `/phong-luyen-tap/listening/${bai.target}?bai=${token}`
      : bai.scope === "test"
        ? `/phong-luyen-tap/reading/test/${bai.target}?bai=${token}`
        : // Passage lẻ (bộ VOL) và đề nội bộ: trang thi cả test đòi mã đề dạng
          // `cam10-test1`, đưa slug lẻ vào đó là 404.
          `/phong-luyen-tap/reading/${bai.target}?bai=${token}`;

  // Đã có danh tính (tài khoản hoặc khách) thì đi thẳng vào bài.
  if (student || khach) redirect(duongDenBai);

  return (
    <Khung tieuDe={bai.label || bai.title}>
      <p className="text-sm text-ink/60">
        {bai.title} · {bai.skill === "listening" ? "Nghe" : bai.skill === "writing" ? "Viết" : "Đọc"}
      </p>
      <VaoBangTen token={token} choKhach={bai.allowGuest} duongDenBai={duongDenBai} />
    </Khung>
  );
}

function Khung({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-lg py-20 gutter">
      <div className="rounded-3xl border border-black/10 bg-white p-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-ink">{tieuDe}</h1>
        {children}
      </div>
    </main>
  );
}
