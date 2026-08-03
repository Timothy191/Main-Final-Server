import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const startedAt = Date.now();
  const degraded = false;

  return NextResponse.json(
    {
      status: degraded ? "degraded" : "healthy",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: degraded ? 503 : 200 }
  );
}
