import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildConfigMap, applyMatchPointsToSeason } from "@/lib/points";

export async function POST(
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
  if (match.status !== "PROCESSED") {
    return NextResponse.json({ error: "Alleen verwerkte wedstrijden kunnen worden teruggezet" }, { status: 400 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });

  const configs = await prisma.pointsConfig.findMany();
  const configMap = buildConfigMap(configs);
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  const captainBonus = settings ? { enabled: settings.captainEnabled, pointsPerWin: settings.captainBonusPerWin } : null;

  // Trek de punten (en aanvoerdersbonus) terug via dezelfde snapshot-logica als het
  // normale verwerken (nu met factor -1), zodat prevPoints/prevCaptainPoints kloppen.
  const playersReverted = await applyMatchPointsToSeason(season.id, configMap, [{ matches: [match], factor: -1 }], captainBonus);

  // Zet wedstrijd terug naar APPROVED
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "APPROVED", processedAt: null },
  });

  await prisma.gameSettings.update({
    where: { id: "singleton" },
    data: { standingsUpdatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, playersReverted });
}
