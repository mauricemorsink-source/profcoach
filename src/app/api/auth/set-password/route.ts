import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { validatePassword } from "@/lib/passwordPolicy";

export async function POST(req: NextRequest) {
  const { ok, retryAfterSec } = await rateLimit(`set-password:${getIp(req)}`, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!ok) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het later opnieuw." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Wachtwoord is verplicht" }, { status: 400 });
  }
  const passwordError = await validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      password: hashPassword(password),
      mustChangePassword: false,
    },
  });

  // Sessie vernieuwen (zelfde payload, flag is nu weg)
  await setSessionCookie({ ...session });

  return NextResponse.json({ ok: true });
}
