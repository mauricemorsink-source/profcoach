import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes: CSRF-achtige Origin-check op mutating requests
  if (pathname.startsWith("/api/")) {
    // Cron routes: geen browser-Origin, eigen authenticatie via CRON_SECRET header
    if (pathname.startsWith("/api/cron/")) {
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

  // Admin routes: vereisen ingelogde admin
  if (pathname.startsWith("/admin")) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=/admin", req.url));
    }
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Play route: vereist ingelogde gebruiker
  if (pathname.startsWith("/play")) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=/play", req.url));
    }
    return NextResponse.next();
  }

  // Manager route: vereist MANAGER of ADMIN rol
  if (pathname.startsWith("/manager")) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=/manager", req.url));
    }
    if (session.role !== "MANAGER" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/play/:path*", "/manager/:path*"],
};
