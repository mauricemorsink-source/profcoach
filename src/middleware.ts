import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  // Cron routes: geen browser-Origin, eigen authenticatie via CRON_SECRET header
  if (req.nextUrl.pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  if (MUTATING_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    // Geen Origin header = server-to-server of same-origin form — toestaan
    if (origin !== null) {
      const host = req.headers.get("host");
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch {
        // Malformed Origin header
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
