import pg from "pg";

/**
 * Cầu nối giữa hai tiến trình.
 *
 * `web` (học sinh làm bài) và `admin` (cô xem) là hai Web Service Render riêng
 * biệt — hai tiến trình Node, hai máy khác nhau. Sự kiện phát ra ở tiến trình
 * này thì tiến trình kia không nghe thấy, nên chỉ cắm Socket.IO vào là chưa đủ.
 *
 * Đường đi đầy đủ:
 *
 *   học sinh --POST nhịp--> web --UPSERT + pg_notify--> Postgres
 *                                                          |
 *                                                       NOTIFY
 *                                                          v
 *   cô <--WebSocket-- admin (file này, đang LISTEN) <-------┘
 *
 * BA ĐIỀU PHẢI NHỚ:
 *
 * 1. `LISTEN` cần một kết nối GIỮ SUỐT, không dùng chung với pool được — pool
 *    trả kết nối về sau mỗi câu lệnh, mà `LISTEN` sống theo phiên. Vì thế ở
 *    đây là `pg.Client` riêng, không phải `pool` dùng chung.
 *
 * 2. Nếu sau này ai đó đặt PgBouncer ở chế độ transaction trước Postgres,
 *    `LISTEN` sẽ chết mà KHÔNG báo lỗi gì: kết nối bị trả về giữa chừng nên
 *    không còn phiên nào để nghe. Realtime im lặng ngừng chạy. Đây là cái bẫy
 *    khó chịu nhất của phương án này.
 *
 * 3. `NOTIFY` là bắn rồi quên. Tiến trình này đang khởi động lại đúng lúc có
 *    tin thì tin đó mất luôn. Chịu được là vì sự thật nằm trong DB chứ không
 *    nằm trong socket — bảng lớp đọc thẳng DB lúc mở trang, socket chỉ chở
 *    thông báo. Đừng bao giờ đảo ngược quan hệ đó.
 *
 * Viết bằng JS thuần vì `server.js` chạy thẳng bằng `node`, không qua trình
 * biên dịch của Next.
 */

const KENH_NHIP = "nhip_lam_bai";

/** Nối lại sau bao lâu khi kết nối `LISTEN` đứt. Tăng dần, tối đa 30 giây. */
const CHO_TOI_THIEU = 1000;
const CHO_TOI_DA = 30000;

/*
  Nhịp tim: cứ 30 giây hỏi Postgres một câu vô nghĩa để BIẾT kết nối còn sống.

  Đây không phải phòng xa — đã đo được thật. Kết nối `LISTEN` có thể chết âm
  thầm: tường lửa hoặc RDS bỏ rơi một kết nối ngồi im quá lâu mà không gửi gói
  đóng nào, nên `pg` không nhận được sự kiện 'error' hay 'end'. Log vẫn nói
  "đang nghe", không có lỗi nào, và nhịp thì không bao giờ tới nữa.

  Đây là kiểu hỏng tệ nhất có thể có ở tính năng này: cô mở bảng lớp, thấy chữ
  "Đang nhận trực tiếp" màu xanh, và bảng trống — rồi kết luận là chưa em nào
  vào làm bài. Không có gì trên màn hình nói rằng đường truyền đã đứt.

  Một câu `SELECT 1` mỗi 30 giây vừa giữ kết nối khỏi bị bỏ rơi, vừa biến cái
  chết âm thầm thành một lỗi nghe được — và chỗ bắt lỗi bên dưới sẽ nối lại.
*/
const NHIP_TIM_MS = 30_000;

/**
 * @param onNhip     gọi mỗi khi có nhịp
 * @param onTrangThai gọi khi cầu nối sống/chết đổi trạng thái — để màn hình của
 *                    cô nói đúng sự thật thay vì cứ hiện "Đang nhận trực tiếp"
 */
export function moCauNoi(onNhip, onTrangThai = () => {}) {
  let client = null;
  let cho = CHO_TOI_THIEU;
  let daDong = false;
  let nhipTim = null;

  async function noi() {
    if (daDong) return;

    client = new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false },
      // Bật keepalive ở tầng TCP: kết nối này ngồi im hàng phút giữa hai buổi
      // học, đúng kiểu bị tường lửa dọn dẹp.
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });

    // Kết nối này đứt là realtime chết, nên phải tự nối lại. Không có nó thì
    // một lần RDS chớp mạng là bảng lớp đứng im cho tới lần deploy sau, mà
    // không có gì trên màn hình nói rằng nó đã đứng.
    client.on("error", (err) => {
      console.error("[live] kết nối LISTEN lỗi:", err.message);
      thuLaiSau();
    });
    client.on("end", () => {
      if (!daDong) thuLaiSau();
    });

    try {
      await client.connect();
      await client.query(`LISTEN ${KENH_NHIP}`);
      cho = CHO_TOI_THIEU;
      console.log(`[live] đang nghe kênh "${KENH_NHIP}"`);
      onTrangThai(true);

      // Nhịp tim — xem ghi chú ở đầu file về cái chết âm thầm.
      clearInterval(nhipTim);
      nhipTim = setInterval(() => {
        const cua_toi = client;
        cua_toi?.query("SELECT 1").catch((err) => {
          // Chỉ xử lý nếu vẫn đang là kết nối hiện tại, kẻo một nhịp tim muộn
          // của kết nối cũ lại đá đổ kết nối mới vừa dựng xong.
          if (cua_toi !== client) return;
          console.error("[live] nhịp tim hỏng — kết nối LISTEN đã chết:", err.message);
          thuLaiSau();
        });
      }, NHIP_TIM_MS);
      nhipTim.unref?.();
    } catch (err) {
      console.error("[live] không nối được để LISTEN:", err.message);
      thuLaiSau();
      return;
    }

    client.on("notification", (msg) => {
      if (msg.channel !== KENH_NHIP || !msg.payload) return;
      try {
        onNhip(JSON.parse(msg.payload));
      } catch (err) {
        // Gói tin hỏng thì bỏ qua đúng gói đó. Ném ra ở đây là giết cả cầu nối
        // vì một tin lỗi.
        console.error("[live] gói tin không đọc được:", err.message);
      }
    });
  }

  function thuLaiSau() {
    if (daDong) return;
    onTrangThai(false);
    clearInterval(nhipTim);
    nhipTim = null;
    const client_cu = client;
    client = null;
    if (client_cu) client_cu.end().catch(() => {});

    setTimeout(noi, cho);
    console.warn(`[live] thử nối lại sau ${cho}ms`);
    cho = Math.min(cho * 2, CHO_TOI_DA);
  }

  noi();

  return {
    dong() {
      daDong = true;
      clearInterval(nhipTim);
      if (client) client.end().catch(() => {});
    },
  };
}
