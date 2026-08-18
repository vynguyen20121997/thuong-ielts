import { bangDiemLop } from "../../../../../lib/lop";
import { teacherHienTai } from "../../../../../lib/phien";

/**
 * Bảng điểm dạng file, để cô giữ lại hoặc gửi phụ huynh.
 *
 * Có BOM ở đầu file. Không có nó thì Excel bản tiếng Việt mở ra thành
 * "Nguyá»…n Thu HÃ " — tên học sinh hỏng hết, và cô sẽ tưởng trang web lưu sai.
 *
 * Dấu phân cách là chấm phẩy chứ không phải dấu phẩy: Excel ở máy dùng định
 * dạng Việt Nam đọc dấu phẩy là dấu thập phân, nên file phẩy sẽ dồn hết vào
 * một cột.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  await teacherHienTai();

  const rows = await bangDiemLop(target);

  const o = (v: string | number | null) => {
    const s = String(v ?? "");
    // Bọc nếu có ký tự phá cấu trúc; nhân đôi dấu nháy bên trong.
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const dong = [
    ["Hạng", "Học viên", "Loại", "Đúng", "Tổng", "Tỉ lệ %", "Band", "Số phút", "Trạng thái", "Nộp lúc"],
    ...rows.map((r, i) => [
      r.trangThai === "submitted" ? i + 1 : "",
      r.ten,
      r.khach ? "Khách" : "Tài khoản",
      r.trangThai === "submitted" ? r.dung : "",
      r.tong,
      r.trangThai === "submitted" ? r.tiLe : "",
      r.band !== null && r.trangThai === "submitted" ? r.band.toFixed(1) : "",
      r.trangThai === "submitted" ? r.phutLam : "",
      r.trangThai === "submitted" ? (r.tuDongNop ? "Hết giờ, nộp tự động" : "Đã nộp") : "Chưa xong",
      r.nopLuc ? new Date(r.nopLuc).toLocaleString("vi-VN") : "",
    ]),
  ];

  const csv = "\uFEFF" + dong.map((d) => d.map(o).join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bang-diem-${target}.csv"`,
      // Bảng điểm đổi mỗi khi có em nộp bài — không được nằm lại trong cache.
      "Cache-Control": "no-store",
    },
  });
}
