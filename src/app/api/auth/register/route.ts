import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const { ok, retryAfterSec } = await rateLimit(`register:${getIp(req)}`, { max: 5, windowMs: 60 * 60 * 1000 });
  if (!ok) {
    return NextResponse.json({ error: "Te veel registratiepogingen. Probeer het later opnieuw." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    });
  }

  const body = await req.json();
  const { email, password, name } = body;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Naam, email en wachtwoord zijn verplicht" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Wachtwoord moet minimaal 8 tekens bevatten" }, { status: 400 });
  }

  // Check of registratie open is
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings && !settings.registrationOpen) {
    return NextResponse.json({ error: "Registratie is momenteel gesloten" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Dit e-mailadres is al geregistreerd" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: await hashPassword(password),
      name: name?.trim() || null,
      role: "USER",
    },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isParticipant: true,
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
}
