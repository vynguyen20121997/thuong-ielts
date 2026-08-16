"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { allQuestionsOf } from "../domain/paper";
import { countAnswered } from "../domain/scoring";
import type { ReadingAnswers, ReadingPaper, ReadingResult } from "../domain/types";
import { submitReadingAttempt } from "../infrastructure/readingApi";

/**
 * Application layer: the whole behaviour of "sitting a reading test" — answers,
 * countdown, submission, result — with no JSX anywhere in the file.
 *
 * The player component renders whatever this returns. That split is what makes
 * the rules testable without a DOM, and lets a future mobile/embedded layout
 * reuse the exact same behaviour by rendering different markup.
 */

export type SessionStatus = "running" | "submitting" | "finished";

/* ------------------------------------------------------------------ *
 * Lưu tạm bài đang làm
 *
 * Trước đây tải lại trang là mất sạch: chạy thử với persona hay bấm lung tung,
 * 4 câu đã điền về 0 và đồng hồ quay lại từ đầu. Listening đã có "làm tiếp"
 * từ trước; đây là mang đúng cơ chế đó sang Reading — cùng cách lưu, cùng chỗ
 * hỏi, để hai bên không thành hai hành vi khác nhau.
 *
 * Dùng `sessionStorage` chứ không phải `localStorage`: bài dở chỉ có nghĩa
 * trong phiên trình duyệt đang mở. Đóng hẳn trình duyệt rồi mở lại tuần sau mà
 * hệ thống bảo "làm tiếp bài còn 3 phút" thì vô nghĩa.
 * ------------------------------------------------------------------ */

export interface SavedReadingProgress {
  answers: ReadingAnswers;
  remainingSeconds: number;
  /** Passage đang mở, để quay lại đúng chỗ chứ không nhảy về passage 1. */
  sectionIndex: number;
}

const storageKey = (id: string) => `reading-progress:${id}`;

export function readReadingProgress(id: string): SavedReadingProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedReadingProgress;
    // Bài đã hết giờ thì không đáng làm tiếp.
    return parsed.remainingSeconds > 5 ? parsed : null;
  } catch {
    return null;
  }
}

export function clearReadingProgress(id: string): void {
  try {
    window.sessionStorage.removeItem(storageKey(id));
  } catch {
    /* chế độ ẩn danh: mất điểm lưu không đáng để làm hỏng bài thi */
  }
}

export interface ReadingSession {
  answers: ReadingAnswers;
  setAnswer: (questionId: string, value: string) => void;
  clearAnswer: (questionId: string) => void;
  status: SessionStatus;
  result: ReadingResult | null;
  error: string | null;
  /** Seconds left on the clock; counts down only while `status === "running"`. */
  remainingSeconds: number;
  elapsedSeconds: number;
  answeredCount: number;
  totalQuestions: number;
  /** True once the clock has run out and the attempt was auto-submitted. */
  timedOut: boolean;
  /** Passage đang mở. Nằm trong phiên chứ không ở component, để lưu tạm được. */
  sectionIndex: number;
  setSectionIndex: (index: number) => void;
  submit: () => void;
  restart: () => void;
}

export function useReadingSession(paper: ReadingPaper, resume = false): ReadingSession {
  // Đọc một lần lúc khởi tạo: nếu học sinh chọn "làm tiếp" thì bài bắt đầu
  // ngay ở trạng thái cũ, không nháy qua trạng thái trống rồi mới nhảy số.
  const [saved] = useState(() => (resume ? readReadingProgress(paper.id) : null));

  const [answers, setAnswers] = useState<ReadingAnswers>(saved?.answers ?? {});
  const [status, setStatus] = useState<SessionStatus>("running");
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    saved?.remainingSeconds ?? paper.durationSeconds
  );
  const [timedOut, setTimedOut] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(saved?.sectionIndex ?? 0);

  // Một phiếu trả lời cho cả bài, kể cả khi bài gồm ba passage: id câu hỏi là
  // duy nhất toàn cục nên gộp lại không đụng nhau.
  const questions = useMemo(() => allQuestionsOf(paper), [paper]);

  // Read inside the interval callback and inside submit() so neither has to be
  // re-created when the answers change — a re-created interval would drift.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;
  const sectionRef = useRef(sectionIndex);
  sectionRef.current = sectionIndex;
  const submittingRef = useRef(false);

  const elapsedSeconds = paper.durationSeconds - remainingSeconds;

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const clearAnswer = useCallback((questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const runSubmit = useCallback(
    async (auto: boolean) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      setStatus("submitting");
      setError(null);
      if (auto) setTimedOut(true);

      try {
        const graded = await submitReadingAttempt(
          paper.mode,
          paper.id,
          answersRef.current,
          paper.durationSeconds - remainingRef.current,
        );
        setResult(graded);
        setStatus("finished");
        // Chấm xong thì điểm lưu hết ý nghĩa; giữ lại chỉ tổ khiến lần vào sau
        // được mời "làm tiếp" một bài đã nộp.
        clearReadingProgress(paper.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nộp bài thất bại.");
        setStatus("running");
        submittingRef.current = false;
      }
    },
    [paper.mode, paper.id, paper.durationSeconds],
  );

  const submit = useCallback(() => {
    void runSubmit(false);
  }, [runSubmit]);

  const restart = useCallback(() => {
    submittingRef.current = false;
    setAnswers({});
    setResult(null);
    setError(null);
    setTimedOut(false);
    setRemainingSeconds(paper.durationSeconds);
    setSectionIndex(0);
    setStatus("running");
    clearReadingProgress(paper.id);
  }, [paper.durationSeconds, paper.id]);

  // Countdown. One interval for the lifetime of a "running" phase; hitting zero
  // submits whatever the student has so far, exactly like the real exam.
  useEffect(() => {
    if (status !== "running") return;

    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          void runSubmit(true);
          return 0;
        }
        const next = prev - 1;
        // Ghi điểm lưu ngay trong nhịp đồng hồ: một bộ đếm, một lần ghi, và
        // đồng hồ đã lưu không bao giờ lệch với đồng hồ đang hiện.
        try {
          window.sessionStorage.setItem(
            storageKey(paper.id),
            JSON.stringify({
              answers: answersRef.current,
              remainingSeconds: next,
              sectionIndex: sectionRef.current,
            } satisfies SavedReadingProgress),
          );
        } catch {
          /* hết chỗ hoặc bị chặn: bài vẫn làm được, chỉ là không làm tiếp được */
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [status, runSubmit, paper.id]);

  const answeredCount = useMemo(() => countAnswered(questions, answers), [questions, answers]);

  return {
    answers,
    setAnswer,
    clearAnswer,
    status,
    result,
    error,
    remainingSeconds,
    elapsedSeconds,
    answeredCount,
    totalQuestions: questions.length,
    timedOut,
    sectionIndex,
    setSectionIndex,
    submit,
    restart,
  };
}

/** 1234 -> "20:34". Kept next to the hook because only the clock UI needs it. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
