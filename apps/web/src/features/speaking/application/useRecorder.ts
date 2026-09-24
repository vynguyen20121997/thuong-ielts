"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  Bọc MediaRecorder. Chỉ lo thu âm và đếm giây; không biết gì về câu hỏi hay
  chấm điểm.

  Vì sao tự dừng ở `maxSeconds`: giám khảo thật ngắt ở 2 phút. Để học sinh nói
  quá rồi mới báo là luyện sai nhịp ngay từ lúc luyện.

  `revoke` URL cũ mỗi lần thu lại — blob URL không tự giải phóng, thu lại vài
  lần trên điện thoại là đầy bộ nhớ.
*/

export type RecorderStatus =
  "idle" | "asking" | "recording" | "done" | "denied" | "unsupported";

export function useRecorder(maxSeconds: number) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number>(0);
  const startedAt = useRef(0);
  const analyser = useRef<{ ctx: AudioContext; raf: number } | null>(null);

  const stopMeter = () => {
    if (!analyser.current) return;
    cancelAnimationFrame(analyser.current.raf);
    void analyser.current.ctx.close();
    analyser.current = null;
    setLevel(0);
  };

  const stop = useCallback(() => {
    const r = recorder.current;
    if (r && r.state !== "inactive") r.stop();
    window.clearInterval(timer.current);
    stopMeter();
  }, []);

  const start = useCallback(async () => {
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setStatus("unsupported");
      return;
    }
    setStatus("asking");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("denied");
      return;
    }

    if (url) URL.revokeObjectURL(url);
    setBlob(null);
    setUrl(null);
    chunks.current = [];

    const r = new MediaRecorder(stream);
    recorder.current = r;
    r.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data);
    };
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const out = new Blob(chunks.current, {
        type: r.mimeType || "audio/webm",
      });
      setBlob(out);
      setUrl(URL.createObjectURL(out));
      setStatus("done");
    };

    /* Đồng hồ mức âm: chỉ để học sinh thấy mic đang nhận tiếng, không lưu. */
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      src.connect(node);
      const data = new Uint8Array(node.frequencyBinCount);
      const tick = () => {
        node.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += Math.abs(v - 128);
        setLevel(Math.min(1, sum / data.length / 40));
        if (analyser.current)
          analyser.current.raf = requestAnimationFrame(tick);
      };
      analyser.current = { ctx, raf: requestAnimationFrame(tick) };
    } catch {
      /* Không có đồng hồ mức âm cũng không sao. */
    }

    r.start();
    startedAt.current = performance.now();
    setSeconds(0);
    setStatus("recording");
    timer.current = window.setInterval(() => {
      const s = (performance.now() - startedAt.current) / 1000;
      setSeconds(s);
      if (s >= maxSeconds) stop();
    }, 200);
  }, [maxSeconds, stop, url]);

  const reset = useCallback(() => {
    stop();
    if (url) URL.revokeObjectURL(url);
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setStatus("idle");
  }, [stop, url]);

  useEffect(
    () => () => {
      stop();
      if (url) URL.revokeObjectURL(url);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { status, seconds, blob, url, level, start, stop, reset };
}
