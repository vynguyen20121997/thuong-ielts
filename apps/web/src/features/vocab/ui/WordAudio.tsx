"use client";

import { useRef, useState } from "react";
import { Volume2 } from "lucide-react";

/*
  Nút phát âm một từ.

  Hai đường, đúng như bản gốc: file thu sẵn nếu thẻ có `audioUrl`, còn không
  thì nhờ giọng đọc của trình duyệt (`speechSynthesis`).

  Bản gốc còn một đường thứ ba — gọi `dict.youdao.com/dictvoice` — đã BỎ. Đó
  là dịch vụ của bên thứ ba không cam kết gì; đưa lên production là gửi từ của
  học sinh sang một máy chủ lạ mỗi lần bấm, và ngày nó đổi đường dẫn thì cả
  trang im tiếng mà không ai biết vì sao.
*/
export default function WordAudio({
  word,
  audioUrl,
}: {
  word: string;
  audioUrl?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (playing) return;
    setPlaying(true);
    const done = () => setPlaying(false);

    if (audioUrl) {
      audio.current?.pause();
      const el = new Audio(audioUrl);
      audio.current = el;
      el.onended = done;
      el.onerror = done;
      void el.play().catch(done);
      return;
    }

    if (typeof speechSynthesis === "undefined") {
      done();
      return;
    }
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-GB";
    utter.rate = 0.9;
    utter.onend = done;
    utter.onerror = done;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Nghe phát âm ${word}`}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
        playing
          ? "border-brand bg-brand text-white"
          : "border-sage-3 bg-mist-3 text-brand hover:border-brand/40"
      }`}
    >
      <Volume2 size={18} />
    </button>
  );
}
