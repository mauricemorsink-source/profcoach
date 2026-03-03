import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const teamInclude = {
  formation: true,
  players: {
    include: { player: true },
    orderBy: { slotIndex: "asc" as const },
  },
};

export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json().catch(() => ({}));
  const { draftId } = body as { draftId?: string };

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  // Als ingelogd: zoek op userId + seizoen
  if (session) {
    const existing = await prisma.teamEntry.findFirst({
      where: { userId: session.userId, seasonId: season.id },
      include: teamInclude,
    });
    if (existing) return NextResponse.json({ team: existing, isNew: false });
  } else if (draftId) {
    // Niet ingelogd: zoek op draftId uit localStorage
    const existing = await prisma.teamEntry.findUnique({
      where: { id: draftId },
      include: teamInclude,
    });
    if (existing) return NextResponse.json({ team: existing, isNew: false });
  }

  const formation = await prisma.formation.findFirst({ orderBy: { code: "asc" } });
  if (!formation) return NextResponse.json({ error: "Geen formaties" }, { status: 400 });

  const team = await prisma.teamEntry.create({
    data: {
      seasonId: season.id,
      formationId: formation.id,
      ...(session && { userId: session.userId }),
    },
    include: teamInclude,
  });

  return NextResponse.json({ team, isNew: true });
}
