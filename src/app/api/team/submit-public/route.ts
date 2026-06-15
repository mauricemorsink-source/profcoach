import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });

  if (!settings || settings.requireLogin) {
    return NextResponse.json({ error: "Inschrijving zonder account is niet ingeschakeld" }, { status: 403 });
  }
  if (!settings.registrationOpen) {
    return NextResponse.json({ error: "Inschrijving is gesloten" }, { status: 403 });
  }
  if (settings.deadline && new Date() > new Date(settings.deadline)) {
    return NextResponse.json({ error: "De deadline is verstreken" }, { status: 403 });
  }

  const body = await req.json();
  const {
    voornaam, achternaam, email, telefoonnummer, whatsappGroep, betaaldAkkoord,
    formationId, slots, captainSlot,
    topScorerId, assistKoningId, totalYellowCards, totalGoals,
  } = body as {
    voornaam: string;
    achternaam: string;
    email: string;
    telefoonnummer: string;
    whatsappGroep: boolean;
    betaaldAkkoord: boolean;
    formationId: string;
    slots: (string | null)[];
    captainSlot?: number | null;
    topScorerId?: string | null;
    assistKoningId?: string | null;
    totalYellowCards?: number | null;
    totalGoals?: number | null;
  };

  if (!voornaam?.trim()) return NextResponse.json({ error: "Voornaam is verplicht" }, { status: 400 });
  if (!achternaam?.trim()) return NextResponse.json({ error: "Achternaam is verplicht" }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: "Mailadres is verplicht" }, { status: 400 });
  if (!telefoonnummer?.trim()) return NextResponse.json({ error: "Telefoonnummer is verplicht" }, { status: 400 });
  if (!betaaldAkkoord) return NextResponse.json({ error: "Je moet akkoord gaan met het inschrijfgeld" }, { status: 400 });
  if (!Array.isArray(slots) || slots.length !== 11) {
    return NextResponse.json({ error: "Ongeldige teamsamenstelling" }, { status: 400 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });

  const formation = await prisma.formation.findUnique({ where: { id: formationId } });
  if (!formation) return NextResponse.json({ error: "Ongeldige formatie" }, { status: 400 });

  const entry = await prisma.$transaction(async (tx) => {
    const teamEntry = await tx.teamEntry.create({
      data: {
        seasonId: season.id,
        formationId,
        userId: null,
        locked: true,
        captainSlot: captainSlot ?? null,
        voornaam: voornaam.trim(),
        achternaam: achternaam.trim(),
        email: email.trim().toLowerCase(),
        telefoonnummer: telefoonnummer.trim(),
        whatsappGroep: Boolean(whatsappGroep),
        betaaldAkkoord: true,
      },
    });
    await tx.teamEntryPlayer.createMany({
      data: slots
        .map((playerId, slotIndex) => ({ teamEntryId: teamEntry.id, playerId: playerId!, slotIndex }))
        .filter((s) => s.playerId != null),
    });
    const hasPred = topScorerId || assistKoningId || totalYellowCards != null || totalGoals != null;
    if (hasPred) {
      await tx.teamPrediction.create({
        data: {
          teamEntryId: teamEntry.id,
          topScorerId: topScorerId || null,
          assistKoningId: assistKoningId || null,
          totalYellowCards: totalYellowCards ?? null,
          totalGoals: totalGoals ?? null,
        },
      });
    }
    return teamEntry;
  });

  return NextResponse.json({ teamEntryId: entry.id });
}
