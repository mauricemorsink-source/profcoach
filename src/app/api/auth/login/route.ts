import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, rememberMe = true } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email en wachtwoord zijn verplicht" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Onbekend e-mailadres of verkeerd wachtwoord" }, { status: 401 });
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Onbekend e-mailadres of verkeerd wachtwoord" }, { status: 401 });
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managedTeam: user.managedTeam,
      isParticipant: user.isParticipant ?? true,
    }, rememberMe);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Er is een serverfout opgetreden" }, { status: 500 });
  }
}
