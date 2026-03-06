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
  const { teamEntryId } = await req.json();

  const team = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: teamInclude,
  });
  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });

  // Eigenaarscontrole: als het team al aan een gebruiker is gekoppeld, moet die ingelogd zijn
  if (team.userId !== null) {
    const session = await getSession();
    if (!session || session.userId !== team.userId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }
  }

  if (team.locked) return NextResponse.json({ team, alreadyLocked: true });

  // Controleer deadline
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.deadline && new Date() > new Date(settings.deadline)) {
    return NextResponse.json({ error: "De deadline is verstreken" }, { status: 403 });
  }

  const locked = await prisma.teamEntry.update({
    where: { id: teamEntryId },
    data: { locked: true },
    include: teamInclude,
  });

  return NextResponse.json({ team: locked });
}
