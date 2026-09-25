/**
 * Định dạng tiền, dùng chung cho cả server lẫn client.
 *
 * Tách khỏi `hocVien.ts` vì file đó import `pool` — kéo nó vào một component
 * client là kéo cả driver Postgres vào bundle trình duyệt.
 *
 * Dấu phân cách theo tiếng Việt (1.500.000). Không ghi "₫" dính liền số: cô
 * đọc bảng nhanh hơn khi mọi con số thẳng cột, còn đơn vị nói một lần ở tiêu
 * đề cột là đủ.
 */
const DINH_DANG = new Intl.NumberFormat("vi-VN");

export function dinhDangTien(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return DINH_DANG.format(v);
}

/** Nhãn kỳ thu: '2026-09' -> 'Tháng 9/2026'. */
export function nhanKy(ky: string | null): string {
  if (!ky) return "Trọn khoá";
  const [nam, thang] = ky.split("-");
  return `Tháng ${Number(thang)}/${nam}`;
}
