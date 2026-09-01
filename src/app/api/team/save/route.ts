import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";

const teamInclude = {
  formation: true,
  players: {
    include: { player: true },
    orderBy: { slotIndex: "asc" as const },
  },
};

export async function POST(req: Request) {
  const { ok, retryAfterSec } = await rateLimit(`team-save:${getIp(req)}`, { max: 30, windowMs: 60 * 1000 });
  if (!ok) {
    return NextResponse.json({ error: "Te veel verzoeken. Probeer het later opnieuw." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    });
  }

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

  // Lichte validatie die altijd moet kloppen, ook tijdens een nog onvolledig concept:
  // geen dubbele spelers, en elke ingevulde speler moet echt bestaan. Budget/posities/
  // elftal-verdeling worden pas bij het definitief indienen afgedwongen (save is bedoeld
  // voor tussentijds, mogelijk nog onvolledig opslaan).
  const filledIds = (slots as (string | null)[]).filter((id): id is string => !!id);
  if (new Set(filledIds).size !== filledIds.length) {
    return NextResponse.json({ error: "Een speler kan niet twee keer in het team staan" }, { status: 400 });
  }
  if (filledIds.length > 0) {
    const foundCount = await prisma.player.count({ where: { id: { in: filledIds } } });
    if (foundCount !== filledIds.length) {
      return NextResponse.json({ error: "Eén of meer geselecteerde spelers bestaan niet (meer)" }, { status: 400 });
    }
  }

  const team = await prisma.teamEntry.findUnique({ where: { id: teamEntryId } });
  if (!team) return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
  if (team.locked) return NextResponse.json({ error: "Team is gelockt" }, { status: 400 });

  // Eigenaarscontrole: als het team al aan een gebruiker is gekoppeld, moet die ingelogd zijn
  if (team.userId !== null) {
    const session = await getSession();
    if (!session || session.userId !== team.userId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }
  }

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
