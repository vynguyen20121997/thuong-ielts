"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  addHighlight,
  emptyAnnotations,
  removeHighlightAt,
  toggleBookmark,
  type Annotations,
} from "../domain/annotations";

/**
 * Highlights and bookmarks for one attempt, kept in sessionStorage so a reload
 * does not throw away the student's markings along with their answers.
 *
 * The hard part is turning a browser Selection into character offsets. A
 * selection reports a node and an offset inside that node; a paragraph is
 * usually several text nodes once part of it is already highlighted. Walking
 * the block's text nodes and summing their lengths converts one to the other,
 * and keeps the stored range valid no matter how the block is later split.
 */

export interface PendingSelection {
  blockId: string;
  start: number;
  end: number;
  /** Viewport position to anchor the popup to. */
  x: number;
  y: number;
  /** Set when the click landed on an existing highlight instead. */
  existingOffset?: number;
}

const storageKey = (slug: string) => `annotations:${slug}`;

function read(slug: string): Annotations {
  if (typeof window === "undefined") return emptyAnnotations;
  try {
    const raw = window.sessionStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as Annotations) : emptyAnnotations;
  } catch {
    return emptyAnnotations;
  }
}

/** Absolute character offset of (node, offset) within `root`'s text. */
function offsetWithin(root: Node, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) return total + offset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total;
}

export function useAnnotations(slug: string) {
  const [annotations, setAnnotations] = useState<Annotations>(emptyAnnotations);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const loaded = useRef(false);

  // Read once on mount: sessionStorage is not available during SSR.
  useEffect(() => {
    setAnnotations(read(slug));
    loaded.current = true;
  }, [slug]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.sessionStorage.setItem(storageKey(slug), JSON.stringify(annotations));
    } catch {
      /* private mode: marks stay for this screen only */
    }
  }, [annotations, slug]);

  /**
   * Reads the current selection and works out which annotatable block it sits
   * in. A selection spanning two blocks is ignored rather than half-applied.
   */
  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setPending(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const block = (range.startContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>(
      "[data-block-id]"
    );
    const endBlock = (range.endContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>(
      "[data-block-id]"
    );
    if (!block || block !== endBlock) {
      setPending(null);
      return;
    }

    const start = offsetWithin(block, range.startContainer, range.startOffset);
    const end = offsetWithin(block, range.endContainer, range.endOffset);
    if (end <= start) {
      setPending(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setPending({
      blockId: block.dataset.blockId!,
      start,
      end,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setPending(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const highlightSelection = useCallback(() => {
    if (!pending) return;
    setAnnotations((prev) =>
      addHighlight(prev, { blockId: pending.blockId, start: pending.start, end: pending.end })
    );
    clearSelection();
  }, [pending, clearSelection]);

  /** Called when the student clicks an existing highlight. */
  const removeHighlight = useCallback((blockId: string, offset: number) => {
    setAnnotations((prev) => removeHighlightAt(prev, blockId, offset));
  }, []);

  const toggleQuestionBookmark = useCallback((number: number) => {
    setAnnotations((prev) => toggleBookmark(prev, number));
  }, []);

  const reset = useCallback(() => {
    setAnnotations(emptyAnnotations);
    try {
      window.sessionStorage.removeItem(storageKey(slug));
    } catch {
      /* nothing worth failing over */
    }
  }, [slug]);

  return {
    annotations,
    pending,
    captureSelection,
    clearSelection,
    highlightSelection,
    removeHighlight,
    toggleQuestionBookmark,
    reset,
  };
}
