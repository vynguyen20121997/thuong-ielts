"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { countAnswered } from "../domain/scoring";
import type { AttemptResult, ListeningTest, ReadingAnswers } from "../domain/types";
import { submitListeningAttempt } from "../infrastructure/listeningApi";

/**
 * Application layer for "sitting a listening test": answers, the clock, which
 * section is on screen, the recording, and submission. No JSX — the player
 * renders whatever this returns.
 *
 * Modelled on the computer-delivered IELTS test: the student reads the
 * instructions, presses start, and from then on the recording plays straight
 * through with no pause, seek or replay. That single rule is what forces the
 * shape of everything below — the clock and the audio both start at `start()`,
 * and parts advance by themselves when one ends.
 */

export type SessionStatus =
  | "instructions"
  /** Start pressed, waiting for the recording to actually make a sound. */
  | "starting"
  | "running"
  | "submitting"
  | "finished";

/**
 * How long to wait for the recording before starting the clock anyway. A
 * student on a bad connection should not lose exam time to buffering, but nor
 * should they be stuck on a spinner if the audio is never going to arrive.
 */
const AUDIO_START_TIMEOUT_MS = 8000;

/**
 * What we keep so an accidental reload does not cost the student the attempt.
 *
 * `audioTime` is the part that matters. Restoring the answers alone would turn
 * a reload into a way to hear the recording again, which defeats the whole
 * play-once format — so the recording resumes exactly where it was cut off. A
 * reload then costs nothing and gains nothing.
 */
interface SavedProgress {
  answers: ReadingAnswers;
  remainingSeconds: number;
  activeTrack: number;
  activeSection: number;
  audioTime: number;
}

const storageKey = (slug: string) => `listening-progress:${slug}`;

function readProgress(slug: string): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    // A finished or expired attempt is not worth resuming.
    return parsed.remainingSeconds > 5 ? parsed : null;
  } catch {
    return null;
  }
}

export function useListeningSession(test: ListeningTest) {
  const [answers, setAnswers] = useState<ReadingAnswers>({});
  const [status, setStatus] = useState<SessionStatus>("instructions");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(test.durationSeconds);
  const [timedOut, setTimedOut] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  /** Enough of the recording is buffered to start without stalling. */
  const [audioReady, setAudioReady] = useState(false);
  const [resumable, setResumable] = useState<SavedProgress | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;
  const submittingRef = useRef(false);
  const activeTrackRef = useRef(activeTrack);
  activeTrackRef.current = activeTrack;
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;
  const statusRef = useRef(status);
  statusRef.current = status;

  // Read once on mount so the instructions screen can offer to carry on.
  useEffect(() => {
    setResumable(readProgress(test.slug));
  }, [test.slug]);

  const clearProgress = useCallback(() => {
    try {
      window.sessionStorage.removeItem(storageKey(test.slug));
    } catch {
      /* private mode: losing the checkpoint is not worth failing over */
    }
  }, [test.slug]);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

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

  /** Carries on an attempt the browser interrupted, audio included. */
  const resume = useCallback(() => {
    if (!resumable) return;
    setAnswers(resumable.answers);
    setRemainingSeconds(resumable.remainingSeconds);
    setActiveTrack(resumable.activeTrack);
    setActiveSection(resumable.activeSection);
    setStatus("starting");

    const audio = audioRef.current;
    if (audio) {
      const seek = () => {
        audio.currentTime = resumable.audioTime;
        void audio.play().catch(() => setAudioPlaying(false));
      };
      // Seeking before metadata lands is silently ignored, so wait if needed.
      if (audio.readyState >= 1) seek();
      else audio.addEventListener("loadedmetadata", seek, { once: true });
    }
    setResumable(null);
  }, [resumable]);

  const start = useCallback(() => {
    clearProgress();
    // Not "running" yet: the countdown begins when the recording does, so a
    // slow connection costs buffering time rather than exam time.
    setStatus("starting");
    // Autoplay is only permitted because this runs inside the click handler of
    // the start button; moving it into an effect would get it blocked.
    void audioRef.current?.play().catch(() => setAudioPlaying(false));
  }, [clearProgress]);

  /** Fired by the player once the element reports it is actually playing. */
  const handleAudioPlaying = useCallback(() => {
    setAudioPlaying(true);
    setStatus((prev) => (prev === "starting" ? "running" : prev));
  }, []);

  // Never let a silent failure strand the student on the starting screen.
  useEffect(() => {
    if (status !== "starting") return;
    const id = window.setTimeout(() => setStatus("running"), AUDIO_START_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [status]);

  /**
   * When a part finishes, move to the next recording on its own. The student
   * never gets a transport control, so nothing else would advance it.
   */
  const handleTrackEnded = useCallback(() => {
    setActiveTrack((prev) => (prev < test.audio.length - 1 ? prev + 1 : prev));
  }, [test.audio.length]);

  // A new <audio src> does not play by itself; keep the run going across parts.
  useEffect(() => {
    if ((status !== "running" && status !== "starting") || activeTrack === 0) return;
    void audioRef.current?.play().catch(() => setAudioPlaying(false));
  }, [activeTrack, status]);

  const runSubmit = useCallback(
    async (auto: boolean) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setStatus("submitting");
      setError(null);
      if (auto) setTimedOut(true);

      audioRef.current?.pause();

      try {
        const graded = await submitListeningAttempt(
          test.slug,
          answersRef.current,
          test.durationSeconds - remainingRef.current
        );
        setResult(graded);
        setStatus("finished");
        clearProgress();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nộp bài thất bại.");
        setStatus("running");
        submittingRef.current = false;
      }
    },
    [test.slug, test.durationSeconds, clearProgress]
  );

  const submit = useCallback(() => void runSubmit(false), [runSubmit]);

  const restart = useCallback(() => {
    submittingRef.current = false;
    clearProgress();
    setResumable(null);
    setAnswers({});
    setResult(null);
    setError(null);
    setTimedOut(false);
    setRemainingSeconds(test.durationSeconds);
    setActiveTrack(0);
    setActiveSection(0);
    setStatus("instructions");
  }, [test.durationSeconds, clearProgress]);

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
        // Checkpoint on the same tick as the clock: one timer, one write, and
        // the saved clock can never drift from the displayed one.
        try {
          window.sessionStorage.setItem(
            storageKey(test.slug),
            JSON.stringify({
              answers: answersRef.current,
              remainingSeconds: next,
              activeTrack: activeTrackRef.current,
              activeSection: activeSectionRef.current,
              audioTime: audioRef.current?.currentTime ?? 0,
            } satisfies SavedProgress)
          );
        } catch {
          /* storage full or blocked: the attempt still works, just not resumable */
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, runSubmit, test.slug]);

  /**
   * The recording plays once, so leaving mid-test is destructive in a way a
   * reading test is not. The browser's own dialog is the only thing that can
   * interrupt a reload or a tab close.
   */
  useEffect(() => {
    if (status !== "running") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const answeredCount = useMemo(
    () => countAnswered(test.questions, answers),
    [test.questions, answers]
  );

  /** Per-section answered tallies, for the "0 of 10" counters in the navigator. */
  const sectionProgress = useMemo(
    () =>
      sections.map(({ section, questions }) => ({
        section,
        total: questions.length,
        answered: countAnswered(questions, answers),
      })),
    [sections, answers]
  );

  /**
   * Only moves the pointer between sections. Scrolling back to the top belongs
   * to the player: the exam renders in its own scroll container, so calling
   * window.scrollTo here would scroll the marketing page underneath instead and
   * leave the student halfway down the new section.
   */
  const goToSection = useCallback(
    (index: number) => {
      setActiveSection(Math.max(0, Math.min(index, sections.length - 1)));
    },
    [sections.length]
  );

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
    activeSection,
    goToSection,
    sections,
    sectionProgress,
    audioRef,
    audioPlaying,
    setAudioPlaying,
    handleAudioPlaying,
    audioReady,
    setAudioReady,
    handleTrackEnded,
    start,
    resume,
    canResume: Boolean(resumable),
    unansweredCount: test.questions.length - answeredCount,
    submit,
    restart,
  };
}
