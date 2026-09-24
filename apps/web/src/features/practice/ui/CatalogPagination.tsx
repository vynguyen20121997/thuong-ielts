import { ChevronLeft, ChevronRight } from "lucide-react";

export const TESTS_PER_PAGE = 20;

export default function CatalogPagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / TESTS_PER_PAGE);
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const visible = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => start + index,
  );
  return (
    <nav
      aria-label="Phân trang bài luyện"
      className="mt-9 flex items-center justify-center gap-2"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-ink/60 transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Trang trước"
      >
        <ChevronLeft size={17} />
      </button>
      {visible.map((number) => (
        <button
          type="button"
          key={number}
          onClick={() => onChange(number)}
          aria-current={page === number ? "page" : undefined}
          className={`h-10 min-w-10 rounded-xl px-3 text-xs font-bold transition-colors ${page === number ? "bg-brand text-white" : "border border-black/10 text-ink/60 hover:border-brand/40 hover:text-brand"}`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-ink/60 transition-colors hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Trang sau"
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
