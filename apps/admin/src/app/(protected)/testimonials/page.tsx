"use client";

import { useEffect, useState } from "react";
import { ExtendedTestimonialItem } from "@thuong-ielts/db";

function EditForm({
  item,
  onSaved,
  onCancel,
}: {
  item: ExtendedTestimonialItem;
  onSaved: (updated: ExtendedTestimonialItem) => void;
  onCancel: () => void;
}) {
  const [studentName, setStudentName] = useState(item.studentName);
  const [score, setScore] = useState(item.score);
  const [schoolOrJob, setSchoolOrJob] = useState(item.schoolOrJob);
  const [comment, setComment] = useState(item.comment ?? "");
  const [avatarUrl, setAvatarUrl] = useState(item.avatarUrl);
  const [proofUrlsText, setProofUrlsText] = useState((item.proofUrl ?? []).join("\n"));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const proofUrl = proofUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName, score, schoolOrJob, comment, avatarUrl, proofUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Lưu thất bại");
      setIsSaving(false);
      return;
    }

    onSaved({ ...item, studentName, score, schoolOrJob, comment, avatarUrl, proofUrl });
    setIsSaving(false);
  };

  return (
    <div className="border-t border-black/10 pt-4 mt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
            Tên học viên
          </label>
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
            Điểm số
          </label>
          <input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
          Trường / công việc
        </label>
        <input
          value={schoolOrJob}
          onChange={(e) => setSchoolOrJob(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
          Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
          Ảnh avatar (URL)
        </label>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[#14532D] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50 mb-1">
          Ảnh bảng điểm (mỗi URL 1 dòng, hiển thị trên carousel)
        </label>
        <textarea
          value={proofUrlsText}
          onChange={(e) => setProofUrlsText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm font-mono focus:border-[#14532D] focus:outline-none"
        />
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

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<ExtendedTestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => {
        if (!res.ok) throw new Error(`/api/testimonials returned ${res.status}`);
        return res.json();
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load testimonials:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa testimonial này? Không thể hoàn tác.")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-black text-[#1A1A1A] mb-2">Kết quả học viên</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">
        Chỉnh sửa text và ảnh hiển thị trên carousel "Góc Vinh Danh Học Viên" ở trang chủ.
      </p>

      {isLoading ? (
        <p className="text-sm text-[#1A1A1A]/50">Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-black/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">{item.studentName}</h3>
                  <p className="text-xs text-[#1A1A1A]/50">{item.schoolOrJob} &middot; {item.score} &middot; {item.date}</p>
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
                    setItems((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
