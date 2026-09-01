import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTeamServerSide } from "@/lib/teamValidation";

export async function POST(req: Request) {
  const { token, formationId, slots, captainSlot } = await req.json();

  if (!token || !formationId || !Array.isArray(slots) || slots.length !== 11) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const editToken = await prisma.editToken.findUnique({
    where: { token },
    include: { teamEntry: { select: { id: true } } },
  });

  if (!editToken) {
    return NextResponse.json({ error: "Ongeldige link" }, { status: 404 });
  }
  if (editToken.usedAt) {
    return NextResponse.json({ error: "Deze link is al gebruikt" }, { status: 410 });
  }
  if (editToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Deze link is verlopen" }, { status: 410 });
  }

  const settings = await prisma.gameSettings.findUnique({
    where: { id: "singleton" },
    select: { wijzigingsvensterOpen: true, budget: true, captainEnabled: true },
  });

  if (!settings?.wijzigingsvensterOpen) {
    return NextResponse.json({ error: "Het wijzigingsvenster is gesloten" }, { status: 403 });
  }

  const playerIds = (slots as (string | null)[]).filter(Boolean) as string[];
  if (playerIds.length === 0) {
    return NextResponse.json({ error: "Geen spelers geselecteerd" }, { status: 400 });
  }

  const validation = await validateTeamServerSide({
    formationId,
    slots,
    budget: settings.budget,
    captainEnabled: settings.captainEnabled,
    captainSlot: captainSlot ?? null,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.errors[0] ?? "Ongeldige teamsamenstelling", errors: validation.errors }, { status: 400 });
  }

  const teamEntryId = editToken.teamEntry.id;

  await prisma.$transaction([
    // Mark token as used
    prisma.editToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
    // Update formation + captain
    prisma.teamEntry.update({
      where: { id: teamEntryId },
      data: { formationId, captainSlot: captainSlot ?? null },
    }),
    // Replace all players
    prisma.teamEntryPlayer.deleteMany({ where: { teamEntryId } }),
    prisma.teamEntryPlayer.createMany({
      data: (slots as (string | null)[])
        .map((playerId, slotIndex) => ({ teamEntryId, playerId: playerId!, slotIndex }))
        .filter((r) => r.playerId),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
