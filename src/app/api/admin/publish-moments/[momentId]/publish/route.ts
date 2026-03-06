import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ momentId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { momentId } = await params;

  const moment = await prisma.publishMoment.findUnique({ where: { id: momentId } });
  if (!moment) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (moment.publishedAt) {
    return NextResponse.json({ error: "Dit moment is al gepubliceerd" }, { status: 400 });
  }

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.isProcessing) {
    return NextResponse.json({ error: "Verwerking is al bezig, probeer het later opnieuw" }, { status: 409 });
  }

  await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: true } });

  try {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
    }

    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);

    const approvedMatches = await prisma.match.findMany({
      where: { publishMomentId: momentId, status: "APPROVED", seasonId: season.id },
      include: { performances: { include: { player: { select: { position: true } } } } },
    });

    if (approvedMatches.length === 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      // Still mark moment as published even if no matches to process
      await prisma.publishMoment.update({ where: { id: momentId }, data: { publishedAt: new Date() } });
      return NextResponse.json({ processed: 0, playersUpdated: 0 });
    }

    type Delta = ReturnType<typeof calculateMatchPoints> extends Map<string, infer V> ? V : never;
    const totalDeltas = new Map<string, Delta>();

    function mergeDelta(playerId: string, delta: Delta) {
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

    for (const match of approvedMatches) {
      for (const [playerId, delta] of calculateMatchPoints(match, configMap)) {
        mergeDelta(playerId, delta);
      }
    }

    // Snapshot prev* = huidige waarden voor ALLE spelers → delta wordt 0 voor wie niet speelde
    await prisma.$executeRaw`
      UPDATE "PlayerSeasonStats"
      SET "prevPoints"      = "totalPoints",
          "prevGoals"       = goals,
          "prevAssists"     = assists,
          "prevCleanSheets" = "cleanSheets"
      WHERE "seasonId" = ${season.id}
    `;

    // Huidige stats ophalen voor de betrokken spelers
    const playerIds = Array.from(totalDeltas.keys());
    const currentStats = await prisma.playerSeasonStats.findMany({
      where: { playerId: { in: playerIds }, seasonId: season.id },
    });
    const currentStatsMap = new Map(currentStats.map((s) => [s.playerId, s] as [string, typeof currentStats[number]]));

    for (const [playerId, delta] of totalDeltas) {
      const current = currentStatsMap.get(playerId);
      await prisma.playerSeasonStats.upsert({
        where: { playerId_seasonId: { playerId, seasonId: season.id } },
        create: {
          playerId, seasonId: season.id,
          prevPoints: 0, prevGoals: 0, prevAssists: 0, prevCleanSheets: 0,
          totalPoints: delta.points,
          goals: delta.goals, penaltyGoals: delta.penaltyGoals,
          assists: delta.assists, ownGoals: delta.ownGoals,
          yellowCards: delta.yellowCards, redCards: delta.redCards,
          cleanSheets: delta.cleanSheets, goalsConceded: delta.goalsConceded,
          wins: delta.wins, draws: delta.draws, matchesPlayed: delta.matchesPlayed,
        },
        update: {
          prevGoals:       current?.goals       ?? 0,
          prevAssists:     current?.assists     ?? 0,
          prevCleanSheets: current?.cleanSheets ?? 0,
          totalPoints:   { increment: delta.points },
          goals:         { increment: delta.goals },
          penaltyGoals:  { increment: delta.penaltyGoals },
          assists:       { increment: delta.assists },
          ownGoals:      { increment: delta.ownGoals },
          yellowCards:   { increment: delta.yellowCards },
          redCards:      { increment: delta.redCards },
          cleanSheets:   { increment: delta.cleanSheets },
          goalsConceded: { increment: delta.goalsConceded },
          wins:          { increment: delta.wins },
          draws:         { increment: delta.draws },
          matchesPlayed: { increment: delta.matchesPlayed },
        },
      });
    }

    // Wedstrijden op PROCESSED zetten
    await prisma.match.updateMany({
      where: { id: { in: approvedMatches.map((m) => m.id) } },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    // Moment als gepubliceerd markeren
    await prisma.publishMoment.update({
      where: { id: momentId },
      data: { publishedAt: new Date() },
    });

    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({ processed: approvedMatches.length, playersUpdated: totalDeltas.size });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("publish-moment error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
