/**
 * Shared parsing for the IELTS practice documents.
 *
 * The reading and listening papers come from the same teacher in the same
 * house style, so the question/answer extraction is identical; only what
 * surrounds the questions differs (a passage vs a set of recordings). Keeping
 * one copy means a fix like "strip the marking notes out of the answer" lands
 * for both skills instead of only the one that happened to hit the bug.
 */
// ── Spec shape ────────────────────────────────────────────────────────────
export interface LineRange {
  from: number;
  to: number;
}

export interface OptionSetSpec extends LineRange {
  /** true when one line holds several options ("A  foo   B  bar"). */
  inline?: boolean;
  /**
   * Corrects an option whose text is mangled in the source document, keyed by
   * its marker. Used sparingly and listed in the run output so a silent
   * rewrite of exam content is impossible.
   */
  patch?: Record<string, string>;
}
// ── Google Docs ───────────────────────────────────────────────────────────
/** Google's export endpoint drops connections often enough to need retries. */
export async function fetchDocLines(docId: string, attempt = 1): Promise<string[]> {
  try {
    const res = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text.replace(/﻿/g, "").split(/\r?\n/);
  } catch (err) {
    if (attempt >= 4) throw new Error(`Cannot export doc ${docId}: ${(err as Error).message}`);
    const wait = attempt * 1500;
    console.log(`    … tải lại doc ${docId} (lần ${attempt + 1}) sau ${wait}ms`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchDocLines(docId, attempt + 1);
  }
}

/** 1-based, inclusive, matching what a human reads off the document. */
export function slice(lines: string[], range: LineRange): string[] {
  return lines.slice(range.from - 1, range.to);
}

// ── Passage ───────────────────────────────────────────────────────────────
export interface Paragraph {
  label?: string;
  text: string;
}

export function extractParagraphs(lines: string[], range: LineRange & { labelled?: boolean }): Paragraph[] {
  const block = slice(lines, range).map((l) => l.trim());
  const paragraphs: Paragraph[] = [];

  // Horizontal rules used as separators are layout, not prose.
  const isRule = (line: string) => /^[—–\-_=*]+$/.test(line);

  if (!range.labelled) {
    for (const line of block) if (line && !isRule(line)) paragraphs.push({ text: line });
    return paragraphs;
  }

  // Labelled passages put the marker on its own line: "A" then the paragraph.
  let pending: string | undefined;
  for (const line of block) {
    if (!line || isRule(line)) continue;
    if (/^[A-Z]$/.test(line)) {
      pending = line;
      continue;
    }
    paragraphs.push(pending ? { label: pending, text: line } : { text: line });
    pending = undefined;
  }
  return paragraphs;
}

// ── Questions ─────────────────────────────────────────────────────────────
/**
 * A table cell like "19 Oct" is shaped exactly like a question line. Accepting
 * it is worse than missing it: the scan below is monotonic, so one bogus high
 * number silently swallows every real question after it (Cam 17 T2 lost
 * questions 11-30 this way). No IELTS prompt is a bare date, so drop them.
 */
const DATE_ROW =
  /^\s*\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*$/i;

/**
 * Indexes "12   Some question text" lines by their number. The scan is
 * monotonic — a number is only accepted at or after the previously found one —
 * so a stray figure inside the passage cannot masquerade as a question.
 */
export function indexQuestionLines(lines: string[]): Map<number, string> {
  const found = new Map<number, string>();
  let lastFound = 0;

  lines.forEach((line) => {
    if (DATE_ROW.test(line)) return;
    const m = line.match(/^\s*(\d{1,2})[\s.)]\s*(\S.*)$/);
    if (!m) return;
    const n = Number(m[1]);
    if (n < lastFound || n > 40 || found.has(n)) return;
    found.set(n, m[2].trim());
    lastFound = n;
  });

  return found;
}

export function extractOptions(lines: string[], spec: OptionSetSpec, label: string): string[] {
  const block = slice(lines, spec).map((l) => l.trim()).filter(Boolean);

  let options: string[];
  if (!spec.inline) {
    options = block.map(normaliseOption);
  } else {
    // "A   institution      B   mass production" -> two options.
    options = [];
    for (const line of block) {
      const parts = line.split(/\s{2,}(?=[A-L]\s)/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) options.push(normaliseOption(part));
    }
  }

  for (const [token, text] of Object.entries(spec.patch ?? {})) {
    const index = options.findIndex((o) => optionToken(o).toLowerCase() === token.toLowerCase());
    if (index === -1) throw new Error(`${label}: patch target "${token}" not found`);
    console.log(`    ! sửa lỗi doc gốc — ${label} [${token}]: "${options[index]}" -> "${token}. ${text}"`);
    options[index] = `${token}. ${text}`;
  }

  return options;
}

/** "iv     The time and place" -> "iv. The time and place" */
export function normaliseOption(raw: string): string {
  const m = raw.match(/^([A-Za-z]{1,5}|[ivx]{1,5})[.)]?\s+(\S.*)$/);
  if (!m) return raw.trim().replace(/\s{2,}/g, " ");
  return `${m[1]}. ${m[2].trim().replace(/\s{2,}/g, " ")}`;
}

/** The leading marker of an option: "iv. The time..." -> "iv" */
export function optionToken(option: string): string {
  const m = option.match(/^([A-Za-z]{1,5})[.)]\s/);
  return m ? m[1] : "";
}

/**
 * Finds the sentence holding gap `n` inside a summary block, so a
 * summary-completion question shows real context instead of a bare number.
 */
export function sentenceForGap(lines: string[], range: LineRange, n: number): string {
  const marker = new RegExp(`\\b${n}\\s*[…\\.]`);
  const block = slice(lines, range)
    .map((l) => l.trim().replace(/^[●•·\-–—*]\s*/, ""))
    .filter(Boolean);

  // Notes are one gap per bullet line; summaries are paragraphs holding
  // several. Narrow to the line first, then to the sentence inside it.
  const line = block.find((l) => marker.test(l)) ?? block.join(" ");
  const sentences = line.split(/(?<=[.?!])\s+(?=[A-Z])/);
  const hit = sentences.find((s) => marker.test(s));
  return (hit ?? line).replace(/\s{2,}/g, " ").trim();
}

// ── Answer key ────────────────────────────────────────────────────────────
export interface RawAnswer {
  answer: string;
  explanation: string;
}

/**
 * Parses "7. NOT GIVEN" followed by everything up to the next numbered answer.
 * The explanation is kept whole — every line of the teacher's commentary.
 */
export function parseAnswerKey(lines: string[]): Map<number, RawAnswer> {
  const answers = new Map<number, RawAnswer>();
  const starts: { n: number; answer: string; line: number }[] = [];
  /** Every numbered line, including duplicates we skip — these bound explanations. */
  const allMarkers: number[] = [];
  let lastFound = 0;

  lines.forEach((line, i) => {
    // Books differ: "7. NOT GIVEN" (Cam 10-15), "7   NOT GIVEN" (Cam 16+), and
    // occasionally "21 city" with a single space. The single-space form is only
    // trusted for short remainders — otherwise a sentence inside an explanation
    // that happens to start with a number would be read as the next answer.
    const m = line.match(/^\s*(\d{1,2})(\.\s*|\s{2,}|\s)(\S.*)$/);
    if (!m) return;
    const n = Number(m[1]);
    const isTerse = m[2] !== " " || m[3].length <= 40;
    if (!isTerse || n < lastFound || n > 40) return;
    allMarkers.push(i);
    if (answers.has(n)) {
      // A block duplicated in the source document. Keep the first copy and let
      // it end here, so the duplicate is not appended to its own explanation.
      console.log(`    ! doc gốc lặp câu ${n} — bỏ qua bản trùng ở dòng ${i + 1}`);
      return;
    }
    answers.set(n, { answer: "", explanation: "" });
    starts.push({ n, answer: m[3].trim(), line: i });
    lastFound = n;
  });

  // Section headers sit between the last answer of one passage and the first of
  // the next, so a naive slice hands the last question of every passage an
  // "explanation" reading "READING PASSAGE 2". Drop those lines; if nothing of
  // substance is left, the question simply has no explanation.
  // "PASSAGE 2", and the several ways these documents misspell it
  // ("PASSAGGE", "PASSGAGE"), plus the book banner.
  const isHeader = (line: string) =>
    /^(cambridge\s*\d*\s*[-–—]?\s*reading\s*$|(reading\s+)?pass?[ag]{2,4}e?\s*\d+\s*$)/i.test(
      line.trim()
    );

  /**
   * "23&24   C, D" — the key for a paired "Choose TWO letters" question. Those
   * questions are not imported, so without this the answers would be swept into
   * the previous question's explanation and shown to the student.
   */
  const isPairedAnswerRow = (line: string) => /^\s*\d{1,2}\s*&\s*\d{1,2}\b/.test(line);

  starts.forEach((start) => {
    const next = allMarkers.find((line) => line > start.line);
    const end = next ?? lines.length;
    const explanation = lines
      .slice(start.line + 1, end)
      .map((l) => l.replace(/\s+$/, "").replace(/^\t+/, "").trim())
      .filter((l) => !isHeader(l) && !isPairedAnswerRow(l))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    answers.set(start.n, {
      answer: start.answer,
      explanation: explanation.length < 15 ? "" : explanation,
    });
  });

  return answers;
}

/**
 * Answer keys write alternatives inline: "urban centers/centres",
 * "(stacked) trays", "sun(light)". Stored verbatim, a student who types the
 * correct word is marked wrong — the grader would be comparing their answer
 * against the editorial notation rather than against an answer.
 *
 * This expands the notation into every form the key actually permits. The
 * fullest form becomes the displayed answer; the rest are accepted silently.
 */
/**
 * Answer keys interleave marking instructions with the answer itself:
 * "IN EITHER ORDER (BOTH REQUIRED FOR ONE MARK) leaves (and) bark". Left in,
 * the student is graded against the instruction text and can never be right.
 */
export function stripMarkingNotes(raw: string): string {
  return raw
    .replace(/\bIN\s+(EITHER|ANY)\s+ORDER\b/gi, " ")
    .replace(/\bBOTH\s+REQUIRED\s+FOR\s+ONE\s+MARK\b/gi, " ")
    .replace(/\bALL\s+REQUIRED\s+FOR\s+ONE\s+MARK\b/gi, " ")
    .replace(/\bBOTH\s+ANSWERS\s+REQUIRED\b/gi, " ")
    .replace(/\(\s*\)/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function expandGapAnswer(input: string): { answer: string; acceptable: string[] } {
  const raw = stripMarkingNotes(input);
  // "car (-) sharing" expands to a stranded hyphen; rejoin it so the displayed
  // answer reads "car-sharing" rather than "car - sharing".
  const tidy = (s: string) =>
    s.replace(/\s+([-–—])\s+/g, "$1").replace(/\s{2,}/g, " ").trim();

  // Books space the separator differently: "contact/meetings" vs
  // "flavour / flavor". Normalise before splitting.
  //
  // An optional suffix is sometimes written detached — "port (s)", "vacation
  // (s)". Left alone it expands to the nonsense "port s", so reattach it first.
  // Only a genuine suffix is reattached — "s", "es", "'s". Matching anything
  // short would swallow real words: "hundred (and) fifteen" must not collapse
  // into "hundredand fifteen".
  let variants = [
    raw.replace(/\s*\/\s*/g, "/").replace(/(\w)\s+\((s|es|'s|’s)\)/gi, "$1($2)"),
  ];
  for (let guard = 0; guard < 4; guard++) {
    const next: string[] = [];
    let expanded = false;
    for (const v of variants) {
      const m = v.match(/\(([^()]*)\)/);
      if (!m) {
        next.push(v);
        continue;
      }
      expanded = true;
      next.push(v.replace(m[0], m[1]), v.replace(m[0], ""));
    }
    variants = next;
    if (!expanded) break;
  }

  // "centers/centres" -> both spellings, in place.
  for (let guard = 0; guard < 4; guard++) {
    const next: string[] = [];
    let expanded = false;
    for (const v of variants) {
      const m = v.match(/(\S*[^\s/])\/([^\s/]\S*)/);
      if (!m) {
        next.push(v);
        continue;
      }
      expanded = true;
      next.push(v.replace(m[0], m[1]), v.replace(m[0], m[2]));
    }
    variants = next;
    if (!expanded) break;
  }

  // "mustard plant(s) / mustard" expands to a stray "mustard mustard"; a word
  // repeated back-to-back is always an artefact of the expansion, never an answer.
  const sane = (s: string) => !/\b(\w+)\s+\1\b/i.test(s);

  const cleaned = [...new Set(variants.map(tidy).filter(Boolean))].filter(sane);
  return { answer: cleaned[0] ?? tidy(raw), acceptable: cleaned.slice(1) };
}

/**
 * Explanations from these teachers restate the question on a "Question:" line.
 * When that restatement is about a completely different question, the block was
 * pasted in from another test — it happens — and showing it to a student is
 * worse than showing nothing. Only judged when the prompt is long enough for the
 * comparison to mean something.
 */
export function explanationMatchesQuestion(explanation: string, prompt: string): boolean {
  const restated = explanation.match(/^Question:\s*(.+)$/m)?.[1];
  if (!restated) return true;

  const words = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);

  const theirs = words(restated);
  const ours = new Set(words(prompt));
  if (theirs.length < 4 || ours.size < 4) return true;

  const overlap = theirs.filter((w) => ours.has(w)).length / theirs.length;
  return overlap >= 0.3;
}
