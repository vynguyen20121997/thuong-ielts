"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import AccountMenu from "../features/account/ui/AccountMenu";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";

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

  const navItems = [
    { label: "Giới Thiệu", to: "/gioi-thieu" },
    { label: "Thành Tích", to: "/thanh-tich" },
  ];

  const studentPages = [
    { label: "Kết quả học viên", to: "/ket-qua-hoc-vien" },
    { label: "Cảm nhận học viên", to: "/cam-nhan-hoc-vien" },
  ];

  const isStudentActive = studentPages.some((p) => p.to === pathname);

  const linkClass = (isActive: boolean) =>
    `relative py-2 text-xs lg:text-sm font-semibold transition-colors cursor-pointer group whitespace-nowrap ${isActive ? "text-[#14532D]" : "text-[#1A1A1A]/70 hover:text-[#14532D]"}`;

  const NavUnderline = ({ isActive }: { isActive: boolean }) => (
    <span
      className={`absolute bottom-0 left-0 h-[2px] bg-[#14532D] transition-all duration-300 ease-out ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
    />
  );

  return (
    <header
      id="header-nav"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${isScrolled ? "py-4 bg-white/95 backdrop-blur-md border-b border-black/5 shadow-[0_4px_30px_rgba(26,26,26,0.03)]" : "py-6 bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 flex items-center justify-between gap-3">
        {/* Text Logo */}
        <Link
          href="/"
          className="group flex items-center cursor-pointer text-left animate-fade-in shrink-0"
          id="logo-button"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 border-2 border-[#14532D] flex items-center justify-center font-bold text-lg md:text-xl text-[#14532D] font-serif mr-2 md:mr-3 transition-colors duration-300 group-hover:bg-[#14532D] group-hover:text-white rounded shrink-0">
            H
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base md:text-lg lg:text-xl font-bold tracking-tight text-[#1A1A1A] whitespace-nowrap">
              HNT<span className="text-[#14532D]">.</span>IELTS
            </span>
            <span className="text-2xs md:text-2xs text-[#1A1A1A]/60 transition-all duration-300 group-hover:text-[#14532D] font-medium whitespace-nowrap">
              Hồ Ngọc Thương
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-3 lg:gap-8 xl:gap-10 min-w-0"
          id="desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link key={item.to} href={item.to} className={linkClass(isActive)}>
                {item.label}
                <NavUnderline isActive={isActive} />
              </Link>
            );
          })}

          {/* Học Viên dropdown */}
          <div className="relative group py-2" id="nav-hocvien">
            <button
              className={`flex items-center gap-1 text-xs lg:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${isStudentActive ? "text-[#14532D]" : "text-[#1A1A1A]/70 group-hover:text-[#14532D]"}`}
            >
              Học Viên
              <ChevronDown
                size={14}
                className="transition-transform duration-300 group-hover:rotate-180"
              />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
              <div className="bg-white border border-black/5 rounded-2xl shadow-xl p-2 w-56">
                {studentPages.map((p) => (
                  <Link
                    key={p.to}
                    href={p.to}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-[#1A1A1A]/80 hover:text-[#14532D] hover:bg-[#9FE870]/15 transition-colors whitespace-nowrap"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/tu-van" className={linkClass(pathname === "/tu-van")}>
            Liên Hệ
            <NavUnderline isActive={pathname === "/tu-van"} />
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3 shrink-0" id="header-action-container">
          <AccountMenu />
          <Link
            href="/gioi-thieu"
            className="group relative inline-flex items-center gap-1.5 lg:gap-2 px-3.5 lg:px-6 py-2 lg:py-2.5 bg-[#9FE870] text-[#14532D] rounded-full text-2xs lg:text-xs font-bold uppercase tracking-wider overflow-hidden shadow-md transition-all duration-300 hover:bg-[#86D65A] cursor-pointer whitespace-nowrap"
            id="header-cta"
          >
            <span className="relative z-10 flex items-center gap-1.5 lg:gap-2">
              Về Cô Thương
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[#1A1A1A] hover:text-[#14532D] transition-colors cursor-pointer shrink-0"
          aria-label="Toggle Menu"
          id="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 top-[68px] bg-white z-40 md:hidden flex flex-col justify-between px-8 py-12 transition-all duration-500 ease-in-out border-t border-black/5 overflow-y-auto ${isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"}`}
        id="mobile-menu-drawer"
      >
        <div className="flex flex-col gap-7">
          {navItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className="font-serif text-3xl font-bold text-left text-[#1A1A1A] hover:text-[#14532D] transition-colors cursor-pointer"
            >
              {item.label}
            </Link>
          ))}

          {/* Học Viên group */}
          <div>
            <span className="text-2xs text-[#1A1A1A]/40 font-medium block mb-3">Học Viên</span>
            <div className="flex flex-col gap-4 pl-1">
              {studentPages.map((p) => (
                <Link
                  key={p.to}
                  href={p.to}
                  className="font-serif text-2xl font-bold text-left text-[#1A1A1A] hover:text-[#14532D] transition-colors"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/tu-van"
            className="font-serif text-3xl font-bold text-left text-[#1A1A1A] hover:text-[#14532D] transition-colors cursor-pointer"
          >
            Liên Hệ
          </Link>
        </div>

        <div className="flex flex-col gap-6 pt-8" id="mobile-menu-footer">
          <AccountMenu compact />
          <Link
            href="/gioi-thieu"
            className="w-full py-4 bg-[#9FE870] text-[#14532D] hover:bg-[#86D65A] font-bold text-center rounded-xl flex items-center justify-center gap-2 text-sm tracking-wider uppercase shadow-lg transition-colors"
            id="mobile-cta"
          >
            Về Cô Thương
            <ArrowRight size={16} />
          </Link>

          <div className="text-center">
            <p className="font-mono text-xs text-[#1A1A1A]/40">
              © 2026 Hồ Ngọc Thương. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
