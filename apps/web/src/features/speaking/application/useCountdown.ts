"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  Đếm ngược theo mốc thời gian thật (`deadline`), không trừ dần một biến —
  tab bị trình duyệt hãm nhịp thì đồng hồ vẫn đúng khi quay lại.
*/
export function useCountdown(totalSeconds: number, onDone?: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;

  const start = useCallback(() => {
    deadline.current = performance.now() + totalSeconds * 1000;
    setRemaining(totalSeconds);
    setRunning(true);
  }, [totalSeconds]);

  const skip = useCallback(() => {
    setRunning(false);
    setRemaining(0);
    done.current?.();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, (deadline.current - performance.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(id);
        setRunning(false);
        done.current?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  return { remaining, running, start, skip };
}
