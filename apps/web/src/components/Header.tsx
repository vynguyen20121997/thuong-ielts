"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import AccountMenu from "../features/account/ui/AccountMenu";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, GraduationCap } from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navGroups = [
    {
      label: "Giới Thiệu",
      items: [
        { label: "Về giáo viên", to: "/gioi-thieu" },
        { label: "Kinh nghiệm giảng dạy", to: "/kinh-nghiem-giang-day" },
        { label: "Học vấn & Chứng chỉ", to: "/hoc-van-chung-chi" },
      ],
    },
    {
      label: "Giảng Dạy",
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
      ],
    },
    {
      label: "Thành Tích",
      items: [
        { label: "Kết quả học viên", to: "/ket-qua-hoc-vien" },
        { label: "Câu chuyện học viên", to: "/thanh-tich" },
      ],
    },
  ];

  const linkClass = (isActive: boolean) =>
    `relative py-2 text-xs lg:text-sm transition-colors cursor-pointer group whitespace-nowrap ${isActive ? "text-brand font-bold" : "text-brand/70 font-semibold hover:text-brand"}`;

  return (
    <header
      id="header-nav"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${isScrolled ? "py-3 bg-mist/95 backdrop-blur-md border-b border-black/5 shadow-[0_4px_30px_rgba(20,83,45,0.04)]" : "py-5 bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 flex items-center justify-between gap-3">
        {/* Logo: vòng tròn xanh + wordmark theo Figma */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 cursor-pointer shrink-0"
          id="logo-button"
        >
          <span className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-brand-deep">
            <GraduationCap size={20} className="text-leaf" />
          </span>
          <span className="font-bold text-lg tracking-tight text-brand whitespace-nowrap">
            Thương Hồ&apos;s Class
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-7 min-w-0"
          id="desktop-nav"
        >
          {navGroups.map((group) => {
            const active = group.items.some(
              (item) =>
                pathname === item.to.split("#")[0] ||
                item.children?.some((child) => pathname === child.to)
            );
            return (
          <div key={group.label} className="relative group py-2">
            <button
              className={`flex items-center gap-1 text-xs lg:text-sm transition-colors cursor-pointer whitespace-nowrap ${active ? "text-brand font-bold" : "text-brand/70 font-semibold group-hover:text-brand"}`}
            >
              {group.label}
              <ChevronDown
                size={14}
                className="transition-transform duration-300 group-hover:rotate-180"
              />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
              <div className="w-72 rounded-2xl border border-black/5 bg-white p-2 shadow-xl">
                {group.items.map((p) => (
                  <div key={p.to}>
                    <Link
                      href={p.to}
                      className="block rounded-xl px-4 py-3 text-sm font-semibold leading-snug text-brand/80 transition-colors hover:bg-sage hover:text-brand whitespace-normal"
                    >
                      {p.label}
                    </Link>
                    {p.children && (
                      <div className="mb-1 ml-3 border-l border-brand/15 pl-2">
                        {p.children.map((child) => (
                          <Link
                            key={child.to}
                            href={child.to}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-brand/65 transition-colors hover:bg-sage hover:text-brand"
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

          <Link href="/cam-nhan-hoc-vien" className={linkClass(pathname === "/cam-nhan-hoc-vien")}>
            Đánh Giá
          </Link>
          <Link href="/tu-van" className={linkClass(pathname === "/tu-van")}>
            Liên Hệ
          </Link>
        </nav>

        {/* Action */}
        <div className="hidden md:flex items-center gap-3 shrink-0" id="header-action-container">
          <AccountMenu />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-brand hover:text-brand-deep transition-colors cursor-pointer shrink-0"
          aria-label="Toggle Menu"
          id="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 top-[64px] bg-mist z-40 md:hidden flex flex-col justify-between px-8 py-12 transition-all duration-500 ease-in-out border-t border-black/5 overflow-y-auto ${isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}
        id="mobile-menu-drawer"
      >
        <div className="flex flex-col gap-7">
          {navGroups.map((group) => (
          <div key={group.label}>
            <span className="text-2xs text-brand/40 font-medium block mb-3">{group.label}</span>
            <div className="flex flex-col gap-4 pl-1">
              {group.items.map((p) => (
                <div key={p.to} className="space-y-3">
                  <Link
                    href={p.to}
                    className="block text-2xl font-bold text-left text-brand hover:text-brand-deep transition-colors"
                  >
                    {p.label}
                  </Link>
                  {p.children && (
                    <div className="ml-2 flex flex-col gap-3 border-l border-brand/20 pl-4">
                      {p.children.map((child) => (
                        <Link key={child.to} href={child.to} className="text-lg font-semibold text-brand/70 hover:text-brand">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          ))}

          <Link href="/cam-nhan-hoc-vien" className="text-3xl font-bold text-left text-brand hover:text-brand-deep transition-colors cursor-pointer">
            Đánh Giá
          </Link>

          <Link
            href="/tu-van"
            className="text-3xl font-bold text-left text-brand hover:text-brand-deep transition-colors cursor-pointer"
          >
            Liên Hệ
          </Link>
        </div>

        <div className="flex flex-col gap-6 pt-8" id="mobile-menu-footer">
          <AccountMenu compact />

          <div className="text-center">
            <p className="text-xs text-brand/40">
              © 2026 Hồ Ngọc Thương. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
