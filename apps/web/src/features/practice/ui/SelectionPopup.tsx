"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, Highlighter, Trash2 } from "lucide-react";

import type { PendingSelection } from "../application/useAnnotations";

/**
 * The little menu that appears over a text selection, as on the exam site:
 * white card, soft shadow, one row of actions.
 *
 * Portalled to <body> so it is never clipped by the passage's own scroll
 * container, and positioned from the selection's viewport rectangle.
 */
export default function SelectionPopup({
  selection,
  onHighlight,
  onRemove,
  onRemoveAll,
  onBookmark,
  bookmarked,
}: {
  selection: PendingSelection | null;
  onHighlight: () => void;
  onRemove: () => void;
  onRemoveAll: () => void;
  /** Absent when the selection does not belong to a question. */
  onBookmark?: () => void;
  bookmarked?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !selection) return null;

  return createPortal(
    <div
      className="fixed z-[90] -translate-x-1/2 -translate-y-full flex items-center bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.13)] border border-black/5 overflow-hidden"
      style={{ left: selection.x, top: selection.y - 8 }}
      // Keep the browser selection alive: a mousedown elsewhere would drop it
      // before the click handler ever ran.
      onMouseDown={(e) => e.preventDefault()}
    >
      {selection.kind === "selection" ? (
        <button
          type="button"
          onClick={onHighlight}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAF9F6] cursor-pointer"
        >
          <Highlighter size={14} className="text-[#CA8A04]" />
          Tô màu
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAF9F6] cursor-pointer"
          >
            <Trash2 size={14} className="text-red-500" />
            Xoá
          </button>
          <button
            type="button"
            onClick={onRemoveAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1A1A1A]/70 hover:bg-[#FAF9F6] cursor-pointer border-l border-black/5"
          >
            Xoá tất cả
          </button>
        </>
      )}

      {selection.kind === "selection" && onBookmark && (
        <button
          type="button"
          onClick={onBookmark}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAF9F6] cursor-pointer border-l border-black/5"
        >
          <Bookmark
            size={14}
            className={bookmarked ? "text-[#FFC107] fill-[#FFC107]" : "text-[#1A1A1A]/50"}
          />
          {bookmarked ? "Bỏ đánh dấu" : "Đánh dấu"}
        </button>
      )}
    </div>,
    document.body,
  );
}
