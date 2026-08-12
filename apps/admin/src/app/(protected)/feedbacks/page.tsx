"use client";

import { useEffect, useState } from "react";
import { FeedbackItem } from "@thuong-ielts/db";

function EditForm({
  item,
  onSaved,
  onCancel,
}: {
  item: FeedbackItem;
  onSaved: (updated: FeedbackItem) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState(item.subject);
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/feedbacks/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, imageUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Lưu thất bại");
      setIsSaving(false);
      return;
    }

    onSaved({ ...item, subject, imageUrl });
    setIsSaving(false);
  };

  return (
    <div className="border-t border-black/10 pt-4 mt-4 space-y-3">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
          Tiêu đề (hiển thị trên carousel)
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
          Ảnh chụp cảm nhận (URL)
        </label>
        <textarea
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm font-mono focus:border-[#14532D] focus:outline-none"
        />
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Xem trước" className="mt-2 max-h-40 rounded-lg border border-black/10" />
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 bg-[#14532D] hover:bg-[#052E16] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 border border-black/10 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

export default function AdminFeedbacksPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/feedbacks")
      .then((res) => res.json())
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa feedback này? Không thể hoàn tác.")) return;
    const res = await fetch(`/api/admin/feedbacks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mb-2">Cảm nhận học viên</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">
        Chỉnh sửa text và ảnh hiển thị trên carousel "Học Viên Nói Gì Về Cô Thương" ở trang chủ.
      </p>

      {isLoading ? (
        <p className="text-sm text-[#1A1A1A]/50">Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-black/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">{item.subject}</h3>
                  <p className="text-xs text-[#1A1A1A]/50">{item.date}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                    className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-black/10 hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    {editingId === item.id ? "Đóng" : "Sửa"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {editingId === item.id && (
                <EditForm
                  item={item}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setItems((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                    setEditingId(null);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
