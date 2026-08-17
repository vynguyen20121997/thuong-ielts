import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "./lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isLoginApi = pathname === "/api/login";

  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protect every route in this app except /login and /api/login (checked above).
//
// `socket.io` cũng được loại ra: Socket.IO gắn thẳng vào HTTP server nên
// `server.js` xử lý trước khi Next nhìn thấy, và nó tự xác thực phiên lúc bắt
// tay. Ghi rõ ở đây để không ai đi tìm xem sao middleware không chạy cho nó.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|socket.io).*)"],
};
