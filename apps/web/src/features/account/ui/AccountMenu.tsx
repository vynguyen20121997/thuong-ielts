"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, History, LogOut, Target, UserRound } from "lucide-react";

/**
 * Chip tài khoản ở cuối header.
 *
 * Ba thứ hiện ra, theo đúng thứ tự học sinh cần:
 *
 * 1. **Tên riêng**, không phải họ tên đầy đủ — "Nguyễn Thị Thu Hà" chiếm hết
 *    thanh header, còn "Thu Hà" thì vừa đủ nhận ra mình đang đăng nhập.
 * 2. **Band mục tiêu**, con số các em quan tâm nhất và cũng là thứ vừa được
 *    hỏi lúc lập hồ sơ. Để nó ở đây thì mục tiêu luôn nằm trong tầm mắt.
 * 3. Ảnh đại diện, hoặc chữ cái đầu khi đăng nhập bằng cách không có ảnh.
 *
 * Chưa đăng nhập thì không vẽ gì: thanh header vốn đã chật, thêm nút "Đăng
 * nhập" nữa là chen với nút "Về Cô Thương" đang là lời mời chính của trang.
 */

interface Account {
  name: string | null;
  avatarUrl: string | null;
  targetBand: number | null;
}

/** "Nguyễn Thị Thu Hà" -> "Thu Hà". Tên riêng của người Việt nằm ở cuối. */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.length <= 2 ? full : parts.slice(-2).join(" ");
}

function initials(full: string): string {
  const parts = full.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? "?").toUpperCase();
}

export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/account/me")
      .then((res) => res.json())
      .then((data: { student: Account | null }) => {
        if (alive) setAccount(data.student);
      })
      .catch(() => {
        /* không biết ai đang đăng nhập thì thôi không vẽ chip, không báo lỗi */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Bấm ra ngoài thì đóng menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!account) return null;

  const ten = account.name ? shortName(account.name) : "Học viên";
  const chuCaiDau = account.name ? initials(account.name) : "?";

  const avatar = account.avatarUrl ? (
    // Ảnh từ Google/Facebook nằm ngoài miền; `next/image` sẽ đòi khai domain
    // trong config, mà một ảnh 28px thì không đáng để thêm cấu hình.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={account.avatarUrl}
      alt=""
      className="h-7 w-7 rounded-full object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="h-7 w-7 rounded-full bg-[#14532D] text-[#9FE870] flex items-center justify-center text-2xs font-bold">
      {chuCaiDau}
    </span>
  );

  // Trong menu điện thoại: bày phẳng ra, không giấu sau nút bấm.
  if (compact) {
    return (
      <div className="flex flex-col gap-1 border-t border-black/5 pt-3 mt-1">
        <div className="flex items-center gap-2.5 px-4 py-2">
          {avatar}
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#1A1A1A] truncate">{ten}</span>
            {account.targetBand && (
              <span className="block text-2xs text-[#1A1A1A]/50">
                Mục tiêu {account.targetBand.toFixed(1)}
              </span>
            )}
          </span>
        </div>
        <Link
          href="/lich-su"
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#1A1A1A]/80 hover:text-[#14532D] hover:bg-[#9FE870]/15 transition-colors"
        >
          <History size={15} />
          Bài đã làm
        </Link>
        <Link
          href="/ho-so"
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#1A1A1A]/80 hover:text-[#14532D] hover:bg-[#9FE870]/15 transition-colors"
        >
          <UserRound size={15} />
          Hồ sơ của tôi
        </Link>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-left text-sm font-semibold text-[#1A1A1A]/60 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
        >
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-black/10 bg-white pl-1.5 pr-3 py-1.5 hover:border-[#14532D]/40 cursor-pointer transition-colors"
      >
        {avatar}
        <span className="hidden lg:block text-xs font-semibold text-[#1A1A1A] max-w-24 truncate">
          {ten}
        </span>
        {account.targetBand && (
          <span className="hidden lg:flex items-center gap-1 rounded-full bg-[#9FE870]/25 px-2 py-0.5 text-2xs font-bold text-[#14532D] tabular-nums">
            <Target size={10} />
            {account.targetBand.toFixed(1)}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`text-[#1A1A1A]/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-black/5 bg-white p-1.5 shadow-xl"
        >
          <div className="px-3 py-2.5 border-b border-black/5 mb-1">
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{account.name ?? ten}</p>
            {account.targetBand && (
              <p className="text-2xs text-[#1A1A1A]/50 mt-0.5">
                Mục tiêu Overall {account.targetBand.toFixed(1)}
              </p>
            )}
          </div>

          <Link
            href="/lich-su"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1A1A1A]/80 hover:bg-[#9FE870]/15 hover:text-[#14532D] transition-colors"
          >
            <History size={15} />
            Bài đã làm
          </Link>
          <Link
            href="/ho-so"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1A1A1A]/80 hover:bg-[#9FE870]/15 hover:text-[#14532D] transition-colors"
          >
            <UserRound size={15} />
            Hồ sơ của tôi
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ redirectTo: "/" })}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#1A1A1A]/60 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
