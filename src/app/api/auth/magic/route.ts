import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const { ok } = await rateLimit(`magic:${getIp(req)}`, { max: 20, windowMs: 15 * 60 * 1000 });
  if (!ok) {
    return NextResponse.redirect(new URL("/login?error=tooManyRequests", req.url));
  }

  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  const user = await prisma.user.findUnique({ where: { loginToken: token } });

  if (
    !user ||
    !user.loginTokenExpiry ||
    user.loginTokenExpiry < new Date()
  ) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  // Token verbruikt — direct wissen
  await prisma.user.update({
    where: { id: user.id },
    data: { loginToken: null, loginTokenExpiry: null },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managedTeam: user.managedTeam,
    isParticipant: user.isParticipant,
  });

  // Als wachtwoord moet worden ingesteld, stuur door
  if (user.mustChangePassword) {
    return NextResponse.redirect(new URL("/auth/set-password", req.url));
  }

  return NextResponse.redirect(new URL("/", req.url));
}
