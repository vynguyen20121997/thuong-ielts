"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";

type ZoomableImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export default function ZoomableImage({ src, alt, className = "", loading = "lazy" }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group/zoom relative block w-full cursor-zoom-in overflow-hidden rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        aria-label={`Phóng to ảnh: ${alt}`}
      >
        <img src={src} alt={alt} loading={loading} className={className} />
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand opacity-0 shadow-sm transition-opacity group-hover/zoom:opacity-100 group-focus-visible/zoom:opacity-100">
          <Maximize2 size={17} aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onMouseDown={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-deep/85 p-4 backdrop-blur-sm md:p-8"
        >
          <div className="relative flex max-h-full max-w-full items-center justify-center" onMouseDown={(event) => event.stopPropagation()}>
            <img src={src} alt={alt} className="max-h-[88vh] max-w-[92vw] rounded-xl bg-white object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Đóng ảnh phóng to"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
