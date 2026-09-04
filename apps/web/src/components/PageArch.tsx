/**
 * Vòm xanh mờ ở đầu trang — chữ ký thị giác chung của mọi trang con.
 *
 * Tách ra từ `StudentPageHeader` để cả site dùng chung một công thức màu; muốn
 * đổi tông thì sửa đúng một chỗ, đúng như luật token màu trong `globals.css`.
 *
 * Vòm rộng 160% màn hình nên phải cắt, nếu không trang bị cuộn ngang. Lớp cắt
 * là một `div` riêng bọc ngoài chứ **không** đặt `overflow-hidden` lên `<main>`:
 * `overflow-hidden` ở tổ tiên sẽ giết `position: sticky` của mọi phần tử con.
 *
 * Cách dùng: `<main className="relative …">` → `<PageArch />` là con đầu tiên,
 * rồi phần nội dung bọc trong một thẻ có `relative z-10` để chữ nằm trên vòm.
 */
export default function PageArch({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] overflow-hidden ${className}`}
    >
      <div className="absolute -top-24 left-1/2 h-[560px] w-[160%] -translate-x-1/2 rounded-b-[50%] bg-gradient-to-b from-leaf/30 via-leaf/10 to-transparent" />
    </div>
  );
}
