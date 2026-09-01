import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateTeamServerSide } from "@/lib/teamValidation";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id } = await params;
  const { formationId, slots, captainSlot } = await req.json();

  if (!formationId || !Array.isArray(slots)) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const playerIds = (slots as (string | null)[]).filter(Boolean) as string[];
  if (playerIds.length === 0) {
    return NextResponse.json({ error: "Geen spelers" }, { status: 400 });
  }

  // Ook een admin mag nooit een team opslaan dat de spelregels schendt (max. 2 spelers per
  // elftal, budget, posities, alle 11 slots gevuld) — dezelfde regels als bij een normale
  // indiening, anders zou dit scherm de enige manier zijn om die regels te omzeilen.
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const validation = await validateTeamServerSide({
    formationId,
    slots,
    budget: settings?.budget ?? 1750,
    captainEnabled: settings?.captainEnabled ?? false,
    captainSlot: captainSlot ?? null,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.errors[0] ?? "Ongeldige teamsamenstelling", errors: validation.errors }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.teamEntry.update({
      where: { id },
      data: { formationId, captainSlot: captainSlot ?? null },
    }),
    prisma.teamEntryPlayer.deleteMany({ where: { teamEntryId: id } }),
    prisma.teamEntryPlayer.createMany({
      data: (slots as (string | null)[])
        .map((playerId, slotIndex) => ({ teamEntryId: id, playerId: playerId!, slotIndex }))
        .filter((r) => r.playerId),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
