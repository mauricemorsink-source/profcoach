import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managedTeam: true,
      isParticipant: true,
      betaald: true,
      createdAt: true,
      teamEntries: {
        where: season ? { seasonId: season.id } : { id: "none" },
        include: {
          formation: true,
          players: {
            include: { player: true },
            orderBy: { slotIndex: "asc" },
          },
          prediction: {
            select: {
              totalYellowCards: true,
              totalGoals: true,
              topScorer: { select: { id: true, name: true } },
              assistKoning: { select: { id: true, name: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role, managedTeam } = body;

  if (!email?.trim()) return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
  if (!password?.trim()) return NextResponse.json({ error: "Wachtwoord is verplicht" }, { status: 400 });
  if (!["ADMIN", "MANAGER"].includes(role)) return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
  if (role === "MANAGER" && !managedTeam) return NextResponse.json({ error: "Elftal is verplicht voor manager" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "E-mailadres al in gebruik" }, { status: 400 });

  const user = await prisma.user.create({
    data: {
      name: name?.trim() || null,
      email: email.toLowerCase().trim(),
      password: hashPassword(password),
      role,
      managedTeam: role === "MANAGER" ? managedTeam : null,
      isParticipant: false,
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true, managedTeam: true },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen accounts opgegeven" }, { status: 400 });
  }

  const targetIds = ids.filter((id) => id !== session.userId);
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "Je kunt je eigen account niet verwijderen" }, { status: 400 });
  }

  const remainingAdmins = await prisma.user.count({
    where: { role: "ADMIN", id: { notIn: targetIds } },
  });
  if (remainingAdmins === 0) {
    return NextResponse.json({ error: "Er moet minstens één admin overblijven" }, { status: 400 });
  }

  const result = await prisma.user.deleteMany({ where: { id: { in: targetIds } } });

  return NextResponse.json({ deleted: result.count });
}
