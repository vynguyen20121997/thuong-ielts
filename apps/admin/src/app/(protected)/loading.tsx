/**
 * Khung chờ cho mọi trang admin trong lúc server truy vấn DB.
 * Đặt ở `(protected)` nên AdminNav vẫn đứng yên, chỉ phần nội dung chờ.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Đang tải…</span>
      <div className="h-8 w-64 rounded-lg bg-black/10" />
      <div className="h-4 w-96 max-w-full rounded bg-black/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-black/5 bg-white" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 rounded-xl bg-black/5" />
        ))}
      </div>
    </div>
  );
}
