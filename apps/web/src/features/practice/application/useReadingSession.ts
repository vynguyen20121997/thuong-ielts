"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { countAnswered } from "../domain/scoring";
import type { ReadingAnswers, ReadingResult, ReadingTest } from "../domain/types";
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
  submit: () => void;
  restart: () => void;
}

export function useReadingSession(test: ReadingTest): ReadingSession {
  const [answers, setAnswers] = useState<ReadingAnswers>({});
  const [status, setStatus] = useState<SessionStatus>("running");
  const [result, setResult] = useState<ReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(test.durationSeconds);
  const [timedOut, setTimedOut] = useState(false);

  // Read inside the interval callback and inside submit() so neither has to be
  // re-created when the answers change — a re-created interval would drift.
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;
  const submittingRef = useRef(false);

  const elapsedSeconds = test.durationSeconds - remainingSeconds;

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
          test.slug,
          answersRef.current,
          test.durationSeconds - remainingRef.current
        );
        setResult(graded);
        setStatus("finished");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nộp bài thất bại.");
        setStatus("running");
        submittingRef.current = false;
      }
    },
    [test.slug, test.durationSeconds]
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
    setRemainingSeconds(test.durationSeconds);
    setStatus("running");
  }, [test.durationSeconds]);

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
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [status, runSubmit]);

  const answeredCount = useMemo(
    () => countAnswered(test.questions, answers),
    [test.questions, answers]
  );

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
    totalQuestions: test.questions.length,
    timedOut,
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
