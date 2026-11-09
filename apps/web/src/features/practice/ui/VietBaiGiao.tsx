"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WritingState } from "@thuong-ielts/diagnostic";

import WritingBandReport from "../../../components/WritingBandReport";
import { countWords } from "../domain/writing";

/**
 * Màn viết bài Writing cô giao.
 *
 * Bản nháp lưu trong localStorage theo token: F5 hay lỡ đóng tab giữa 40 phút
 * viết mà mất sạch bài là lý do nhanh nhất để em ấy không bao giờ làm lại.
 * Chỉ là tiện ích trên máy em ấy — bài THẬT chỉ có khi bấm nộp và server lưu.
 *
 * Hết giờ thì tự nộp đúng một lần (chốt bằng ref, không phải state — xem
 * CLAUDE.md: bốn cú bấm trong cùng một nhịp đều đọc state cũ).
 */
export default function VietBaiGiao({
  token,
  tieuDe,
  task,
  deBai,
  minWords,
  phut,
  daNop,
  choXemBand,
}: {
  token: string;
  tieuDe: string;
  task: number;
  deBai: string;
  minWords: number;
  phut: number;
  daNop: { essay: string; words: number } | null;
  choXemBand: boolean;
}) {
  const khoaNhap = `viet-bai-${token}`;
  const [essay, setEssay] = useState(daNop?.essay ?? "");
  const [nopRoi, setNopRoi] = useState(Boolean(daNop));
  const [conLai, setConLai] = useState(phut * 60);
  const [dangNop, setDangNop] = useState(false);
  const [loi, setLoi] = useState("");
  const [band, setBand] = useState<WritingState | null>(null);
  const [an, setAn] = useState(!choXemBand);
  const [dangCham, setDangCham] = useState(false);
  const khoaNop = useRef(false);
  const batDau = useRef(Date.now());
  const essayRef = useRef(essay);
  essayRef.current = essay;

  // Khôi phục bản nháp và GIỜ BẮT ĐẦU (chỉ khi chưa nộp). Không nhớ giờ bắt
  // đầu thì F5 là đồng hồ chạy lại từ đầu — tức F5 để được thêm giờ.
  useEffect(() => {
    if (daNop) return;
    try {
      const nhap = localStorage.getItem(khoaNhap);
      if (nhap) setEssay(nhap);
      const luc = Number(localStorage.getItem(`${khoaNhap}-bat-dau`));
      if (luc > 0 && luc <= Date.now()) batDau.current = luc;
      else localStorage.setItem(`${khoaNhap}-bat-dau`, String(batDau.current));
    } catch {}
  }, [daNop, khoaNhap]);

  useEffect(() => {
    if (nopRoi) return;
    try {
      localStorage.setItem(khoaNhap, essay);
    } catch {}
  }, [essay, nopRoi, khoaNhap]);

  const cham = useCallback(async () => {
    setDangCham(true);
    try {
      const res = await fetch("/api/practice/writing/bai-giao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cham", token }),
      });
      const data = (await res.json()) as { writing?: WritingState; an?: boolean; error?: string };
      if (data.an) setAn(true);
      else if (data.writing) setBand(data.writing);
      else setBand({ kind: "ungraded", words: countWords(essayRef.current), reason: data.error ?? "Không chấm được." });
    } catch {
      setBand({ kind: "ungraded", words: countWords(essayRef.current), reason: "Mất mạng giữa chừng." });
    } finally {
      setDangCham(false);
    }
  }, [token]);

  // Đã nộp từ trước (mở lại link) thì hỏi luôn band.
  useEffect(() => {
    if (daNop && choXemBand) void cham();
  }, [daNop, choXemBand, cham]);

  const nop = useCallback(async () => {
    if (khoaNop.current) return;
    if (!essayRef.current.trim()) {
      setLoi("Bài viết đang trống.");
      return;
    }
    khoaNop.current = true;
    setDangNop(true);
    setLoi("");
    try {
      const res = await fetch("/api/practice/writing/bai-giao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nop",
          token,
          essay: essayRef.current,
          elapsedSeconds: Math.round((Date.now() - batDau.current) / 1000),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoi(data.error ?? "Không nộp được. Thử lại nhé.");
        khoaNop.current = false;
        return;
      }
      setNopRoi(true);
      try {
        localStorage.removeItem(khoaNhap);
        localStorage.removeItem(`${khoaNhap}-bat-dau`);
      } catch {}
      if (choXemBand) void cham();
    } catch {
      setLoi("Mất mạng giữa chừng — bài vẫn còn trong ô, bấm nộp lại nhé.");
      khoaNop.current = false;
    } finally {
      setDangNop(false);
    }
  }, [token, khoaNhap, choXemBand, cham]);

  // Đồng hồ: hết giờ thì tự nộp một lần.
  useEffect(() => {
    if (nopRoi) return;
    const t = setInterval(() => {
      const con = phut * 60 - Math.round((Date.now() - batDau.current) / 1000);
      setConLai(Math.max(0, con));
      if (con <= 0) {
        clearInterval(t);
        if (essayRef.current.trim()) void nop();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [nopRoi, phut, nop]);

  const soTu = countWords(essay);
  const mm = String(Math.floor(conLai / 60)).padStart(2, "0");
  const ss = String(conLai % 60).padStart(2, "0");

  return (
    <div className="gutter mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <p className="text-sm font-semibold text-brand/70">Writing Task {task} · bài cô giao</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">{tieuDe}</h1>
      </header>

      <section className="whitespace-pre-line rounded-2xl border border-black/10 bg-mist p-5 leading-relaxed text-ink">
        {deBai}
      </section>

      {!nopRoi ? (
        <>
          <div className="sticky top-20 z-10 flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
            <span className={`font-mono text-lg font-bold tabular-nums ${conLai < 300 ? "text-warn" : "text-ink"}`} aria-label="Thời gian còn lại">
              {mm}:{ss}
            </span>
            <span className={`text-sm ${soTu >= minWords ? "text-brand font-semibold" : "text-ink/60"}`}>
              <b className="font-mono">{soTu}</b> / {minWords} từ
            </span>
            <button
              type="button"
              onClick={() => void nop()}
              disabled={dangNop}
              className="ml-auto cursor-pointer rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
            >
              {dangNop ? "Đang nộp…" : "Nộp bài"}
            </button>
          </div>
          {loi && <p role="alert" className="text-sm font-semibold text-red-600">{loi}</p>}
          <label className="sr-only" htmlFor="bai-viet">Bài viết</label>
          <textarea
            id="bai-viet"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={20}
            spellCheck={false}
            placeholder="Viết bài ở đây…"
            className="w-full rounded-2xl border border-black/15 bg-white p-5 text-base leading-relaxed text-ink focus:border-brand focus:outline-none"
          />
          <p className="text-xs text-ink/55">Bản nháp tự lưu trên máy này. Bài chỉ đến tay cô khi em bấm “Nộp bài”.</p>
        </>
      ) : (
        <section className="flex flex-col gap-4">
          <p className="rounded-2xl bg-leaf/25 px-5 py-4 font-semibold text-brand-deep">
            Đã nộp bài cho cô ({countWords(essay)} từ).
          </p>
          {an ? (
            <p className="text-sm text-ink/65">Cô sẽ mở điểm sau. Em có thể đóng trang này.</p>
          ) : (
            <WritingBandReport
              state={band}
              essay={essay}
              minWords={minWords}
              caption="band tham khảo do AI chấm"
              footnote="Band AI chấm theo bốn tiêu chí IELTS, để em tự soát — cô vẫn đọc và nhận xét bài của em."
              onRetry={() => void cham()}
              retrying={dangCham}
              emptyText="Đang chấm bài…"
            />
          )}
        </section>
      )}
    </div>
  );
}
