import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ["/admin/:path*", "/play/:path*", "/manager/:path*"],
};
