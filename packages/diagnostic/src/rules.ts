/*
  Phiên bản của BỘ QUY TẮC NHẬN XÉT — khác với `exam.version` (phiên bản đề).

  Đề và đáp án của mỗi lượt đã được chụp lại nguyên vẹn vào cột `exam`, nên sửa
  đề không làm đổi kết quả cũ. Nhưng các ngưỡng suy ra nhận xét lại nằm trong
  code: `NEED`/`BASE_MONTHS` của lộ trình, mốc 60% của điểm mạnh — sửa code là
  báo cáo cũ nói khác đi mà không ai biết.

  Vì vậy mỗi lượt lưu lại phiên bản quy tắc đã dùng lúc chấm. Đọc lại một lượt
  cũ bằng bộ quy tắc mới thì trang nói rõ điều đó thay vì im lặng.

  ĐỔI SỐ NÀO TRONG `roadmap.ts` / `verdict.ts` THÌ TĂNG CHUỖI NÀY. Hai file đó
  giờ nằm ngay cạnh file này trong cùng package — trước kia chúng ở `apps/web`
  còn con số này ở đây, nên lời dặn trỏ sang một thư mục khác và rất dễ trôi.
*/
export const RULES_VERSION = "2026-09-22-v1";
