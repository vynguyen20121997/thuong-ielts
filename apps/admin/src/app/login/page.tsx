"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Đăng nhập thất bại");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Không thể kết nối tới server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-black/10 rounded-2xl shadow-sm p-8"
      >
        <h1 className="font-serif text-2xl font-black text-[#1A1A1A] mb-1">Admin</h1>
        <p className="text-sm text-[#1A1A1A]/60 mb-6">HNT.IELTS - Hồ Ngọc Thương</p>

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2">
            Tài khoản
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#14532D] focus:outline-none text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#14532D] focus:outline-none text-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 mb-4" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#14532D] hover:bg-[#052E16] text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
