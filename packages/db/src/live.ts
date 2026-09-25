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
/**
 * Mã lớp: gom mọi em đang làm CÙNG MỘT ĐỀ vào một chỗ.
 *
 * Reading lưu mỗi passage một dòng, nên `target` có hai dạng — `cam12-test3`
 * khi thi cả bài, và `cam12-test3-flying-tortoises` khi làm một passage lẻ.
 * Lấy thẳng `target` làm tên phòng thì một lớp đang học Cam 12 Test 3 bị xé
 * thành bốn phòng, và cô phải mở bốn tab mới thấy hết lớp mình.
 *
 * Listening lưu cả bài một dòng (`cam11-listening-test3`) nên giữ nguyên —
 * chữ "listening" chen giữa khiến nó không khớp mẫu dưới đây, đúng như mong muốn.
 *
 * Để ở `packages/db` vì cả hai tiến trình đều phải tính ra CÙNG một mã: `web`
 * dùng nó để gửi, `admin` dùng nó để chia phòng. Lệch nhau là nhịp bay vào
 * phòng không ai ngồi, và im lặng.
 */
export function maLop(target: string): string {
  return maDeTuSlug(target) ?? target;
}

/**
 * Mẫu SQL của `maDeTuSlug`, để dùng trong `substring(... from ...)`.
 *
 * DÙNG `[0-9]` CHỨ KHÔNG `\d`. Đã đo trên chính DB của dự án:
 * `substring('cam10-test1-stepwells' from '^(cam\d+-test\d+)-')` trả về NULL,
 * còn `[0-9]` trả về `cam10-test1`. Sai chỗ này thì mọi slug rơi về nhánh
 * COALESCE, không báo lỗi gì cả — và trang giao bài bên admin đã lặng lẽ tạo
 * ra những bài giao mà học sinh bấm vào chỉ nhận được "Không tìm thấy đề này".
 */
export const MA_DE_SQL = "^((?:cam[0-9]+|guide|train[12])-test[0-9]+)-";

/**
 * Slug của một passage -> mã đề CẢ BÀI, hoặc `null` nếu slug không thuộc bộ đề
 * nào ghép được thành một bài 40 câu.
 *
 * Phải khớp đúng `isTestId` bên `apps/web`: đó là hàm quyết định học sinh có
 * mở được đề hay không. Hai bên lệch nhau thì cô giao được một bài mà học sinh
 * không vào được — không bên nào báo lỗi.
 *
 * Bộ VOL cố ý ĐỨNG NGOÀI: slug của nó là `vol-5-test-2-passage-3`, dấu gạch
 * giữa `test` và số, và phía web chưa nhận dạng đó. Trả `null` để nơi gọi biết
 * mà giao theo từng passage thay vì giao cả bài rồi hỏng.
 */
export function maDeTuSlug(slug: string): string | null {
  return /^((?:cam\d+|guide|train[12])-test\d+)-/.exec(slug)?.[1] ?? null;
}

/**
 * `true` khi chuỗi này LÀ mã đề cả bài (không phải slug của một passage).
 *
 * Bản sao đúng của `isTestId` bên `apps/web` — hàm quyết định học sinh có mở
 * được đề hay không. Ở đây để phía admin hỏi được cùng một câu hỏi trước khi
 * tạo bài giao.
 */
export function laMaDeTest(value: string): boolean {
  return /^(?:cam\d+|guide|train[12])-test\d+$/.test(value);
}

/**
 * Khoá lớp: LỚP LÀ BÀI CÔ GIAO, KHÔNG PHẢI ĐỀ.
 *
 * Ba tình huống thật, và chúng phải nằm ba chỗ khác nhau dù có thể trùng đề:
 *
 *   1. Cô giao cho cả lớp        -> `bg-<id bài giao>`
 *   2. Học sinh tự luyện         -> `tl-<mã đề>`
 *   3. Cô gửi riêng cho một bạn  -> `bg-<id bài giao>` (một bài giao khác)
 *
 * Gom theo ĐỀ như trước là dồn cả ba vào một chỗ: một em ở tỉnh khác tự luyện
 * Cam 12 Test 3 sẽ hiện ngay trong lớp cô đang dạy, và bài cô gửi riêng cho
 * Minh Khôi cũng lẫn vào đó. Cô đọc bảng điểm buổi học thì thấy người lạ.
 *
 * Dùng tiền tố hai chữ thay vì dấu hai chấm để khoá này đi thẳng vào đường dẫn
 * mà không phải mã hoá.
 */
export function khoaLop(assignmentId: string | null | undefined, target: string): string {
  return assignmentId ? `bg-${assignmentId}` : `tl-${maLop(target)}`;
}

/** Đọc ngược `khoaLop`. */
export function docKhoaLop(
  khoa: string
): { loai: "bai-giao"; id: string } | { loai: "tu-luyen"; target: string } | null {
  if (khoa.startsWith("bg-")) return { loai: "bai-giao", id: khoa.slice(3) };
  if (khoa.startsWith("tl-")) return { loai: "tu-luyen", target: khoa.slice(3) };
  return null;
}

export interface GoiNhip {
  /** Loại sự kiện: bắt đầu làm, đang làm, đã nộp. */
  loai: "vao" | "nhip" | "nop";
  /** id lượt làm. */
  a: string;
  /** Đề đang làm. Passage lẻ thì đây là slug của riêng passage đó. */
  target: string;
  /**
   * Tên phòng socket — `khoaLop(assignmentId, target)`.
   *
   * Cùng một BÀI GIAO thì cùng phòng. Không phải cùng đề: hai lớp học cùng đề
   * Cam 12 Test 3 vẫn là hai phòng riêng, và em tự luyện đề đó thì ở phòng
   * thứ ba.
   */
  lop: string;
  /** Nhãn ngắn cho phần đang làm ("Passage 2"), để cô biết em ấy ở đâu. */
  phan?: string | null;
  /**
   * 'test' = thi cả bài, 'paper' = làm một passage lẻ.
   *
   * Cô cần phân biệt: cùng một lớp có thể có em làm 40 câu và em làm 13 câu,
   * và nếu không nói ra thì hai dải ô trông như nhau mà con số thì lệch hẳn.
   */
  pham?: "paper" | "test";
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
