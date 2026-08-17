import { createServer } from "node:http";
import next from "next";
import { Server as SocketServer } from "socket.io";

import { moCauNoi } from "./src/lib/liveBridge.js";
import { cookiePhien, readSessionToken } from "./src/lib/sessionToken.js";

/**
 * Server tự viết cho trang quản trị.
 *
 * Next.js không nhận được yêu cầu nâng cấp lên WebSocket trong route handler,
 * nên muốn có Socket.IO thì phải tự cầm HTTP server và cho Next chạy bên trong.
 * Đây là toàn bộ lý do file này tồn tại — mọi thứ khác vẫn là Next như cũ.
 *
 * Vì file này thay `next start`, `render.yaml` phải trỏ startCommand vào đây.
 */

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? (dev ? 2100 : 4174));
const hostname = "0.0.0.0";

const app = next({ dev, hostname, port, dir: process.cwd() });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error("[admin] xử lý request lỗi:", err);
    res.statusCode = 500;
    res.end("Internal error");
  });
});

const io = new SocketServer(server, {
  path: "/socket.io",
  // Cùng gốc với trang quản trị nên không cần mở CORS. Mở ra là cho phép
  // trang bất kỳ nối vào xem điểm học sinh theo thời gian thực.
  cors: { origin: false },
});

/*
  Xác thực NGAY LÚC BẮT TAY, không phải sau khi đã nối.

  Luồng này chở đúng/sai từng câu của học sinh trong lúc các em còn đang thi.
  Nối được mà chưa xác thực rồi mới kiểm sau nghĩa là có một khoảnh khắc ai
  cũng nghe được. Ở đây sai một cái là từ chối luôn, chưa vào tới phòng nào.
*/
io.use((socket, next) => {
  const phien = readSessionToken(cookiePhien(socket.request.headers.cookie));
  if (!phien) return next(new Error("unauthorized"));
  socket.data.teacherId = phien.teacherId;
  next();
});

io.on("connection", (socket) => {
  // Mỗi đề là một phòng. Sau này khi có bảng `assignments`, phòng sẽ là mã bài
  // cô giao thay vì mã đề — đổi đúng chỗ này.
  socket.on("xem", (target) => {
    if (typeof target !== "string" || target.length > 120) return;
    for (const phong of socket.rooms) {
      if (phong !== socket.id) socket.leave(phong);
    }
    socket.join(target);
  });

  socket.on("thoi-xem", (target) => {
    if (typeof target === "string") socket.leave(target);
  });
});

/*
  Nhịp từ tiến trình `web` đi qua Postgres rồi tới đây.

  Chỉ bắn cho phòng đúng đề. Cô đang xem Cam 12 Test 3 thì không phải nhận
  nhịp của lớp khác — vừa tốn đường truyền vừa lộ dữ liệu không cần thiết.
*/
const cauNoi = moCauNoi((goi) => {
  // `lop` là mã lớp do `maLop()` bên packages/db tính ra — mọi em làm cùng một
  // đề đều rơi vào cùng phòng, kể cả khi em thi cả bài còn em kia làm passage lẻ.
  const phong = goi?.lop ?? goi?.target;
  if (typeof phong !== "string") return;
  io.to(phong).emit("nhip", goi);
});

server.listen(port, hostname, () => {
  console.log(`[admin] sẵn sàng ở http://${hostname}:${port} (socket đã bật)`);
});

// Render gửi SIGTERM lúc deploy. Đóng tử tế thì kết nối LISTEN được trả lại
// ngay thay vì để RDS chờ hết thời gian rồi mới dọn.
for (const tin of ["SIGTERM", "SIGINT"]) {
  process.on(tin, () => {
    console.log(`[admin] nhận ${tin}, đang đóng...`);
    cauNoi.dong();
    io.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
