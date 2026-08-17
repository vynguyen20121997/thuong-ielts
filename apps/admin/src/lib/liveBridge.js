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

export function moCauNoi(onNhip) {
  let client = null;
  let cho = CHO_TOI_THIEU;
  let daDong = false;

  async function noi() {
    if (daDong) return;

    client = new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: { rejectUnauthorized: false },
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
      if (client) client.end().catch(() => {});
    },
  };
}
