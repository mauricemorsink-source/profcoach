import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

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
  const deltaMap = calculateMatchPoints(match, configMap);

  // Trek de punten van elke speler terug
  for (const [playerId, delta] of deltaMap) {
    const current = await prisma.playerSeasonStats.findUnique({
      where: { playerId_seasonId: { playerId, seasonId: season.id } },
    });
    if (current) {
      const newTotal = current.totalPoints - delta.points;
      await prisma.playerSeasonStats.update({
        where: { playerId_seasonId: { playerId, seasonId: season.id } },
        data: {
          prevPoints:    newTotal,
          totalPoints:   { decrement: delta.points },
          goals:         { decrement: delta.goals },
          penaltyGoals:  { decrement: delta.penaltyGoals },
          assists:       { decrement: delta.assists },
          ownGoals:      { decrement: delta.ownGoals },
          yellowCards:   { decrement: delta.yellowCards },
          redCards:      { decrement: delta.redCards },
          cleanSheets:   { decrement: delta.cleanSheets },
          goalsConceded: { decrement: delta.goalsConceded },
          wins:          { decrement: delta.wins },
          draws:         { decrement: delta.draws },
          matchesPlayed: { decrement: delta.matchesPlayed },
        },
      });
    }
  }

  // Zet wedstrijd terug naar APPROVED
  await prisma.match.update({
    where: { id: matchId },
    data: { status: "APPROVED", processedAt: null },
  });

  await prisma.gameSettings.update({
    where: { id: "singleton" },
    data: { standingsUpdatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, playersReverted: deltaMap.size });
}
