"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Plus } from "lucide-react";

// Khai lại kiểu ở đây thay vì import từ `lib/apiToken.ts` (file đó có `pool`):
// component client chạm vào file có `pool` là kéo cả driver Postgres vào bundle.
type TokenTomTat = { id: string; name: string; createdAt: string; lastUsedAt: string | null; revoked: boolean };

/**
 * Tạo / thu hồi token. Token mới hiện ra ĐÚNG MỘT LẦN — DB chỉ giữ bản băm,
 * đóng khung này là không xem lại được nữa, mất thì tạo cái mới.
 */
export default function QuanLyToken({ mcpUrl, tokens }: { mcpUrl: string; tokens: TokenTomTat[] }) {
  const router = useRouter();
  const [ten, setTen] = useState("");
  const [moi, setMoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState<string | null>(null);
  const khoa = useRef(false);

  async function tao() {
    if (khoa.current) return;
    khoa.current = true;
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ten }),
      });
      const data = (await res.json()) as { token?: string };
      if (data.token) {
        setMoi(data.token);
        setTen("");
        router.refresh();
      }
    } finally {
      khoa.current = false;
    }
  }

  async function thuHoi(id: string, tenToken: string) {
    if (!confirm(`Thu hồi "${tenToken}"? Agent đang dùng token này sẽ mất quyền ngay.`)) return;
    await fetch("/api/token", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  async function chep(text: string, nhan: string) {
    try {
      await navigator.clipboard.writeText(text);
      setDaChep(nhan);
      setTimeout(() => setDaChep(null), 2000);
    } catch {}
  }

  const cauHinh = JSON.stringify(
    { mcpServers: { "thuong-ielts": { type: "http", url: mcpUrl, headers: { Authorization: `Bearer ${moi ?? "hnt_…"}` } } } },
    null,
    2
  );
  const o = "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:border-[#14532D] focus:outline-none";

  return (
    <>
      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-bold text-[#1A1A1A]">Địa chỉ MCP</h2>
        <div className="mt-2 flex gap-2">
          <input readOnly value={mcpUrl} className={`${o} font-mono`} aria-label="Địa chỉ MCP" />
          <button type="button" onClick={() => chep(mcpUrl, "url")} className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-black/15 px-4 text-sm font-bold text-[#14532D] hover:bg-[#F3F4EF]">
            <Copy size={15} aria-hidden /> {daChep === "url" ? "Đã chép" : "Chép"}
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-bold text-[#1A1A1A]">Token</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên gợi nhớ, vd. Claude trên laptop" className={`${o} min-w-56 flex-1`} aria-label="Tên token" />
          <button type="button" onClick={tao} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052E16]">
            <Plus size={16} aria-hidden /> Tạo token
          </button>
        </div>

        {moi && (
          <div role="alert" className="mt-4 rounded-xl border border-[#B45309]/30 bg-[#FDF6EE] p-4">
            <p className="text-sm font-bold text-[#7C3A06]">Chép token ngay — đóng trang này là không xem lại được.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={moi} className={`${o} font-mono text-xs`} aria-label="Token mới" />
              <button type="button" onClick={() => chep(moi, "token")} className="shrink-0 cursor-pointer rounded-full bg-[#14532D] px-4 text-sm font-bold text-white">
                {daChep === "token" ? "Đã chép" : "Chép"}
              </button>
            </div>
            <p className="mt-4 text-sm font-semibold text-[#1A1A1A]">Cấu hình cho agent (Claude Code, Cursor…):</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#1A1A1A] p-3 text-xs text-[#9FE870]">{cauHinh}</pre>
            <button type="button" onClick={() => chep(cauHinh, "cfg")} className="mt-2 cursor-pointer text-sm font-bold text-[#14532D] underline">
              {daChep === "cfg" ? "Đã chép cấu hình" : "Chép cấu hình"}
            </button>
          </div>
        )}

        <ul className="mt-5 flex flex-col divide-y divide-black/5">
          {tokens.length === 0 && <li className="py-3 text-sm text-[#1A1A1A]/50">Chưa có token nào.</li>}
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <KeyRound size={16} className={t.revoked ? "text-[#1A1A1A]/30" : "text-[#14532D]"} aria-hidden />
              <span className="mr-auto min-w-0">
                <b className={`block text-sm ${t.revoked ? "text-[#1A1A1A]/40 line-through" : "text-[#1A1A1A]"}`}>{t.name}</b>
                <span className="text-xs text-[#1A1A1A]/50">
                  tạo {new Date(t.createdAt).toLocaleDateString("vi-VN")} ·{" "}
                  {t.lastUsedAt ? `dùng lần cuối ${new Date(t.lastUsedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : "chưa dùng"}
                </span>
              </span>
              {t.revoked ? (
                <span className="text-xs font-bold text-[#1A1A1A]/40">Đã thu hồi</span>
              ) : (
                <button type="button" onClick={() => thuHoi(t.id, t.name)} className="cursor-pointer rounded-full border border-black/10 px-3 py-1 text-xs font-bold text-[#1A1A1A]/60 hover:border-red-300 hover:text-red-600">
                  Thu hồi
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
