/**
 * Debug helper: in ra nội dung một Google Doc kèm số dòng.
 * Số dòng này chính là toạ độ dùng trong spec import (from/to).
 *   npx tsx scripts/dump-doc.ts <docId> [from] [to]
 */
import { fetchDocLines } from "./lib/ielts-doc";

const [id, from, to] = process.argv.slice(2);
if (!id) {
  console.error("Cần docId");
  process.exit(1);
}

async function main() {
  const lines = await fetchDocLines(id);
  const start = from ? Number(from) : 1;
  const end = to ? Number(to) : lines.length;
  for (let i = start; i <= Math.min(end, lines.length); i += 1) {
    console.log(`${i}\t${lines[i - 1]}`);
  }
}

main();
