import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { validateTeamServerSide } from "@/lib/teamValidation";

const teamInclude = {
  formation: true,
  players: {
    include: { player: true },
    orderBy: { slotIndex: "asc" as const },
  },
};

function buildSlotsArray(players: { slotIndex: number; playerId: string }[]): (string | null)[] {
  const slots: (string | null)[] = Array(11).fill(null);
  for (const p of players) slots[p.slotIndex] = p.playerId;
  return slots;
}

export async function POST(req: Request) {
  const { ok, retryAfterSec } = await rateLimit(`team-submit:${getIp(req)}`, { max: 10, windowMs: 60 * 1000 });
  if (!ok) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer het later opnieuw." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    });
  }

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

  const validation = await validateTeamServerSide({
    formationId: team.formationId,
    slots: buildSlotsArray(team.players),
    budget: settings?.budget ?? 1750,
    captainEnabled: settings?.captainEnabled ?? false,
    captainSlot: team.captainSlot,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.errors[0] ?? "Ongeldige teamsamenstelling", errors: validation.errors }, { status: 400 });
  }

  const locked = await prisma.teamEntry.update({
    where: { id: teamEntryId },
    data: { locked: true },
    include: teamInclude,
  });

  return NextResponse.json({ team: locked });
}
