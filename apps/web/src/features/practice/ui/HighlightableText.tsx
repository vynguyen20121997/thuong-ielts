"use client";

import { Fragment } from "react";

import { segmentText, type Highlight } from "../domain/annotations";

/**
 * Renders a block of text with the student's highlights painted in.
 *
 * The highlights come from stored character ranges rather than from spans
 * written into the DOM, so they survive the re-render that happens on every
 * keystroke elsewhere on the page. `data-block-id` is what the selection
 * handler uses to work out which block was marked.
 */
export default function HighlightableText({
  blockId,
  text,
  highlights,
  onRemove,
  className,
}: {
  blockId: string;
  text: string;
  highlights: Highlight[];
  /** Clicking a highlight opens the popup over it, as on the exam site. */
  onRemove?: (blockId: string, offset: number, rect: DOMRect) => void;
  className?: string;
}) {
  const segments = segmentText(text, highlights);

  // Nothing marked: render the plain string so the common case adds no elements.
  if (segments.length === 1 && !segments[0].highlighted) {
    return (
      <span data-block-id={blockId} className={className}>
        {text}
      </span>
    );
  }

  let cursor = 0;

  return (
    <span data-block-id={blockId} className={className}>
      {segments.map((segment, index) => {
        const offset = cursor;
        cursor += segment.text.length;

        if (!segment.highlighted) return <Fragment key={index}>{segment.text}</Fragment>;

        return (
          <mark
            key={index}
            onClick={(e) => onRemove?.(blockId, offset, e.currentTarget.getBoundingClientRect())}
            title="Bấm để xoá tô màu"
            className="bg-[#FFF86B] text-[#222] rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.067)] cursor-pointer"
          >
            {segment.text}
          </mark>
        );
      })}
    </span>
  );
}
