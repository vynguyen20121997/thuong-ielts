import type { ReadingResult } from "./types";

/**
 * Cắt bớt kết quả trước khi trả về cho học sinh.
 *
 * CẮT Ở SERVER, KHÔNG PHẢI GIẤU Ở GIAO DIỆN. Nếu chỉ ẩn bằng CSS hay bằng
 * điều kiện render, đáp án vẫn nằm trong phản hồi mạng — mở tab Network là
 * thấy, và một em biết mẹo là cả lớp có đáp án trong hai phút. Đúng cái tình
 * huống mà cô muốn tránh khi bật "chờ cô mở".
 *
 * Hàm thuần, nằm ở `domain/` — không đọc DB, không biết Next, nên thử được
 * bằng mắt và dùng lại được ở cả ba route nộp bài.
 */
export function cheKetQua(
  result: ReadingResult,
  duocXem: { diem: boolean; dapAn: boolean }
): ReadingResult {
  if (duocXem.diem && duocXem.dapAn) return result;


  const items = result.items.map((item) => ({
    ...item,
    // Giấu đáp án: bỏ hẳn `expected` và lời giải thích khỏi gói tin.
    ...(duocXem.dapAn ? {} : { expected: "", explanation: undefined }),
    // Giấu điểm: `isCorrect` cũng phải đi, vì biết đúng/sai từng câu là suy
    // ngược ra được điểm, và với câu trắc nghiệm thì gần như ra cả đáp án.
    ...(duocXem.diem ? {} : { isCorrect: false }),
  }));

  return {
    ...result,
    // Nói cho giao diện biết đây là bản đã cắt, kẻo học sinh nhìn "0/40" rồi
    // tưởng mình sai hết bài.
    daChe: { diem: !duocXem.diem, dapAn: !duocXem.dapAn },
    correct: duocXem.diem ? result.correct : 0,
    accuracy: duocXem.diem ? result.accuracy : 0,
    band: duocXem.diem ? result.band : 0,
    items,
  };
}
