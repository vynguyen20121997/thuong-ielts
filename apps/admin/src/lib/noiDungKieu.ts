/**
 * Kiểu dữ liệu của phần soạn nội dung. KHÔNG import `pool` ở đây.
 *
 * Cùng luật với `hocVienKieu.ts`: component client lỡ import file có `pool` là
 * Turbopack kéo cả driver Postgres vào bundle trình duyệt và build đổ với
 * "Can't resolve 'dns'". `tsc` không bắt được, chỉ `npm run build` mới thấy.
 */

/* ── Từ vựng ─────────────────────────────────────────────────────────────── */

export interface BoThe {
  id: string;
  name: string;
  description: string;
  topic: string;
  /** 'official' = bộ của cô. 'personal' = học sinh tự tạo, cô KHÔNG sửa. */
  type: "official" | "personal";
  creatorId: string;
  soThe: number;
  /** Thẻ chưa có nghĩa tiếng Việt — chúng đứng ngoài lịch ôn. */
  soTheThieuNghia: number;
  /** Bao nhiêu học viên đang ôn bộ này. */
  soNguoiHoc: number;
  /**
   * Đã giao cho cả lớp chưa.
   *
   * Bộ CHƯA giao thì học viên không thấy một thẻ nào — `ensureReviews` bên web
   * chỉ lấy thẻ từ bộ đã giao, hoặc bộ chính em ấy tự tạo. Soạn xong mà quên
   * giao là soạn cho không ai đọc.
   */
  giaoCaLop: boolean;
}

export interface The {
  id: string;
  deckId: string;
  word: string;
  ipa: string;
  vietnamese: string;
  examples: string[];
  position: number;
  /** Đã có học viên ôn thẻ này chưa — xoá là xoá cả lịch ôn của họ. */
  daCoNguoiOn: boolean;
}

/* ── Đề Writing ──────────────────────────────────────────────────────────── */

export interface DeWriting {
  id: string;
  task: number;
  topic: string;
  title: string;
  prompt: string;
  published: boolean;
  position: number;
  soYTuong: number;
  soKienThuc: number;
}

export interface YTuong {
  id: string;
  promptId: string;
  /** 'pos' = ủng hộ, 'neg' = phản đối. */
  side: "pos" | "neg";
  label: string;
  starter: string;
  frameExplain: string;
  frameExample: string;
  probe: string;
  questions: string[];
  position: number;
}

export interface KienThuc {
  id: string;
  promptId: string;
  topic: string;
  summary: string;
  body: string;
  position: number;
}

export const NHAN_PHIA: Record<"pos" | "neg", string> = {
  pos: "Ủng hộ",
  neg: "Phản đối",
};
