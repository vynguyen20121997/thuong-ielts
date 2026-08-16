import { pool } from "./index";

/**
 * Hợp đồng giữa hai tiến trình.
 *
 * `web` (học sinh làm bài) và `admin` (cô xem) là hai Web Service riêng trên
 * Render — hai tiến trình Node, hai máy khác nhau, không chia sẻ bộ nhớ. Sự
 * kiện phát ra ở bên này thì bên kia không nghe thấy, nên chỉ cắm Socket.IO vào
 * là chưa đủ: phải có một cầu nối đi qua ranh giới tiến trình.
 *
 * Cầu nối đó là `LISTEN/NOTIFY` của chính Postgres — không thêm dịch vụ nào,
 * không thêm hoá đơn, dùng lại đúng kết nối đã có.
 *
 * File này sống ở `packages/db` vì cả hai bên đều phải đọc: tên kênh và hình
 * dạng gói tin mà lệch nhau thì realtime im lặng chết, không báo lỗi gì.
 */

/** Tên kênh `LISTEN`/`NOTIFY`. Đổi ở đây là đổi cho cả hai bên. */
export const KENH_NHIP = "nhip_lam_bai";

/**
 * Gói tin gửi kèm `NOTIFY`.
 *
 * Tên trường viết tắt có chủ đích: `NOTIFY` giới hạn 8000 byte cho mỗi gói.
 * Gói này chừng 300–400 byte nên còn rất xa ngưỡng, nhưng `marks` dài theo số
 * câu nên cứ giữ thói quen tiết kiệm ngay từ đầu.
 *
 * KHÔNG mang theo nội dung học sinh gõ và KHÔNG mang theo đáp án. Bảng lớp chỉ
 * cần con số và đúng/sai; muốn xem chi tiết thì cô bấm vào một em, lúc đó mới
 * đọc thẳng DB qua đường riêng của trang quản trị.
 */
export interface GoiNhip {
  /** Loại sự kiện: bắt đầu làm, đang làm, đã nộp. */
  loai: "vao" | "nhip" | "nop";
  /** id lượt làm. */
  a: string;
  /** Đề đang làm — dùng làm tên phòng socket. */
  target: string;
  /** Tên hiển thị của học sinh. */
  ten: string;
  /** Có phải khách vãng lai không. */
  khach: boolean;
  /** Số câu đã trả lời. */
  d: number;
  /** Số câu đúng tính tới lúc này. */
  c: number;
  /** Tổng số câu của đề. */
  t: number;
  /** null = chưa làm, true/false = đã chấm. Dài đúng bằng `t`. */
  marks: (boolean | null)[];
  /** Giây còn lại, tính từ `expires_at` do server giữ. */
  conLai: number;
  /** Band, chỉ có khi đã nộp. */
  band?: number | null;
}

/**
 * Bắn một nhịp cho trang quản trị.
 *
 * Cố ý nuốt lỗi: nhịp là thứ trang trí cho màn hình của cô, còn bài thi của
 * học sinh thì không được hỏng vì nó. Sự thật đã nằm trong DB rồi — cô mở lại
 * trang là thấy đúng, kể cả khi mọi nhịp trên đường đều rơi mất.
 */
export async function banNhip(goi: GoiNhip): Promise<void> {
  try {
    await pool.query(`SELECT pg_notify($1, $2)`, [KENH_NHIP, JSON.stringify(goi)]);
  } catch (err) {
    console.error("banNhip thất bại (bỏ qua):", err);
  }
}
