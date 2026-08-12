import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap, reverseCaptainBonusForMatches } from "@/lib/points";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      publishMoment: { select: { id: true, label: true, scheduledAt: true, publishedAt: true } },
      performances: {
        include: { player: { select: { name: true, position: true, clubTeam: true } } },
        orderBy: { player: { name: "asc" } },
      },
    },
  });

  return NextResponse.json(matches);
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { ids } = body as { ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Geen wedstrijden opgegeven" }, { status: 400 });
  }

  const targets = await prisma.match.findMany({
    where: { id: { in: ids } },
    include: { performances: { include: { player: { select: { position: true } } } } },
  });

  if (targets.length === 0) {
    return NextResponse.json({ deleted: 0, playersReverted: 0 });
  }

  // PROCESSED/CORRECTION wedstrijden: punten meteen terugdraaien voordat ze verdwijnen
  const needsReversal = targets.filter((m) => m.status === "PROCESSED" || m.status === "CORRECTION");
  let playersReverted = 0;

  if (needsReversal.length > 0) {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });

    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);

    type Delta = ReturnType<typeof calculateMatchPoints> extends Map<string, infer V> ? V : never;
    const totalDeltas = new Map<string, Delta>();

    for (const match of needsReversal) {
      for (const [playerId, delta] of calculateMatchPoints(match, configMap)) {
        const existing = totalDeltas.get(playerId);
        if (existing) {
          existing.points        += delta.points;
          existing.goals         += delta.goals;
          existing.penaltyGoals  += delta.penaltyGoals;
          existing.assists       += delta.assists;
          existing.ownGoals      += delta.ownGoals;
          existing.yellowCards   += delta.yellowCards;
          existing.redCards      += delta.redCards;
          existing.cleanSheets   += delta.cleanSheets;
          existing.goalsConceded += delta.goalsConceded;
          existing.wins          += delta.wins;
          existing.draws         += delta.draws;
          existing.matchesPlayed += delta.matchesPlayed;
        } else {
          totalDeltas.set(playerId, { ...delta });
        }
      }
    }

    for (const [playerId, delta] of totalDeltas) {
      const current = await prisma.playerSeasonStats.findUnique({
        where: { playerId_seasonId: { playerId, seasonId: season.id } },
      });
      if (!current) continue;
      await prisma.playerSeasonStats.update({
        where: { playerId_seasonId: { playerId, seasonId: season.id } },
        data: {
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
    playersReverted = totalDeltas.size;

    const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
    await reverseCaptainBonusForMatches(
      season.id,
      needsReversal,
      settings ? { enabled: settings.captainEnabled, pointsPerWin: settings.captainBonusPerWin } : null
    );

    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { standingsUpdatedAt: new Date() } });
  }

  // Altijd hard delete: geen tussenstatus meer die punten kan "kwijtraken"
  const allIds = targets.map((m) => m.id);
  await prisma.matchPerformance.deleteMany({ where: { matchId: { in: allIds } } });
  await prisma.match.deleteMany({ where: { id: { in: allIds } } });

  return NextResponse.json({ deleted: allIds.length, playersReverted });
}
