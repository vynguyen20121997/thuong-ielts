/**
 * Loading placeholders for the practice section.
 *
 * These pages read from Postgres on the server, so navigating to one leaves the
 * screen on the previous page until the query returns — on a cold connection
 * that reads as a dead click. A skeleton shaped like the real page turns that
 * wait into visible progress, and because it mirrors the final layout the
 * content does not jump when it arrives.
 *
 * Next.js renders these automatically via `loading.tsx`; nothing imports them
 * by hand.
 */

/** One shimmering block. `animate-pulse` is the only motion in the section. */
function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-black/[0.07] rounded animate-pulse ${className}`} />
  );
}

/** Header block shared by both catalog pages: breadcrumb, title, blurb. */
function CatalogHeader() {
  return (
    <>
      <Bar className="h-3 w-52 mb-6" />
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div className="max-w-2xl w-full">
          <Bar className="h-3 w-32 mb-4" />
          <Bar className="h-12 w-full max-w-xl mb-3" />
          <Bar className="h-12 w-2/3 mb-5" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-16 w-full lg:w-64 rounded-2xl" />
      </div>
      {/* Filter rows */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </>
  );
}

/** Grid of test cards, matching ReadingTestGroupCard / ListeningBookCard. */
export function CatalogSkeleton({ cards = 9 }: { cards?: number }) {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto gutter">
        <CatalogHeader />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm"
            >
              <Bar className="h-40 rounded-none" />
              <div className="p-5">
                <Bar className="h-4 w-20 mb-4 rounded-full" />
                <Bar className="h-5 w-full mb-2" />
                <Bar className="h-5 w-3/4 mb-4" />
                <Bar className="h-3 w-2/3 mb-6" />
                <div className="flex gap-4">
                  <Bar className="h-3 w-16" />
                  <Bar className="h-3 w-16" />
                  <Bar className="h-3 w-16 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * The listening exam opens on its instructions card, so that — not the paper —
 * is what the student is waiting for.
 */
export function ListeningTestSkeleton() {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-black/5 p-8 md:p-12">
          <Bar className="h-8 w-72 mx-auto mb-8" />
          <Bar className="h-5 w-56 mb-5" />
          <div className="space-y-3 mb-8">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-11/12" />
            <Bar className="h-4 w-4/5" />
            <Bar className="h-4 w-3/5" />
          </div>
          <div className="border-t border-black/10 pt-6 flex items-center justify-between">
            <Bar className="h-4 w-28" />
            <Bar className="h-11 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

/** The reading paper: passage on one side, questions on the other. */
export function ReadingTestSkeleton() {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto gutter">
        <div className="bg-white border border-black/5 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <Bar className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Bar className="h-3 w-32 mb-2" />
            <Bar className="h-4 w-64" />
          </div>
          <Bar className="h-9 w-24 rounded-full" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-black/5 rounded-2xl p-6 space-y-3">
            <Bar className="h-6 w-48 mb-5" />
            {Array.from({ length: 14 }).map((_, i) => (
              <Bar
                key={i}
                className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`}
              />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-black/5 rounded-2xl p-5"
              >
                <Bar className="h-4 w-full mb-3" />
                <Bar className="h-4 w-4/5 mb-4" />
                <Bar className="h-9 w-full max-w-sm rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Danh sách đề Writing.
 *
 * KHÔNG dùng lại `CatalogSkeleton`: trang Writing không có dãy nút lọc và thẻ
 * đề không có ảnh bìa, nên khung xương của Reading/Listening vẽ ra hai khối
 * không bao giờ xuất hiện — nội dung về là cả trang nhảy một nhịp, đúng thứ
 * skeleton sinh ra để tránh. Cùng một chất liệu (`Bar`, `animate-pulse`),
 * khác cái hình, vì hai trang thật vốn khác hình.
 */
export function WritingCatalogSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <main className="relative z-10 pt-28 md:pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto gutter">
        <Bar className="h-3 w-52 mb-6" />

        <div className="max-w-2xl mb-10">
          <Bar className="h-3 w-28 mb-4" />
          <Bar className="h-12 w-full max-w-md mb-3" />
          <Bar className="h-12 w-52 mb-5" />
          <Bar className="h-4 w-full mb-2" />
          <Bar className="h-4 w-11/12 mb-2" />
          <Bar className="h-4 w-3/4" />
        </div>

        {/* Hộp lưu ý "không chấm band" — nó nằm ngay trên lưới ở trang thật. */}
        <Bar className="h-20 w-full max-w-2xl rounded-xl mb-10" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-black/5 bg-white p-5"
            >
              <Bar className="h-6 w-24 rounded-full mb-4" />
              <Bar className="h-5 w-3/4 mb-3" />
              <Bar className="h-4 w-full mb-2" />
              <Bar className="h-4 w-full mb-2" />
              <Bar className="h-4 w-2/3 mb-5" />
              <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                <Bar className="h-3 w-28" />
                <Bar className="h-3 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
