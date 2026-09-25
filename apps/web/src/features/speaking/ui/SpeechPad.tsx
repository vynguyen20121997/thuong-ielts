"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";

import { MIN_WORDS_TO_GRADE, speechStats } from "../domain/speech";
import { TALK_SECONDS, formatClock } from "../domain/timing";
import type { Part, SpeakingState } from "../domain/types";
import { useSpeechToText } from "../application/useSpeechToText";
import { grader } from "../infrastructure";
import SpeakingReport from "./SpeakingReport";

/*
  Nói — thấy chữ hiện ra — bấm "Hoàn thành nói" — nhận điểm theo tiêu chí
  Speaking.

  ## Vì sao hiện chữ trong lúc nói

  Nói tiếng Anh một mình thì không có cách nào biết mình vừa nói gì. Chữ hiện
  ra ngay là tấm gương: thấy câu đứt quãng, thấy mình lặp "um", thấy chỗ máy
  nghe không ra (thường cũng là chỗ giám khảo nghe không ra). Đó là lý do bản
  ghi chạy ở trình duyệt chứ không gửi file lên server chấm — chờ vài giây là
  mất hẳn tác dụng này.

  ## Một nút, hai việc

  "Hoàn thành nói" vừa dừng nghe vừa gửi chấm. Tách thành "dừng" rồi "chấm" là
  bắt bấm hai lần cho một ý định duy nhất; đã nói xong thì chẳng ai muốn dừng
  mà không chấm.

  ## Chấm được ba tiêu chí, và phải nói ra là ba

  Từ chữ thì đọc được Trôi chảy / Vốn từ / Ngữ pháp. Phát âm thì không — chữ
  không giữ trọng âm hay âm cuối bị nuốt. Màn hình ghi rõ điều đó ngay cạnh
  nút, chứ không để học sinh tưởng mình vừa được chấm đủ bốn tiêu chí.
*/

export default function SpeechPad({
  questionId,
  prompt,
  part,
  maxSeconds,
}: {
  questionId: string;
  prompt: string;
  part: Part;
  /** Mặc định lấy theo part; truyền vào khi màn hình có nhịp riêng. */
  maxSeconds?: number;
}) {
  const limit = maxSeconds ?? TALK_SECONDS[part];

  const speech = useSpeechToText();
  const [seconds, setSeconds] = useState(0);
  const [state, setState] = useState<SpeakingState | null>(null);
  const [grading, setGrading] = useState(false);

  /* Chốt chống bấm lặp phải là REF: hai cú bấm trong cùng một nhịp đều đọc
     state cũ, và `disabled` cũng chỉ có hiệu lực sau lần vẽ lại. */
  const gradingRef = useRef(false);
  const startedAt = useRef(0);
  const timer = useRef(0);
  /* Bản ghi lúc bấm dừng — `speech.transcript` bị xoá khi nói lại. */
  const captured = useRef("");

  const listening = speech.status === "listening";

  useEffect(() => {
    if (!listening) {
      window.clearInterval(timer.current);
      return;
    }
    startedAt.current = performance.now();
    setSeconds(0);
    timer.current = window.setInterval(() => {
      setSeconds((performance.now() - startedAt.current) / 1000);
    }, 250);
    return () => window.clearInterval(timer.current);
  }, [listening]);

  /* Giám khảo thật ngắt đúng giờ. Để nói quá là luyện sai nhịp ngay từ đầu. */
  useEffect(() => {
    if (listening && seconds >= limit) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, seconds, limit]);

  const stats = speechStats(captured.current || speech.transcript, seconds);

  async function finish() {
    if (gradingRef.current) return;
    const text = speech.transcript.trim();
    const spoken = seconds;
    speech.stop();
    captured.current = text;

    if (!text) {
      setState({
        kind: "ungraded",
        reason: "Chưa nghe được chữ nào — kiểm tra mic rồi nói lại.",
      });
      return;
    }

    /*
      Bài quá ngắn thì trả lời ngay tại đây, không đi vòng lên server. Server
      vẫn có chốt y hệt (`speakingBand.ts`) vì client nào cũng sửa được —
      nhưng đi một vòng mạng để nhận về đúng câu này thì học sinh phải chờ
      không lý do. Cả hai chỗ đọc chung `MIN_WORDS_TO_GRADE`, nên ngưỡng vẫn
      chỉ có một nguồn.
    */
    const words = speechStats(text, spoken).words;
    if (words < MIN_WORDS_TO_GRADE) {
      setState({
        kind: "ungraded",
        reason: `Mới nghe được ${words} từ. Cần ít nhất ${MIN_WORDS_TO_GRADE} từ thì chấm mới có nghĩa — bấm Nói lại và trả lời dài hơn.`,
      });
      return;
    }

    gradingRef.current = true;
    setGrading(true);
    setState({ kind: "grading" });
    const next = await grader.gradeTranscript({
      questionId,
      prompt,
      part,
      transcript: text,
      durationSeconds: spoken,
    });
    setState(next);
    setGrading(false);
    gradingRef.current = false;
  }

  function again() {
    captured.current = "";
    setState(null);
    setSeconds(0);
    speech.reset();
    speech.start();
  }

  const shown = captured.current || speech.transcript;
  const left = Math.max(0, limit - seconds);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-sage-3 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-2xs font-extrabold uppercase tracking-wider text-ink/65">
            Bài nói của bạn · máy nghe và ghi lại thành chữ
          </p>
          <span
            className="ml-auto font-mono text-2xl font-extrabold tracking-tight text-brand"
            aria-label={listening ? "Thời gian còn lại" : "Đã nói"}
          >
            {formatClock(listening ? left : seconds)}
          </span>
        </div>

        {/*
          Ô chữ luôn có mặt, kể cả lúc chưa nói: một ô trống có sẵn cho thấy
          chữ sẽ hiện ở đâu, còn ô mọc ra giữa lúc đang nói thì đẩy nút xuống
          ngay khi người ta định bấm.
        */}
        <div
          aria-live="polite"
          aria-label="Bản ghi lời nói"
          className="min-h-[7rem] rounded-xl bg-mist-3 px-4 py-3.5 text-[15px] leading-[1.9]"
        >
          {shown || speech.interimText ? (
            <p className="break-words">
              {captured.current || speech.finalText}
              {!captured.current && speech.interimText && (
                <>
                  {" "}
                  {/* Phần máy còn đang đoán — mờ hơn, vì nó còn đổi. */}
                  <span className="text-ink/65 underline decoration-dotted decoration-ink/30 underline-offset-4">
                        {speech.interimText}
                      </span>
                </>
              )}
            </p>
          ) : (
            <p className="text-sm text-ink/65">
              {listening
                ? "Đang nghe… nói một câu là chữ hiện ra ở đây."
                : "Bấm Bắt đầu nói rồi trả lời thành tiếng. Chữ sẽ hiện ra ngay ở ô này."}
            </p>
          )}
        </div>

        {(listening || shown) && (
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-2xs text-ink/60">
            <span>
              <b className="text-ink/80">{stats.words}</b> từ
            </span>
            <span>
              <b className="text-ink/80">{stats.wpm}</b> từ/phút
            </span>
            <span>
              <b className="text-ink/80">{stats.fillers}</b> tiếng ngập ngừng
              (um, uh…)
            </span>
          </p>
        )}

        {speech.status === "unsupported" && (
          <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed">
            Trình duyệt này không nghe được lời nói. Dùng Chrome, Edge hoặc
            Safari mới — Firefox chưa có tính năng này.
          </p>
        )}
        {speech.status === "denied" && (
          <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed">
            Trình duyệt chưa cho dùng mic. Bấm biểu tượng ổ khoá cạnh địa chỉ
            web, cho phép Microphone rồi thử lại.
          </p>
        )}
        {speech.status === "error" && (
          <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed">
            Bộ nghe của trình duyệt vừa ngắt. Bấm nói lại — phần chữ đã ghi
            được vẫn còn.
          </p>
        )}

        <div className="flex flex-wrap gap-2.5">
          {!listening && !shown && (
            <button
              type="button"
              onClick={speech.start}
              disabled={speech.status === "unsupported"}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
            >
              <Mic size={16} /> Bắt đầu nói
            </button>
          )}

          {listening && (
            <button
              type="button"
              onClick={finish}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white"
            >
              <Square size={14} fill="currentColor" /> Hoàn thành nói
            </button>
          )}

          {!listening && shown && (
            <>
              <button
                type="button"
                onClick={finish}
                disabled={grading || state?.kind === "graded"}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              >
                {grading ? "Đang chấm…" : "Chấm bài nói"}
              </button>
              <button
                type="button"
                onClick={again}
                disabled={grading}
                className="flex items-center gap-2 rounded-xl border border-sage-3 bg-white px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                <RotateCcw size={15} /> Nói lại
              </button>
            </>
          )}
        </div>

        <p className="text-2xs leading-relaxed text-ink/60">
          Chấm ba tiêu chí đọc được từ chữ: Trôi chảy, Vốn từ, Ngữ pháp. Phát
          âm phải NGHE mới chấm được nên để cô chấm — vì vậy chưa có band tổng.
          Nói ít nhất {MIN_WORDS_TO_GRADE} từ thì chấm mới có nghĩa.
        </p>
      </section>

      {state && state.kind !== "recorded" && (
        <SpeakingReport
          state={state}
          audioUrl={null}
          onRetry={finish}
          retrying={grading}
        />
      )}
    </div>
  );
}
