import { NextResponse } from "next/server";

import { listListeningTests } from "../../../../features/practice/server/listeningRepository";

export async function GET() {
  const tests = await listListeningTests();
  return NextResponse.json(tests);
}
