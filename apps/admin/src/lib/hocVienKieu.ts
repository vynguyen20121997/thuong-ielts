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
  /** Có dòng em ấy khai "đã chuyển" mà cô chưa xác nhận. */
  choXacNhan: boolean;
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
  /** Tiền chỉ vào sổ khi cô xác nhận. Xem ghi chú ở class-schema.sql. */
  status: "cho_xac_nhan" | "da_xac_nhan";
  declaredBy: "giao_vien" | "hoc_vien";
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
  soChoXacNhan: number;
}

/** Kỳ hiện tại dạng 'YYYY-MM' — dùng chung cho cả truy vấn lẫn form nhập. */
export function kyHienTai(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Tài khoản nhận học phí, cô tự nhập. */
export interface TaiKhoanNhan {
  bankBin: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
}

/*
  Danh sách ngân hàng, chỉ để cô CHỌN thay vì tra mã 6 số.

  Chép từ `apps/web/.../domain/vietqr.ts` — bên đó mới là bản dựng mã QR. Hai
  app không import chéo nhau được, và dựng cả một package cho hai mươi dòng thì
  quá tay. Lệch nhau cũng không hỏng gì: thứ lưu xuống DB là mã BIN, còn bộ
  dựng QR chỉ cần mã đó chứ không tra lại danh sách này.
*/
export const NGAN_HANG: { bin: string; ten: string; tat: string }[] = [
  { bin: "970436", ten: "Vietcombank", tat: "VCB" },
  { bin: "970418", ten: "BIDV", tat: "BIDV" },
  { bin: "970405", ten: "Agribank", tat: "AGR" },
  { bin: "970415", ten: "VietinBank", tat: "CTG" },
  { bin: "970407", ten: "Techcombank", tat: "TCB" },
  { bin: "970422", ten: "MB Bank", tat: "MB" },
  { bin: "970416", ten: "ACB", tat: "ACB" },
  { bin: "970432", ten: "VPBank", tat: "VPB" },
  { bin: "970423", ten: "TPBank", tat: "TPB" },
  { bin: "970403", ten: "Sacombank", tat: "STB" },
  { bin: "970441", ten: "VIB", tat: "VIB" },
  { bin: "970443", ten: "SHB", tat: "SHB" },
  { bin: "970426", ten: "MSB", tat: "MSB" },
  { bin: "970448", ten: "OCB", tat: "OCB" },
  { bin: "970429", ten: "SCB", tat: "SCB" },
  { bin: "970454", ten: "VietCapital Bank", tat: "BVB" },
  { bin: "970400", ten: "SaigonBank", tat: "SGICB" },
  { bin: "970431", ten: "Eximbank", tat: "EIB" },
  { bin: "970437", ten: "HDBank", tat: "HDB" },
  { bin: "970438", ten: "BaoViet Bank", tat: "BVB" },
];
