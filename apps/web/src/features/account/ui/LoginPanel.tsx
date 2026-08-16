"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AlertTriangle, ArrowRight, Loader2, MessageCircle, Phone } from "lucide-react";

import { OTP_LENGTH } from "../domain/otp";
import { formatPhone, normalizePhone } from "../domain/types";

/**
 * Màn đăng nhập. Google và Facebook đẩy thẳng sang nhà cung cấp; số điện thoại
 * đi hai bước ngay tại chỗ (xin mã → nhập mã) để học sinh không rời trang.
 *
 * Provider nào chưa có khoá thì server không truyền xuống, và nút của nó không
 * hiện — thà thiếu một lựa chọn còn hơn bày một nút bấm vào là lỗi.
 */

type Step = "phone" | "code";

export default function LoginPanel({
  providers,
  next,
}: {
  providers: { google: boolean; facebook: boolean };
  next: string;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const normalized = normalizePhone(phone);

  const requestCode = async () => {
    if (!normalized) {
      setError("Số điện thoại không hợp lệ. Nhập số di động, ví dụ 0912 345 678.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const payload = (await res.json()) as { error?: string; devHint?: boolean };

      if (!res.ok) {
        setError(payload.error ?? "Không gửi được mã. Thử lại sau.");
        return;
      }

      setStep("code");
      setNotice(
        payload.devHint
          ? "Chưa cấu hình Zalo — mã đang được in ở console của server (chỉ ở máy dev)."
          : `Đã gửi mã tới Zalo của số ${formatPhone(normalized)}.`
      );
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (code.trim().length !== OTP_LENGTH) {
      setError(`Mã gồm ${OTP_LENGTH} chữ số.`);
      return;
    }
    setBusy(true);
    setError(null);

    const res = await signIn("phone", {
      phone: normalized,
      code: code.trim(),
      redirect: false,
    });

    setBusy(false);
    if (res?.error) {
      setError("Mã không đúng hoặc đã hết hạn. Kiểm tra lại tin Zalo, hoặc gửi mã mới.");
      return;
    }
    // `redirect: false` nên tự chuyển trang — nhờ vậy giữ được thông báo lỗi
    // ở trên thay vì bị Auth.js ném sang trang lỗi của nó.
    window.location.href = next;
  };

  return (
    <div className="flex flex-col gap-5">
      {(providers.google || providers.facebook) && (
        <>
          <div className="flex flex-col gap-2.5">
            {providers.google && (
              <button
                type="button"
                onClick={() => signIn("google", { redirectTo: next })}
                className="flex items-center justify-center gap-3 w-full rounded-full border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-[#1A1A1A] hover:border-[#14532D]/40 hover:bg-[#14532D]/[0.03] cursor-pointer transition-colors"
              >
                <GoogleMark />
                Tiếp tục với Google
              </button>
            )}
            {providers.facebook && (
              <button
                type="button"
                onClick={() => signIn("facebook", { redirectTo: next })}
                className="flex items-center justify-center gap-3 w-full rounded-full border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-[#1A1A1A] hover:border-[#14532D]/40 hover:bg-[#14532D]/[0.03] cursor-pointer transition-colors"
              >
                <FacebookMark />
                Tiếp tục với Facebook
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-2xs font-medium text-[#1A1A1A]/40">hoặc</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
        </>
      )}

      {step === "phone" ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="phone" className="text-2xs font-medium text-[#1A1A1A]/50">
            Số điện thoại — mã xác thực gửi qua Zalo
          </label>
          <div className="relative">
            <Phone
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/35 pointer-events-none"
            />
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && requestCode()}
              placeholder="0912 345 678"
              className="w-full rounded-full border border-black/10 bg-white pl-11 pr-4 py-3.5 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#14532D]/50 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={requestCode}
            disabled={busy}
            className="flex items-center justify-center gap-2 w-full rounded-full bg-[#14532D] hover:bg-[#052E16] disabled:cursor-wait px-4 py-3.5 text-sm font-semibold text-white cursor-pointer transition-colors"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
                Đang gửi mã...
              </>
            ) : (
              <>
                <MessageCircle size={16} />
                Gửi mã qua Zalo
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor="code" className="text-2xs font-medium text-[#1A1A1A]/50">
            Nhập {OTP_LENGTH} số vừa nhận
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && submitCode()}
            placeholder="000000"
            className="w-full rounded-full border border-black/10 bg-white px-5 py-3.5 font-mono text-lg tracking-[0.4em] text-center text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#14532D]/50 transition-colors"
          />

          <button
            type="button"
            onClick={submitCode}
            disabled={busy}
            className="flex items-center justify-center gap-2 w-full rounded-full bg-[#14532D] hover:bg-[#052E16] disabled:cursor-wait px-4 py-3.5 text-sm font-semibold text-white cursor-pointer transition-colors"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
            ) : (
              <ArrowRight size={16} />
            )}
            Đăng nhập
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
                setNotice(null);
              }}
              className="text-2xs font-medium text-[#1A1A1A]/50 hover:text-[#14532D] cursor-pointer"
            >
              Đổi số khác
            </button>
            <button
              type="button"
              onClick={requestCode}
              disabled={busy}
              className="text-2xs font-medium text-[#14532D] hover:underline cursor-pointer"
            >
              Gửi lại mã
            </button>
          </div>
        </div>
      )}

      {notice && <p className="text-2xs text-[#1A1A1A]/55 leading-relaxed">{notice}</p>}

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/* Logo hai hãng vẽ thẳng bằng SVG: CSP không cho tải ảnh ngoài, và hai hình
   này không đáng để thêm một gói phụ thuộc. */

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.1h12c-.2 1.9-1.5 4.7-4.4 6.6l6.8 5.3C42.3 35.5 45 30.3 45 24z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.8-5.3c-1.8 1.3-4.3 2.2-7.7 2.2-5.9 0-10.9-3.9-12.7-9.3l-7 5.4C7.9 41 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.3 28.3c-.5-1.4-.7-2.8-.7-4.3s.3-2.9.7-4.3l-7-5.4C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.7l7-5.4z"
      />
      <path
        fill="#EA4335"
        d="M24 10.4c3.2 0 5.4 1.4 6.7 2.6l6-5.9C33 3.6 29.9 2 24 2 15.4 2 7.9 7 4.3 14.3l7 5.4C13.1 14.3 18.1 10.4 24 10.4z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}
