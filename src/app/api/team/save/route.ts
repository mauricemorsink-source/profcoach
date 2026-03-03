import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const teamInclude = {
  formation: true,
  players: {
    include: { player: true },
    orderBy: { slotIndex: "asc" as const },
  },
};

export async function POST(req: Request) {
  const body = await req.json();
  const { teamEntryId, formationId, slots, captainSlot } = body as {
    teamEntryId: string;
    formationId: string;
    slots: (string | null)[];
    captainSlot?: number | null;
  };

  if (!Array.isArray(slots) || slots.length !== 11) {
    return NextResponse.json({ error: "slots moet lengte 11 hebben" }, { status: 400 });
  }

  const team = await prisma.teamEntry.findUnique({ where: { id: teamEntryId } });
  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
  if (team.locked) return NextResponse.json({ error: "Team is gelockt" }, { status: 400 });

  // Controleer deadline
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.deadline && new Date() > new Date(settings.deadline)) {
    return NextResponse.json({ error: "De deadline is verstreken" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.teamEntryPlayer.deleteMany({ where: { teamEntryId } }),
    prisma.teamEntry.update({
      where: { id: teamEntryId },
      data: {
        formationId,
        captainSlot: captainSlot !== undefined ? captainSlot : null,
      },
    }),
    prisma.teamEntryPlayer.createMany({
      data: slots
        .map((playerId, slotIndex) => ({ teamEntryId, playerId: playerId!, slotIndex }))
        .filter((s) => s.playerId != null),
    }),
  ]);

  const updated = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: teamInclude,
  });

  return NextResponse.json({ team: updated });
}
