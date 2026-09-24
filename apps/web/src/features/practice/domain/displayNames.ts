/** Public-facing naming. Stable slugs and database values remain unchanged. */
export function practiceDisplayName(value: string): string {
  return value
    .replace(/^Cambridge IELTS\s+(\d+)/i, "Key Practice $1")
    .replace(/^Cam\s+(\d+)/i, "Key Practice $1");
}
