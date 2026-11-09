"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import AccountMenu from "../features/account/ui/AccountMenu";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";

type NavItem = { label: string; to: string; children?: NavItem[] };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Giới thiệu",
    items: [
      { label: "Về giáo viên", to: "/gioi-thieu" },
      { label: "Kinh nghiệm giảng dạy", to: "/kinh-nghiem-giang-day" },
      { label: "Học vấn & Chứng chỉ", to: "/hoc-van-chung-chi" },
    ],
  },
  {
    label: "Giảng dạy",
    items: [
      {
        label: "Phương pháp giảng dạy",
        to: "/phuong-phap",
        children: [
          { label: "Dạy Reading", to: "/phuong-phap/reading" },
          { label: "Dạy Listening", to: "/phuong-phap/listening" },
          { label: "Dạy Writing", to: "/phuong-phap/writing" },
          { label: "Dạy Speaking", to: "/phuong-phap/speaking" },
        ],
      },
      { label: "Hệ thống & Công cụ giảng dạy", to: "/he-thong-cong-cu" },
      { label: "Hình ảnh lớp học", to: "/hinh-anh-lop-hoc" },
    ],
  },
  {
    label: "Học viên",
    items: [
      { label: "Kết quả của học viên", to: "/ket-qua-hoc-vien" },
      { label: "Đánh giá của học viên", to: "/cam-nhan-hoc-vien" },
    ],
  },
  {
    label: "Luyện tập",
    items: [
      { label: "Luyện Reading", to: "/phong-luyen-tap/reading" },
      { label: "Luyện Listening", to: "/phong-luyen-tap/listening" },
    ],
  },
];

const isGroupActive = (items: NavItem[], pathname: string) =>
  items.some(
    (item) =>
      pathname === item.to.split("#")[0] ||
      item.children?.some((child) => pathname === child.to),
  );

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Đổi trang thì đóng ngăn kéo
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Esc đóng ngăn kéo; khoá cuộn trang nền khi ngăn kéo mở
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const testActive = pathname === "/kiem-tra-nen-tang-ielts";

  return (
    <header
      id="header-nav"
      className={`fixed inset-x-0 top-0 z-50 transition-[padding] duration-300 ease-out ${isScrolled ? "pt-2" : "pt-4"}`}
    >
      <div className="gutter mx-auto max-w-7xl">
        <div
          className={`flex h-16 items-center justify-between gap-3 rounded-full border pl-2 pr-2 transition-[background-color,box-shadow,border-color] duration-300 ${
            isScrolled || isMobileMenuOpen
              ? "border-brand/10 bg-white/90 shadow-[0_8px_30px_rgba(20,83,45,0.08)] backdrop-blur-md"
              : "border-transparent bg-white/60 backdrop-blur-sm"
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            id="logo-button"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand transition-colors duration-200 group-hover:bg-brand-deep">
              <GraduationCap size={20} className="text-leaf" aria-hidden />
            </span>
            <span
              id="logo-wordmark"
              className="block whitespace-nowrap text-base font-bold tracking-tight text-brand sm:text-lg lg:text-base xl:text-lg"
            >
              Thương Hồ&apos;s Class
            </span>
          </Link>

          {/* Desktop */}
          <nav
            className="hidden shrink-0 items-center gap-0.5 lg:flex"
            id="desktop-nav"
            aria-label="Điều hướng chính"
          >
            {navGroups.map((group) => {
              const active = isGroupActive(group.items, pathname);
              return (
                <div key={group.label} className="group/menu relative">
                  <button
                    type="button"
                    aria-haspopup="true"
                    className={`flex h-10 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2 xl:px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                      active
                        ? "bg-sage-2 font-bold text-brand"
                        : "font-semibold text-brand/80 hover:bg-sage hover:text-brand group-focus-within/menu:bg-sage"
                    }`}
                  >
                    {group.label}
                    <ChevronDown
                      size={14}
                      aria-hidden
                      className="transition-transform duration-200 group-hover/menu:rotate-180 group-focus-within/menu:rotate-180"
                    />
                  </button>
                  {/* hover HOẶC focus-within: người dùng bàn phím Tab vào cũng mở được */}
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
                    <div className="w-72 rounded-2xl border border-brand/10 bg-white p-2 shadow-xl">
                      {group.items.map((p) => (
                        <div key={p.to}>
                          <Link
                            href={p.to}
                            aria-current={pathname === p.to ? "page" : undefined}
                            className="block whitespace-normal rounded-xl px-4 py-3 text-sm font-semibold leading-snug text-brand/80 transition-colors hover:bg-sage hover:text-brand focus-visible:bg-sage focus-visible:outline-none aria-[current=page]:text-brand"
                          >
                            {p.label}
                          </Link>
                          {p.children && (
                            <div className="mb-1 ml-4 border-l border-brand/15 pl-2">
                              {p.children.map((child) => (
                                <Link
                                  key={child.to}
                                  href={child.to}
                                  className="block rounded-lg px-3 py-2 text-sm font-medium text-brand/80 transition-colors hover:bg-sage hover:text-brand focus-visible:bg-sage focus-visible:outline-none"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <Link
              href="/tu-van"
              aria-current={pathname === "/tu-van" ? "page" : undefined}
              className="flex h-10 items-center whitespace-nowrap rounded-full px-2 xl:px-3 text-sm font-semibold text-brand/80 transition-colors hover:bg-sage hover:text-brand focus-visible:outline-2 focus-visible:outline-brand aria-[current=page]:bg-sage-2 aria-[current=page]:font-bold aria-[current=page]:text-brand"
            >
              Liên hệ
            </Link>
          </nav>

          {/* Desktop: CTA + tài khoản, tách khỏi nav bằng vạch ngăn */}
          <div
            className="hidden shrink-0 items-center gap-2 lg:flex"
            id="header-action-container"
          >
            <Link
              href="/kiem-tra-nen-tang-ielts"
              aria-current={testActive ? "page" : undefined}
              className="group flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-leaf pl-4 pr-3 text-sm font-bold text-brand-deep transition-colors hover:bg-leaf-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="xl:hidden">Kiểm tra nền</span>
              <span className="hidden xl:inline">Kiểm tra nền tảng IELTS</span>
              <ArrowUpRight
                size={16}
                aria-hidden
                className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
            <span className="mx-1 h-6 w-px bg-brand/15" aria-hidden />
            <AccountMenu />
          </div>

          {/* Màn nhỏ: nút Đăng nhập nằm ngoài ngăn kéo, cạnh nút menu — giấu trong
              menu thì học sinh không thấy. Đã đăng nhập thì chip vẫn ở cuối ngăn kéo. */}
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            <AccountMenu loginOnly />
            {/*
              Tên nút nói TRẠNG THÁI bằng tiếng Việt; `aria-expanded` +
              `aria-controls` nối nút với đúng ngăn kéo nó điều khiển.
            */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-drawer"
              id="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/*
        Ngăn kéo mobile. `inert` khi đóng, không chỉ `pointer-events-none`: đã đo
        ngăn kéo đóng vẫn giữ 16 liên kết bắt được focus. `inert` gỡ cả nhánh
        khỏi thứ tự Tab lẫn cây trợ năng.
      */}
      <div
        className={`fixed inset-x-0 bottom-0 top-0 -z-10 overflow-y-auto bg-mist px-4 pb-8 pt-28 transition-[opacity,transform] duration-300 ease-out lg:hidden ${
          isMobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        id="mobile-menu-drawer"
        inert={!isMobileMenuOpen}
      >
        <div className="mx-auto flex min-h-full max-w-md flex-col gap-4">
          <Link
            href="/kiem-tra-nen-tang-ielts"
            className="flex items-center justify-between rounded-2xl bg-leaf p-5 text-lg font-bold text-brand-deep"
          >
            Kiểm tra nền tảng IELTS
            <ArrowUpRight size={22} aria-hidden />
          </Link>

          <nav
            aria-label="Điều hướng chính"
            className="divide-y divide-brand/10 rounded-2xl bg-white px-2"
          >
            {navGroups.map((group) => (
              <details
                key={group.label}
                className="group/acc"
                open={isGroupActive(group.items, pathname) || undefined}
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between rounded-xl px-3 text-base font-bold text-brand [&::-webkit-details-marker]:hidden">
                  {group.label}
                  <ChevronDown
                    size={18}
                    aria-hidden
                    className="text-brand/60 transition-transform duration-200 group-open/acc:rotate-180"
                  />
                </summary>
                <div className="flex flex-col pb-3">
                  {group.items.map((p) => (
                    <div key={p.to}>
                      <Link
                        href={p.to}
                        aria-current={pathname === p.to ? "page" : undefined}
                        className="flex min-h-11 items-center rounded-xl px-4 text-[15px] font-semibold text-brand/80 hover:bg-sage aria-[current=page]:bg-sage-2 aria-[current=page]:text-brand"
                      >
                        {p.label}
                      </Link>
                      {p.children && (
                        <div className="ml-5 flex flex-col border-l border-brand/15 pl-2">
                          {p.children.map((child) => (
                            <Link
                              key={child.to}
                              href={child.to}
                              aria-current={
                                pathname === child.to ? "page" : undefined
                              }
                              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand/80 hover:bg-sage aria-[current=page]:text-brand"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <Link
              href="/tu-van"
              className="flex min-h-14 items-center px-3 text-base font-bold text-brand"
            >
              Liên hệ
            </Link>
          </nav>

          <div className="mt-auto flex flex-col gap-5 pt-4" id="mobile-menu-footer">
            <AccountMenu compact />
            <p className="text-center text-xs text-brand/70">
              © 2026 Hồ Ngọc Thương. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
