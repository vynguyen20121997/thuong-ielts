/*
  Đo bản ghi lời nói. Thuần — không React, không fetch.

  Ba con số ở đây là thứ ĐẾM ĐƯỢC từ chữ, không phải thứ đoán ra: số từ, tốc
  độ nói, và số tiếng ngập ngừng. Chúng đi kèm bản ghi khi gửi cho bộ chấm,
  vì một bản ghi chữ trơ trọi thì mất hẳn chiều thời gian — model không phân
  biệt nổi 60 từ nói trong 20 giây với 60 từ nói trong 2 phút, mà đó đúng là
  thứ tiêu chí Trôi chảy đo.
*/

/*
  Chỉ những tiếng ngập ngừng KHÔNG mang nghĩa. Cố ý không có "like", "you
  know", "actually" — chúng vừa là từ đệm vừa là từ thật, đếm cả vào thì một
  câu dùng "like" đúng nghĩa cũng bị tính là ngập ngừng.
*/
const FILLERS = ["um", "uh", "erm", "er", "ah", "hmm", "mmm", "uhm"];

export function countSpokenWords(transcript: string): number {
  const words = transcript.trim().match(/[\p{L}\p{N}'’-]+/gu);
  return words ? words.length : 0;
}

export function countFillers(transcript: string): number {
  const words = transcript.toLowerCase().match(/[\p{L}'’-]+/gu) ?? [];
  return words.filter((w) => FILLERS.includes(w)).length;
}

/**
 * Từ mỗi phút. Người bản ngữ nói quanh 140–160; dưới 100 thường là còn phải
 * nghĩ nhiều, trên 190 là nói vội tới mức khó nghe.
 */
export function wordsPerMinute(words: number, seconds: number): number {
  if (seconds < 1) return 0;
  return Math.round((words / seconds) * 60);
}

export type SpeechStats = {
  words: number;
  fillers: number;
  wpm: number;
  seconds: number;
};

export function speechStats(
  transcript: string,
  seconds: number,
): SpeechStats {
  const words = countSpokenWords(transcript);
  return {
    words,
    fillers: countFillers(transcript),
    wpm: wordsPerMinute(words, seconds),
    seconds: Math.round(seconds),
  };
}

/*
  Dưới mức này thì không gọi dịch vụ chấm. Hai mươi lăm từ chưa đủ cho bất kỳ
  tiêu chí nào — chấm ra một con số từ đó là con số giả, và vẫn tốn tiền.
*/
export const MIN_WORDS_TO_GRADE = 25;
