"use client";

import { useEffect, useState } from "react";
import { HeroContent } from "@thuong-ielts/db";

const EMPTY: HeroContent = {
  portraitUrl: "",
  titleLine1: "",
  titleLine2: "",
  quote: "",
  bio: "",
  closingLine: "",
};

export default function AdminHeroPage() {
  const [content, setContent] = useState<HeroContent>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then(setContent)
      .finally(() => setIsLoading(false));
  }, []);

  const update = (field: keyof HeroContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContent((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const res = await fetch("/api/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Lưu thất bại");
    } else {
      setSaved(true);
    }
    setIsSaving(false);
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mb-2">Trang chủ — Hero</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">
        Chỉnh sửa ảnh và nội dung hiển thị ở khu vực Hero (đầu trang chủ).
      </p>

      {isLoading ? (
        <p className="text-sm text-[#1A1A1A]/50">Đang tải...</p>
      ) : (
        <div className="bg-white border border-black/10 rounded-2xl p-6 space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
              Ảnh chân dung (URL)
            </label>
            <input
              value={content.portraitUrl}
              onChange={update("portraitUrl")}
              placeholder="/images/ho-ngoc-thuong-portrait.png"
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm font-mono focus:border-[#14532D] focus:outline-none"
            />
            {content.portraitUrl && (
              <img
                src={content.portraitUrl}
                alt="Xem trước"
                className="mt-3 h-40 w-auto rounded-lg border border-black/10 object-contain bg-black/5"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
                Dòng tiêu đề 1
              </label>
              <input
                value={content.titleLine1}
                onChange={update("titleLine1")}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
                Dòng tiêu đề 2
              </label>
              <input
                value={content.titleLine2}
                onChange={update("titleLine2")}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
              Trích dẫn ngắn (in nghiêng, dưới tiêu đề)
            </label>
            <textarea
              value={content.quote}
              onChange={update("quote")}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
              Đoạn giới thiệu (bằng cấp, kinh nghiệm)
            </label>
            <textarea
              value={content.bio}
              onChange={update("bio")}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
              Câu kết
            </label>
            <textarea
              value={content.closingLine}
              onChange={update("closingLine")}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {saved && !error && <p className="text-xs text-[#14532D] font-semibold">Đã lưu.</p>}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-[#14532D] hover:bg-[#052E16] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      )}
    </div>
  );
}
