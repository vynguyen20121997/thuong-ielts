"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  Nhận dạng lời nói ngay trên trình duyệt (Web Speech API), để học sinh thấy
  chữ hiện ra trong lúc đang nói.

  ## Vì sao chạy ở trình duyệt chứ không gửi audio lên server

  Chữ phải hiện RA NGAY thì mới có tác dụng — nói sai một câu là thấy liền.
  Gửi file lên server rồi chờ nhận dạng thì sớm nhất cũng vài giây sau khi nói
  xong, lúc đó học sinh đã quên mình vừa nói gì. Đổi lại, bản ghi này là của
  trình duyệt: Chrome và Edge có, Safari mới có, Firefox thì không — nên giao
  diện phải nói thẳng khi máy không hỗ trợ chứ không được im lặng.

  ## Ba cái bẫy của API này

  1. Chrome TỰ NGẮT sau vài giây im lặng (`onend` nổ dù chưa ai bấm dừng). Ai
     nghĩ một lúc giữa câu là mất phần còn lại. Nên có `wanted` (ref): còn
     muốn nghe thì tự bật lại.
  2. Mỗi lần bật lại, `resultIndex` đếm từ 0. Cộng dồn phần đã chốt vào một
     ref riêng, nếu không bật lại lần hai là mất sạch câu đầu.
  3. `onend` cũng nổ khi người dùng bấm dừng. Phân biệt bằng chính `wanted`,
     chứ dựa vào state thì cú bấm dừng và lần `onend` ngay sau đó đọc phải
     giá trị cũ.
*/

export type SpeechStatus =
  | "idle"
  | "listening"
  | "stopped"
  | "denied"
  | "unsupported"
  | "error";

type SpeechResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: { length: number } & Record<number, SpeechResultLike>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function createRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => RecognitionLike })
      .SpeechRecognition ??
    (
      window as unknown as {
        webkitSpeechRecognition?: new () => RecognitionLike;
      }
    ).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function speechToTextSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window
  );
}

export function useSpeechToText(lang = "en-US") {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const recognition = useRef<RecognitionLike | null>(null);
  const wanted = useRef(false);
  const finalRef = useRef("");

  const stop = useCallback(() => {
    wanted.current = false;
    setInterimText("");
    const r = recognition.current;
    if (r) {
      r.onend = null;
      try {
        r.stop();
      } catch {
        /* Đã dừng sẵn rồi thì thôi. */
      }
    }
    recognition.current = null;
    setStatus((s) => (s === "listening" ? "stopped" : s));
  }, []);

  const start = useCallback(() => {
    if (wanted.current) return;
    const r = createRecognition();
    if (!r) {
      setStatus("unsupported");
      return;
    }

    finalRef.current = "";
    setFinalText("");
    setInterimText("");
    wanted.current = true;
    recognition.current = r;

    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const item = e.results[i];
        const text = item[0]?.transcript ?? "";
        if (item.isFinal) {
          finalRef.current = `${finalRef.current} ${text}`.trim();
        } else {
          interim += text;
        }
      }
      setFinalText(finalRef.current);
      setInterimText(interim.trim());
    };

    r.onerror = (e) => {
      /*
        `no-speech` và `aborted` không phải hỏng: im lặng một lúc, hoặc chính
        mình vừa gọi stop. Báo lỗi ở hai trường hợp đó là doạ học sinh vì một
        chuyện bình thường.
      */
      if (e.error === "no-speech" || e.error === "aborted") return;
      wanted.current = false;
      setStatus(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "denied"
          : "error",
      );
    };

    r.onend = () => {
      if (!wanted.current) return;
      try {
        r.start();
      } catch {
        /* Bật lại quá nhanh thì lần sau `onend` gọi lại. */
      }
    };

    try {
      r.start();
      setStatus("listening");
    } catch {
      wanted.current = false;
      setStatus("error");
    }
  }, [lang]);

  const reset = useCallback(() => {
    stop();
    finalRef.current = "";
    setFinalText("");
    setInterimText("");
    setStatus("idle");
  }, [stop]);

  /*
    Biết trước là máy không nghe được thì nói ngay, đừng đợi học sinh bấm rồi
    mới báo. Kiểm tra trong `useEffect` chứ không trong lúc vẽ: `window` không
    tồn tại ở server, và đọc nó lúc vẽ làm HTML hai bên lệch nhau.
  */
  useEffect(() => {
    if (!speechToTextSupported()) setStatus("unsupported");
  }, []);

  useEffect(() => () => stop(), [stop]);

  /* Chữ đang nghe được = phần đã chốt + phần máy còn đang đoán. */
  const transcript = `${finalText} ${interimText}`.trim();

  return { status, finalText, interimText, transcript, start, stop, reset };
}
