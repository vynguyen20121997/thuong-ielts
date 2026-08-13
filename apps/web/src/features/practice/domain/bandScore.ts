/**
 * Raw score -> IELTS Academic Reading band.
 *
 * The official table is defined over a 40-question full test. Our exercises are
 * shorter (13-14 questions), so we project the score onto a 40-question scale
 * first. That makes the band an *estimate* — accurate enough to be motivating,
 * and labelled as an estimate everywhere it is shown.
 */

/** [minimum raw score out of 40, band]. Must stay sorted high -> low. */
const ACADEMIC_READING_TABLE: ReadonlyArray<readonly [number, number]> = [
  [39, 9.0],
  [37, 8.5],
  [35, 8.0],
  [33, 7.5],
  [30, 7.0],
  [27, 6.5],
  [23, 6.0],
  [19, 5.5],
  [15, 5.0],
  [13, 4.5],
  [10, 4.0],
  [8, 3.5],
  [6, 3.0],
  [4, 2.5],
];

export function bandFromScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  const scaled = Math.round((correct / total) * 40);
  for (const [minRaw, band] of ACADEMIC_READING_TABLE) {
    if (scaled >= minRaw) return band;
  }
  return 2.0;
}

/** "7.0", "8.5" — bands are always shown with one decimal. */
export function formatBand(band: number): string {
  return band.toFixed(1);
}
