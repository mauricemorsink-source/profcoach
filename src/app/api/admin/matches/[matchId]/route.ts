import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildConfigMap, applyMatchPointsToSeason } from "@/lib/points";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { matchId } = await params;
  const body = await req.json();
  const { status, name, matchDate, goalsScored, goalsConceded, homeAway, publishMomentId, extraScorers, notes } = body;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Wedstrijd niet gevonden" }, { status: 404 });
  }

  // CORRECTION: only allow cancelling (reverting to PROCESSED)
  if (match.status === "CORRECTION") {
    if (status !== "PROCESSED") {
      return NextResponse.json({ error: "Correctie-wedstrijden kunnen alleen worden geannuleerd" }, { status: 400 });
    }
    const updated = await prisma.match.update({ where: { id: matchId }, data: { status: "PROCESSED" } });
    return NextResponse.json(updated);
  }

  if (match.status === "PROCESSED") {
    return NextResponse.json({ error: "Verwerkte wedstrijden kunnen niet meer worden gewijzigd" }, { status: 400 });
  }

  if (status && !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
  }
  if (goalsScored !== undefined && (!Number.isInteger(Number(goalsScored)) || Number(goalsScored) < 0)) {
    return NextResponse.json({ error: "Doelpunten voor moeten een positief geheel getal zijn" }, { status: 400 });
  }
  if (goalsConceded !== undefined && (!Number.isInteger(Number(goalsConceded)) || Number(goalsConceded) < 0)) {
    return NextResponse.json({ error: "Doelpunten tegen moeten een positief geheel getal zijn" }, { status: 400 });
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      ...(status && { status }),
      ...(name !== undefined && { name: String(name) }),
      ...(matchDate !== undefined && { matchDate: new Date(matchDate) }),
      ...(goalsScored !== undefined && { goalsScored: Number(goalsScored) }),
      ...(goalsConceded !== undefined && { goalsConceded: Number(goalsConceded) }),
      ...(homeAway !== undefined && { homeAway }),
      ...("publishMomentId" in body && { publishMomentId: publishMomentId ?? null }),
      ...("extraScorers" in body && { extraScorers: extraScorers?.length ? extraScorers : null }),
      ...("notes" in body && { notes: notes?.trim() || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { performances: { include: { player: { select: { position: true } } } } },
  });
  if (!match) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  let playersReverted = 0;

  // PROCESSED of CORRECTION: punten meteen terugdraaien voordat de wedstrijd verdwijnt.
  // Hergebruikt dezelfde snapshot-logica als het normale verwerken (nu met factor -1),
  // zodat prevPoints/prevCaptainPoints ook bij verwijderen correct opnieuw gezet worden
  // en het delta-pijltje in de tussenstand niet scheeftrekt.
  if (match.status === "PROCESSED" || match.status === "CORRECTION") {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });

    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);
    const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
    const captainBonus = settings ? { enabled: settings.captainEnabled, pointsPerWin: settings.captainBonusPerWin } : null;

    playersReverted = await applyMatchPointsToSeason(season.id, configMap, [{ matches: [match], factor: -1 }], captainBonus);

    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { standingsUpdatedAt: new Date() } });
  }

  // Altijd hard delete: geen tussenstatus meer die punten kan "kwijtraken"
  await prisma.matchPerformance.deleteMany({ where: { matchId } });
  await prisma.match.delete({ where: { id: matchId } });

  return NextResponse.json({ ok: true, playersReverted });
}
