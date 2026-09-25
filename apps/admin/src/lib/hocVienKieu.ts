/**
 * Kiểu dữ liệu và nhãn của phần Quản lý lớp. KHÔNG import `pool` ở đây.
 *
 * Vì sao tách khỏi `hocVien.ts`: file đó mở kết nối Postgres, nên một
 * component client lỡ import nó là Turbopack kéo cả driver `pg` vào bundle
 * trình duyệt rồi đổ build với "Can't resolve 'dns'". Đã sập đúng như vậy một
 * lần — `BangLopHoc.tsx` chỉ cần mấy nhãn tiếng Việt mà kéo theo cả driver.
 *
 * Luật: thứ gì client cần thì để ở đây; `hocVien.ts` chỉ giữ truy vấn.
 */

export type ChuKy = "thang" | "khoa" | "buoi";
export type HinhThuc = "tien_mat" | "chuyen_khoan" | "khac";

export const NHAN_CHU_KY: Record<ChuKy, string> = {
  thang: "Theo tháng",
  khoa: "Trọn khoá",
  buoi: "Theo buổi",
};

export const NHAN_HINH_THUC: Record<HinhThuc, string> = {
  tien_mat: "Tiền mặt",
  chuyen_khoan: "Chuyển khoản",
  khac: "Khác",
};

export interface Lop {
  id: string;
  name: string;
  note: string;
  tuitionAmount: number | null;
  tuitionCycle: ChuKy;
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
  siSo: number;
}

export interface HocVienTrongLop {
  studentId: string;
  ten: string;
  email: string | null;
  phone: string | null;
  joinedOn: string;
  leftOn: string | null;
  /** Mức riêng của em này; `null` = theo mức của lớp. */
  tuitionOverride: number | null;
  /** Mức thực tế phải đóng = override, hoặc mức lớp. */
  hocPhi: number | null;
  note: string;
  /** Tổng đã đóng từ trước tới nay, trong lớp này. */
  daDong: number;
  /** Đã đóng kỳ đang xét chưa. `null` khi lớp không thu theo kỳ. */
  daDongKyNay: boolean | null;
  soNhanXet: number;
  /** Lượt luyện đề đã nộp — để cô biết em ấy có học thật không. */
  soLuotLam: number;
  lanLamCuoi: string | null;
}

export interface LanDong {
  id: string;
  studentId: string;
  ten: string;
  amount: number;
  paidOn: string;
  period: string | null;
  method: HinhThuc;
  note: string;
}

export interface NhanXet {
  id: string;
  studentId: string;
  ten: string;
  classId: string | null;
  tenLop: string | null;
  body: string;
  sharedWithStudent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TomTatTien {
  thuKyNay: number;
  thuTatCa: number;
  soChuaDong: number;
  soDangHoc: number;
}

/** Kỳ hiện tại dạng 'YYYY-MM' — dùng chung cho cả truy vấn lẫn form nhập. */
export function kyHienTai(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
