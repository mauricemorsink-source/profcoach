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
  const { teamEntryId } = await req.json();

  const team = await prisma.teamEntry.findUnique({
    where: { id: teamEntryId },
    include: teamInclude,
  });
  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
  if (team.locked) return NextResponse.json({ team, alreadyLocked: true });

  const locked = await prisma.teamEntry.update({
    where: { id: teamEntryId },
    data: { locked: true },
    include: teamInclude,
  });

  return NextResponse.json({ team: locked });
}