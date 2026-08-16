import { NextResponse } from "next/server";

import { OTP_RESEND_COOLDOWN_SECONDS, resendWaitSeconds } from "../../../../features/account/domain/otp";
import { normalizePhone } from "../../../../features/account/domain/types";
import { generateCode, getOtp, saveOtp } from "../../../../features/account/server/otpRepository";
import { sendOtpViaZalo, ZaloNotConfiguredError } from "../../../../features/account/server/zalo";

/**
 * Xin mã OTP cho một số điện thoại. Gửi mã đi, không trả mã về —
 * response chỉ nói "đã gửi" và bao giờ được gửi lại.
 */
export async function POST(request: Request) {
  // Đường OTP đang tắt. Chặn ngay ở đây chứ không chỉ giấu nút: giấu nút mà để
  // route mở thì ai gọi thẳng API vẫn làm tốn tin nhắn và tạo mã trong DB.
  if (process.env.AUTH_PHONE_OTP_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Đăng nhập bằng số điện thoại đang tạm khoá. Vui lòng dùng Google." },
      { status: 404 }
    );
  }

  let body: { phone?: unknown };
  try {
    body = (await request.json()) as { phone?: unknown };
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const phone = normalizePhone(String(body.phone ?? ""));
  if (!phone) {
    return NextResponse.json(
      { error: "Số điện thoại không hợp lệ. Nhập số di động Việt Nam, ví dụ 0912 345 678." },
      { status: 400 }
    );
  }

  // Chặn bấm gửi lại liên tục: mỗi tin ZNS đều mất tiền, và gửi dồn dập cũng
  // là cách rẻ nhất để ai đó phá tài khoản Zalo của mình.
  const existing = await getOtp(phone);
  const wait = resendWaitSeconds(existing, new Date());
  if (wait > 0) {
    return NextResponse.json(
      { error: `Vui lòng đợi ${wait} giây rồi gửi lại.`, retryAfter: wait },
      { status: 429 }
    );
  }

  const code = generateCode();
  await saveOtp(phone, code);

  try {
    await sendOtpViaZalo(phone, code);
  } catch (err) {
    if (err instanceof ZaloNotConfiguredError) {
      /*
        Chưa có khoá Zalo. Ở máy dev thì in mã ra console để chạy thử được
        trọn luồng; trên production thì báo lỗi thật, tuyệt đối không in —
        in mã ra log production là đưa chìa khoá cho bất kỳ ai đọc được log.
      */
      if (process.env.NODE_ENV === "production") {
        console.error("Zalo chưa cấu hình — không gửi được OTP.");
        return NextResponse.json(
          { error: "Hệ thống gửi mã chưa sẵn sàng. Vui lòng đăng nhập bằng Google hoặc Facebook." },
          { status: 503 }
        );
      }
      console.warn(`[dev] OTP cho ${phone}: ${code} (chưa cấu hình Zalo nên không gửi thật)`);
      return NextResponse.json({ ok: true, devHint: true, retryAfter: OTP_RESEND_COOLDOWN_SECONDS });
    }

    console.error("Gửi OTP qua Zalo thất bại:", err);
    return NextResponse.json(
      { error: "Không gửi được mã lúc này. Thử lại sau ít phút." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, retryAfter: OTP_RESEND_COOLDOWN_SECONDS });
}
