"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  MonitorPlay,
  ClipboardCheck,
  FileStack,
  Bot,
  Users,
  BookA,
  PenLine,
  Trophy,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

type Item = { label: string; href: string; icon: LucideIcon };

/*
  Chia nhóm theo VIỆC cô làm, nhóm dạy học đứng đầu: giữa buổi dạy thì đây là
  thứ cô mở, còn sửa nội dung marketing thì để lúc rảnh.

  "Lớp đang làm" là PHÒNG THI trực tiếp, sống một buổi. "Học viên & học phí"
  là lớp học thật, sống nhiều tháng. Hai nhãn phải khác nhau rõ, vì trong code
  cả hai đều từng gọi là "lớp".

  `/hero` cố ý KHÔNG có trên thanh: vẫn mở được bằng địa chỉ trực tiếp, nhưng
  là thứ sửa vài tháng một lần.
*/
const NAV_GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Dạy học",
    items: [
      { label: "Tổng quan", href: "/", icon: LayoutDashboard },
      { label: "Giao bài", href: "/lop/giao", icon: Send },
      { label: "Đề nội bộ", href: "/de-noi-bo", icon: FileStack },
      { label: "Kết nối AI", href: "/ket-noi-ai", icon: Bot },
      { label: "Lớp đang làm", href: "/lop", icon: MonitorPlay },
      { label: "Kiểm tra nền", href: "/chan-doan", icon: ClipboardCheck },
    ],
  },
  {
    label: "Học viên",
    items: [{ label: "Học viên & học phí", href: "/hoc-vien", icon: Users }],
  },
  {
    label: "Nội dung",
    items: [
      { label: "Từ vựng", href: "/noi-dung/tu-vung", icon: BookA },
      { label: "Đề Writing", href: "/noi-dung/writing", icon: PenLine },
      { label: "Kết quả học viên", href: "/testimonials", icon: Trophy },
      { label: "Cảm nhận học viên", href: "/feedbacks", icon: MessageSquareQuote },
    ],
  },
];

const ALL = NAV_GROUPS.flatMap((g) => g.items);

/** Mục khớp DÀI NHẤT thắng — để `/lop/giao/...` sáng "Giao bài" chứ không sáng cả "Lớp đang làm". */
function activeHref(pathname: string) {
  return ALL.map((i) => i.href)
    .filter((h) => (h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(h + "/")))
    .sort((a, b) => b.length - a.length)[0];
}

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export default function AdminShell({
  teacherName,
  children,
}: {
  teacherName: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = activeHref(pathname);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  // Màn nhỏ: thanh bên đóng nằm ngoài màn hình nhưng vẫn bắt được Tab nếu không `inert`.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const name = teacherName || "Giáo viên";
  const initials = name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Thu gọn chỉ áp dụng cho desktop; ngăn kéo mobile luôn hiện đủ nhãn.
  const mini = collapsed && !mobileOpen;

  return (
    <div className="min-h-screen bg-[#F3F4EF]">
      {/* Lớp phủ mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      {/* Thanh bên */}
      <aside
        id="admin-sidebar"
        inert={isMobile && !mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-black/[0.06] bg-white transition-[width,transform] duration-200 ease-out ${
          mini ? "lg:w-[76px]" : "lg:w-64"
        } w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Điều hướng quản trị"
      >
        {/* Logo — cao bằng header để hai đường kẻ thẳng hàng */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-black/[0.06] px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14532D]">
              <GraduationCap size={20} className="text-[#9FE870]" aria-hidden />
            </span>
            {!mini && (
              <span className="truncate text-base font-bold text-[#1A1A1A]">
                HNT<span className="text-[#14532D]">.</span>Admin
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-[#1A1A1A]/60 hover:bg-black/5 lg:hidden"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              {mini ? (
                <div className="mx-3 mb-2 h-px bg-black/[0.06]" aria-hidden />
              ) : (
                <p className="mb-1.5 px-3 text-xs font-medium text-[#1A1A1A]/50">{group.label}</p>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = current === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={mini ? item.label : undefined}
                        className={`flex h-11 items-center gap-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#14532D] ${
                          mini ? "justify-center px-0" : "px-3"
                        } ${
                          active
                            ? "bg-[#9FE870]/30 text-[#14532D]"
                            : "text-[#1A1A1A]/75 hover:bg-[#F3F4EF] hover:text-[#14532D]"
                        }`}
                      >
                        <Icon
                          size={19}
                          aria-hidden
                          className={active ? "text-[#14532D]" : "text-[#14532D]/70"}
                        />
                        {mini ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-black/[0.06] p-3">
          <button
            type="button"
            onClick={handleLogout}
            title={mini ? "Đăng xuất" : undefined}
            className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl text-sm font-semibold text-[#1A1A1A]/60 transition-colors hover:bg-red-50 hover:text-red-600 ${mini ? "justify-center" : "px-3"}`}
          >
            <LogOut size={19} aria-hidden />
            {mini ? <span className="sr-only">Đăng xuất</span> : "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* Cột nội dung */}
      <div className={`transition-[padding] duration-200 ease-out ${mini ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/[0.06] bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[#14532D] hover:bg-[#F3F4EF] lg:hidden"
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar"
          >
            <Menu size={22} />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[#14532D] hover:bg-[#F3F4EF] lg:flex"
            aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14532D] text-sm font-bold text-[#9FE870]">
              {initials}
            </span>
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate text-sm font-bold text-[#1A1A1A]">{name}</span>
              <span className="block text-xs font-medium text-[#14532D]">Giáo viên</span>
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
