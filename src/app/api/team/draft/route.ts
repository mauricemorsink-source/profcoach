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

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const pastDeadline = settings?.deadline ? new Date() > new Date(settings.deadline) : false;

  async function maybeAutoLock(teamId: string, currentlyLocked: boolean): Promise<boolean> {
    if (pastDeadline && !currentlyLocked) {
      await prisma.teamEntry.update({ where: { id: teamId }, data: { locked: true } });
      return true;
    }
    return currentlyLocked;
  }

  // Als ingelogd: zoek op userId + seizoen
  if (session) {
    const existing = await prisma.teamEntry.findFirst({
      where: { userId: session.userId, seasonId: season.id },
      include: teamInclude,
    });
    if (existing) {
      const locked = await maybeAutoLock(existing.id, existing.locked);
      return NextResponse.json({ team: { ...existing, locked }, isNew: false, captainEnabled: settings?.captainEnabled ?? false });
    }

    // Geen team gevonden op userId — kijk of er een anoniem concept is om te claimen
    if (draftId) {
      const draft = await prisma.teamEntry.findUnique({
        where: { id: draftId },
        include: teamInclude,
      });
      if (draft && draft.userId === null && draft.seasonId === season.id) {
        const claimed = await prisma.teamEntry.update({
          where: { id: draftId },
          data: { userId: session.userId },
          include: teamInclude,
        });
        const locked = await maybeAutoLock(claimed.id, claimed.locked);
        return NextResponse.json({ team: { ...claimed, locked }, isNew: false, captainEnabled: settings?.captainEnabled ?? false });
      }
    }
  } else if (draftId) {
    const existing = await prisma.teamEntry.findUnique({
      where: { id: draftId },
      include: teamInclude,
    });
    if (existing) {
      const locked = await maybeAutoLock(existing.id, existing.locked);
      return NextResponse.json({ team: { ...existing, locked }, isNew: false, captainEnabled: settings?.captainEnabled ?? false });
    }
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

  return NextResponse.json({ team, isNew: true, captainEnabled: settings?.captainEnabled ?? false });
}
