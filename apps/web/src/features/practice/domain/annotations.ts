/**
 * Highlights and bookmarks a student leaves on a paper while working.
 *
 * A highlight is stored as a character range inside a named block of text, not
 * as a DOM node. That matters: the questions re-render on every keystroke, so
 * anything written straight into the DOM would be wiped the moment the student
 * typed. Offsets survive re-renders, serialise for the checkpoint, and can be
 * re-applied on a different screen size.
 */

export interface Highlight {
  /** Which block of text this belongs to — a paragraph index or question id. */
  blockId: string;
  /** Character offsets into that block's plain text. */
  start: number;
  end: number;
}

/** Everything a student marks up during one attempt. */
export interface Annotations {
  highlights: Highlight[];
  /** Question numbers flagged to come back to. */
  bookmarks: number[];
}

export const emptyAnnotations: Annotations = { highlights: [], bookmarks: [] };

/** One piece of a block after the highlights have been cut into it. */
export interface TextSegment {
  text: string;
  highlighted: boolean;
  /** Index into the block's highlight list, so a click can remove the right one. */
  highlightIndex?: number;
}

/**
 * Merges overlapping ranges. Two highlights that touch would otherwise render
 * as two adjacent spans, and removing one would leave a ragged edge.
 */
export function normalizeRanges(ranges: Highlight[]): Highlight[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: Highlight[] = [];

  for (const range of sorted) {
    const last = out[out.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      out.push({ ...range });
    }
  }

  return out;
}

/** Cuts `text` into plain and highlighted pieces, in order. */
export function segmentText(text: string, ranges: Highlight[]): TextSegment[] {
  const merged = normalizeRanges(
    ranges.filter((r) => r.start < r.end && r.start < text.length)
  );
  if (merged.length === 0) return [{ text, highlighted: false }];

  const segments: TextSegment[] = [];
  let cursor = 0;

  merged.forEach((range, index) => {
    const start = Math.max(0, range.start);
    const end = Math.min(text.length, range.end);
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true, highlightIndex: index });
    cursor = end;
  });

  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}

export function addHighlight(annotations: Annotations, highlight: Highlight): Annotations {
  if (highlight.start >= highlight.end) return annotations;
  return { ...annotations, highlights: [...annotations.highlights, highlight] };
}

/** Removes whichever highlight covers `offset` in `blockId`. */
export function removeHighlightAt(
  annotations: Annotations,
  blockId: string,
  offset: number
): Annotations {
  return {
    ...annotations,
    highlights: annotations.highlights.filter(
      (h) => !(h.blockId === blockId && offset >= h.start && offset < h.end)
    ),
  };
}

export function toggleBookmark(annotations: Annotations, number: number): Annotations {
  const has = annotations.bookmarks.includes(number);
  return {
    ...annotations,
    bookmarks: has
      ? annotations.bookmarks.filter((n) => n !== number)
      : [...annotations.bookmarks, number].sort((a, b) => a - b),
  };
}

export function highlightsFor(annotations: Annotations, blockId: string): Highlight[] {
  return annotations.highlights.filter((h) => h.blockId === blockId);
}
