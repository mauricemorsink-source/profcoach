import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamEntryId: string }> }
) {
  const { teamEntryId } = await params;

  const team = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: {
      formation: true,
      user: { select: { name: true, email: true } },
      players: {
        include: {
          player: { select: { id: true, name: true, shortName: true, position: true, clubTeam: true, value: true } },
        },
        orderBy: { slotIndex: "asc" },
      },
    },
  });

  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });

  return NextResponse.json({
    id: team.id,
    formation: team.formation,
    captainSlot: team.captainSlot,
    captainEnabled: settings?.captainEnabled ?? false,
    userName: team.user?.name ?? team.user?.email ?? "Anoniem",
    players: team.players.map((tp) => ({
      slotIndex: tp.slotIndex,
      player: tp.player,
    })),
  });
}
