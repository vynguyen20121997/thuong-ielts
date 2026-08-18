/**
 * Gửi thử một tin ZNS tới số của mình, TRƯỚC khi bật cho học sinh.
 *
 * Lý do phải có bước này: đường ZNS hỏng theo nhiều kiểu và mỗi kiểu báo một
 * mã khác nhau — OA chưa xác thực, mẫu tin chưa duyệt, hết tiền trong ví ZNS,
 * số điện thoại chưa từng quan tâm OA. Phát hiện lúc cả lớp đang đợi đăng nhập
 * thì quá muộn.
 *
 * Usage: npx tsx scripts/zalo-test.ts 0912345678
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "apps", "web", ".env.local") });

import { normalizePhone } from "../apps/web/src/features/account/domain/types";
import { sendOtpViaZalo } from "../apps/web/src/features/account/server/zalo";

/* Bảng lỗi hay gặp của ZNS. Zalo trả mã số, không kèm lời khuyên nào. */
const GOI_Y: Record<string, string> = {
  "-124": "Access token sai hoặc hết hạn. Chạy lại scripts/zalo-token.ts.",
  "-201": "Tham số sai — thường là template_data thiếu đúng tên biến mẫu tin đòi.",
  "-108": "Số điện thoại không hợp lệ với ZNS (phải dạng 84…, là số thật, có Zalo).",
  "-118": "Người nhận chưa từng tương tác với OA, hoặc đã chặn OA.",
  "-119": "Mẫu tin chưa được duyệt, hoặc không thuộc loại OTP.",
  "-125": "Hết tiền trong ví ZNS. Nạp thêm ở zns.oa.zalo.me.",
  "-133": "OA chưa được xác thực (verified). ZNS chỉ dùng được với OA đã xác thực.",
};

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error("Thiếu số điện thoại.\n  npx tsx scripts/zalo-test.ts 0912345678");
    process.exit(1);
  }

  const phone = normalizePhone(raw);
  if (!phone) {
    console.error(`Số "${raw}" không hợp lệ. Nhập số di động Việt Nam, ví dụ 0912345678.`);
    process.exit(1);
  }

  const thieu = ["ZALO_OA_APP_ID", "ZALO_OA_SECRET_KEY", "ZALO_ZNS_TEMPLATE_ID"].filter(
    (k) => !process.env[k]
  );
  if (thieu.length) {
    console.error("Thiếu biến môi trường: " + thieu.join(", "));
    process.exit(1);
  }

  // Mã thật gửi cho học sinh là ngẫu nhiên và được băm trước khi lưu; ở đây
  // chỉ là một con số để nhìn thấy trên điện thoại.
  const code = "123456";
  console.log(`Đang gửi mã ${code} tới ${phone}...`);

  try {
    await sendOtpViaZalo(phone, code);
    console.log("Gửi xong. Mở Zalo trên máy đó xem đã nhận chưa.");
    console.log("Nhận được rồi thì đặt AUTH_PHONE_OTP_ENABLED=\"true\" để bật cho học sinh.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Hỏng:", msg);
    for (const [ma, goiY] of Object.entries(GOI_Y)) {
      if (msg.includes(ma)) console.error("\nCó thể là:", goiY);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
