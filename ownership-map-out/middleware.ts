import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/battle/internal/finalize-room")) {
    return NextResponse.json(
      { error: "finalize-room temporarily disabled" },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/battle/internal/finalize-room"],
};