/*
  Dựng mã VietQR theo chuẩn EMVCo mà NAPAS dùng.

  ## Vì sao tự dựng chứ không gọi img.vietqr.io

  Dịch vụ ấy tiện: ghép URL là ra ảnh. Nhưng nó có nghĩa là mỗi lần một học
  sinh mở trang học phí, trình duyệt em ấy gửi SỐ TÀI KHOẢN CỦA CÔ, số tiền và
  nội dung chuyển khoản sang máy chủ của người khác — và làm thế mỗi lần tải
  trang. Chuỗi QR chỉ là mấy trăm ký tự theo một chuẩn công khai, dựng lấy mất
  đúng file này. Đổi lại: không phụ thuộc ai, không rò gì, và mã vẫn hiện ra
  khi dịch vụ kia sập.

  ## Thuần

  Không React, không fetch, không `pg`. Nhờ vậy `check-tuition.ts` kiểm được
  từng trường của chuỗi mà không cần dựng trình duyệt.

  Tham chiếu: EMVCo Merchant Presented QR, và phụ lục VietQR của NAPAS.
*/

/** Một trường TLV: hai số ID, hai số độ dài, rồi nội dung. */
function truong(id: string, giaTri: string): string {
  const doDai = String(giaTri.length).padStart(2, "0");
  return `${id}${doDai}${giaTri}`;
}

/**
 * CRC-16/CCITT-FALSE — đúng biến thể chuẩn EMVCo đòi.
 *
 * Sai một chi tiết ở đây (đa thức, giá trị khởi tạo, hay quên chính bốn ký tự
 * "6304" lúc tính) thì mã vẫn VẼ RA được nhưng mọi app ngân hàng đều báo "mã
 * không hợp lệ" — và không có cách nào biết cho tới khi có người thật quét.
 * Vì thế `check-tuition.ts` so với một chuỗi đã biết trước kết quả.
 */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Bỏ dấu tiếng Việt và viết hoa.
 *
 * Nội dung chuyển khoản đi qua hệ thống ngân hàng, nơi dấu tiếng Việt lúc thì
 * rơi mất lúc thì thành ký tự lạ. Cô dò sao kê bằng mắt, nên một nội dung
 * "HP NGUYEN THU HA T9" đọc được chắc chắn hơn "HP Nguyễn Thu Hà T9" đã bị
 * băm. Đổi luôn ở đây để mã QR và dòng chữ hướng dẫn luôn khớp nhau.
 */
export function khongDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export type ThongTinChuyenKhoan = {
  /** Mã ngân hàng 6 số theo NAPAS, ví dụ 970436 = Vietcombank. */
  bankBin: string;
  /** Số tài khoản nhận. */
  soTaiKhoan: string;
  /** Số tiền, đồng. Bỏ trống thì ra mã tĩnh, người chuyển tự gõ số. */
  soTien?: number | null;
  /** Nội dung chuyển khoản. */
  noiDung?: string;
};

/*
  Trần độ dài nội dung. Chuẩn cho phép 25 ký tự ở trường 08; nhiều ngân hàng
  cắt còn ngắn hơn. Cắt ở đây để phần cô cần nhìn nhất (mã học viên) không bị
  rơi mất ở cuối.
*/
const TOI_DA_NOI_DUNG = 25;

/**
 * Chuỗi để vẽ thành QR.
 *
 * Có số tiền thì mã là "động" (`01` = `12`): app ngân hàng điền sẵn số, em ấy
 * không gõ nhầm được. Không có số tiền thì là mã tĩnh (`11`).
 */
export function chuoiVietQR(tt: ThongTinChuyenKhoan): string {
  if (!/^\d{6}$/.test(tt.bankBin)) {
    throw new Error("Mã ngân hàng phải là 6 chữ số.");
  }
  if (!/^\d{6,19}$/.test(tt.soTaiKhoan)) {
    throw new Error("Số tài khoản không hợp lệ.");
  }

  const coTien = typeof tt.soTien === "number" && tt.soTien > 0;

  const nhaThuHuong =
    truong("00", tt.bankBin) + truong("01", tt.soTaiKhoan);
  const thongTinTaiKhoan =
    truong("00", "A000000727") +
    truong("01", nhaThuHuong) +
    /* QRIBFTTA = chuyển tới TÀI KHOẢN (khác QRIBFTTC là tới thẻ). */
    truong("02", "QRIBFTTA");

  let body =
    truong("00", "01") +
    truong("01", coTien ? "12" : "11") +
    truong("38", thongTinTaiKhoan) +
    truong("53", "704") +
    (coTien ? truong("54", String(Math.round(tt.soTien as number))) : "") +
    truong("58", "VN");

  const noiDung = khongDau(tt.noiDung ?? "").slice(0, TOI_DA_NOI_DUNG);
  if (noiDung) body += truong("62", truong("08", noiDung));

  /*
    CRC tính trên TOÀN BỘ chuỗi KÈM "6304" ở cuối — đây là chỗ hay sai nhất
    của chuẩn này.
  */
  const phanCanTinh = `${body}6304`;
  return phanCanTinh + crc16(phanCanTinh);
}

/**
 * Nội dung chuyển khoản cho một lần đóng học phí.
 *
 * Phải VỪA gợi nhớ cho cô lúc dò sao kê, VỪA khớp lại được về đúng em và đúng
 * kỳ. Dạng: `HP <tên không dấu, cắt ngắn> <kỳ>` — ví dụ "HP THU HA T9".
 *
 * Không nhét id học viên vào: id là chuỗi dài, ăn hết chỗ, và nó chẳng nói gì
 * với cô lúc nhìn sao kê lúc 10 giờ đêm.
 */
export function noiDungChuyenKhoan(tenHocVien: string, ky: string | null): string {
  const ten = khongDau(tenHocVien);
  /* Giữ hai từ cuối của tên: "Nguyễn Thu Hà" -> "THU HA", đủ để phân biệt. */
  const ngan = ten.split(" ").slice(-2).join(" ");
  const duoi = ky ? ` T${Number(ky.split("-")[1])}` : "";
  return `HP ${ngan}${duoi}`.slice(0, TOI_DA_NOI_DUNG).trim();
}

/** Vài ngân hàng hay dùng nhất, để cô chọn thay vì tra mã 6 số. */
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

export function tenNganHang(bin: string | null): string | null {
  if (!bin) return null;
  return NGAN_HANG.find((n) => n.bin === bin)?.ten ?? null;
}
