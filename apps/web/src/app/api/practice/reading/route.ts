import { NextResponse } from "next/server";

import { listReadingTests } from "../../../../features/practice/server/readingRepository";

export async function GET() {
  const tests = await listReadingTests();
  return NextResponse.json(tests);
}
