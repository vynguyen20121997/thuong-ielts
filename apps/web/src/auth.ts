import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

import { checkOtp } from "./features/account/domain/otp";
import { normalizePhone } from "./features/account/domain/types";
import {
  codeMatches,
  consumeOtp,
  countFailedAttempt,
  getOtp,
} from "./features/account/server/otpRepository";
import { findOrCreateStudent } from "./features/account/server/studentRepository";

/**
 * Ba đường đăng nhập, một danh tính.
 *
 * Phiên để trong **JWT** chứ không phải bảng `sessions`, vì hai lý do:
 * đăng nhập bằng OTP đi qua Credentials provider mà Auth.js chỉ cho
 * Credentials chạy với JWT; và mỗi lần mở trang khỏi thêm một vòng hỏi DB.
 * Đổi lại, thu hồi phiên tức thì thì không làm được — chấp nhận được với một
 * trang luyện đề, sẽ khác nếu sau này có thanh toán.
 *
 * Cố ý KHÔNG dùng adapter của Auth.js: nó đòi bảng `users`/`accounts` với id
 * SERIAL và cột camelCase, lạc lõng giữa các bảng còn lại. `findOrCreateStudent`
 * làm đúng việc đó bằng schema của mình, và nó cũng là chỗ nối hai cách đăng
 * nhập vào cùng một học viên.
 */

const providers = [];

// Chỉ bật provider nào đã có khoá. Thiếu khoá mà vẫn khai báo thì Auth.js ném
// lỗi lúc chạy, còn màn đăng nhập thì hiện một nút bấm vào là hỏng.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

/**
 * Đăng nhập bằng số điện thoại. Mã đã được gửi trước đó qua route
 * `/api/auth/otp`; ở đây chỉ đối chiếu.
 */
providers.push(
  Credentials({
    id: "phone",
    name: "Số điện thoại",
    credentials: { phone: {}, code: {} },
    async authorize(raw) {
      const phone = normalizePhone(String(raw?.phone ?? ""));
      const code = String(raw?.code ?? "").trim();
      if (!phone || !code) return null;

      const record = await getOtp(phone);
      const verdict = checkOtp(record, record ? codeMatches(record, code) : false, new Date());

      if (!verdict.ok) {
        // Đếm lần gõ sai để khoá dần; các lý do khác (hết hạn, chưa xin mã)
        // không phải lỗi gõ nên không tính.
        if (verdict.reason === "wrong-code") await countFailedAttempt(phone);
        return null;
      }

      await consumeOtp(phone);

      const student = await findOrCreateStudent({
        provider: "phone",
        providerAccountId: phone,
        phone,
      });

      return { id: student.id, name: student.name ?? null, email: student.email ?? null };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/dang-nhap", error: "/dang-nhap" },
  trustHost: true,
  callbacks: {
    /**
     * OAuth: đây là chỗ học viên được tạo hoặc nối vào tài khoản cũ. Trả về
     * `false` là chặn đăng nhập, nên lỗi DB ở đây phải ném ra để Auth.js đưa
     * về trang lỗi, thay vì im lặng cho vào mà không có hồ sơ.
     */
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "phone") return true;
      if (account.provider !== "google" && account.provider !== "facebook") return false;

      const student = await findOrCreateStudent({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        ...(user.email ? { email: user.email } : {}),
        ...(user.name ? { name: user.name } : {}),
        ...(user.image ? { avatarUrl: user.image } : {}),
        ...(typeof profile?.picture === "string" ? { avatarUrl: profile.picture } : {}),
      });

      // Ghi đè id của provider bằng id học viên của mình, để token mang đúng
      // khoá dùng tra DB về sau.
      user.id = student.id;
      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) token.studentId = user.id;
      return token;
    },

    async session({ session, token }) {
      if (token.studentId) {
        session.user = { ...session.user, id: String(token.studentId) };
      }
      return session;
    },
  },
});
