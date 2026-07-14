import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

interface HeaderProps {
  onScrollTo: (sectionId: string) => void;
}

export default function Header({ onScrollTo }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Giới Thiệu", id: "about" },
    { label: "Thành Tích", id: "stats" },
    { label: "Khóa Học", id: "courses" },
    { label: "Cảm Nhận", id: "testimonials" },
    { label: "Tư Vấn", id: "contact" },
  ];

  const handleNavClick = (id: string) => {
    onScrollTo(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="header-nav"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "py-4 bg-white/95 backdrop-blur-md border-b border-black/5 shadow-[0_4px_30px_rgba(26,26,26,0.03)]"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Text Logo */}
        <button
          onClick={() => handleNavClick("hero")}
          className="group flex items-center cursor-pointer text-left animate-fade-in"
          id="logo-button"
        >
          {/* Reference Image Styled Square Logo */}
          <div className="w-10 h-10 border-2 border-[#14532D] flex items-center justify-center font-bold text-xl text-[#14532D] font-serif mr-3 transition-colors duration-300 group-hover:bg-[#14532D] group-hover:text-white rounded">
            H
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg md:text-xl font-black tracking-tight text-[#1A1A1A]">
              HNT<span className="text-[#14532D]">.</span>IELTS
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#1A1A1A]/60 uppercase transition-all duration-300 group-hover:text-[#14532D] font-bold">
              Hồ Ngọc Thương
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12" id="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative py-2 text-sm font-semibold text-[#1A1A1A]/70 hover:text-[#14532D] transition-colors cursor-pointer group animate-fade-in"
              id={`nav-link-${item.id}`}
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#14532D] transition-all duration-300 ease-out group-hover:w-full" />
            </button>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:block" id="header-action-container">
          <button
            onClick={() => handleNavClick("contact")}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-[#9FE870] text-[#14532D] rounded-full text-xs font-bold uppercase tracking-wider overflow-hidden shadow-md transition-all duration-300 hover:bg-[#86D65A] cursor-pointer"
            id="header-cta"
          >
            <span className="relative z-10 flex items-center gap-2">
              Đăng ký học
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[#1A1A1A] hover:text-[#14532D] transition-colors cursor-pointer"
          aria-label="Toggle Menu"
          id="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 top-[68px] bg-white z-40 md:hidden flex flex-col justify-between px-8 py-12 transition-all duration-500 ease-in-out border-t border-black/5 ${
          isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        }`}
        id="mobile-menu-drawer"
      >
        <div className="flex flex-col gap-8">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="font-serif text-3xl font-bold text-left text-[#1A1A1A] hover:text-[#14532D] transition-colors focus:outline-none cursor-pointer"
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
              id={`mobile-link-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6" id="mobile-menu-footer">
          <button
            onClick={() => handleNavClick("contact")}
            className="w-full py-4 bg-[#9FE870] text-[#14532D] hover:bg-[#86D65A] font-bold text-center rounded-xl flex items-center justify-center gap-2 text-sm tracking-wider uppercase shadow-lg transition-colors"
            id="mobile-cta"
          >
            Đăng ký học ngay
            <ArrowRight size={16} />
          </button>
          
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
