"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { countAnswered } from "../domain/scoring";
import type { AttemptResult, ListeningTest, ReadingAnswers } from "../domain/types";
import { submitListeningAttempt } from "../infrastructure/listeningApi";

/**
 * Application layer for "sitting a listening test": answers, the clock, which
 * recording is selected, and submission. No JSX — the player renders whatever
 * this returns.
 *
 * Deliberately NOT modelled on the real exam's play-once rule. This is practice:
 * a student who cannot replay a section learns nothing from getting it wrong.
 */

export type SessionStatus = "running" | "submitting" | "finished";

export function useListeningSession(test: ListeningTest) {
  const [answers, setAnswers] = useState<ReadingAnswers>({});
  const [status, setStatus] = useState<SessionStatus>("running");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(test.durationSeconds);
  const [timedOut, setTimedOut] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;
  const submittingRef = useRef(false);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const runSubmit = useCallback(
    async (auto: boolean) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setStatus("submitting");
      setError(null);
      if (auto) setTimedOut(true);

      try {
        const graded = await submitListeningAttempt(
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

  const submit = useCallback(() => void runSubmit(false), [runSubmit]);

  const restart = useCallback(() => {
    submittingRef.current = false;
    setAnswers({});
    setResult(null);
    setError(null);
    setTimedOut(false);
    setRemainingSeconds(test.durationSeconds);
    setActiveTrack(0);
    setStatus("running");
  }, [test.durationSeconds]);

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

  /** Questions grouped by recorded part, in the order the exam presents them. */
  const sections = useMemo(() => {
    const bySection = new Map<number, typeof test.questions>();
    for (const q of test.questions) {
      const s = q.section ?? 1;
      if (!bySection.has(s)) bySection.set(s, []);
      bySection.get(s)!.push(q);
    }
    return [...bySection.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([section, questions]) => ({ section, questions }));
  }, [test.questions]);

  return {
    answers,
    setAnswer,
    status,
    result,
    error,
    remainingSeconds,
    answeredCount,
    totalQuestions: test.questions.length,
    timedOut,
    activeTrack,
    setActiveTrack,
    sections,
    submit,
    restart,
  };
}
