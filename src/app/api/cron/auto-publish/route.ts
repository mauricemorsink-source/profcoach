import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdueMoments = await prisma.publishMoment.findMany({
    where: { scheduledAt: { lte: new Date() }, publishedAt: null },
  });

  if (overdueMoments.length === 0) {
    return NextResponse.json({ processed: 0, playersUpdated: 0 });
  }

  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.isProcessing) {
    return NextResponse.json({ error: "Already processing" }, { status: 409 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json({ error: "Geen actief seizoen" }, { status: 400 });
  }

  await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: true } });

  let totalProcessed = 0;
  let totalPlayers = 0;

  try {
    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);

    for (const moment of overdueMoments) {
      const approvedMatches = await prisma.match.findMany({
        where: { publishMomentId: moment.id, status: "APPROVED", seasonId: season.id },
        include: { performances: { include: { player: { select: { position: true } } } } },
      });

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

      // Snapshot prev* voor alle spelers → delta wordt 0 voor wie niet speelde
      await prisma.$executeRaw`
        UPDATE "PlayerSeasonStats"
        SET "prevPoints"      = "totalPoints",
            "prevGoals"       = goals,
            "prevAssists"     = assists,
            "prevCleanSheets" = "cleanSheets"
        WHERE "seasonId" = ${season.id}
      `;

      const playerIds = Array.from(totalDeltas.keys());
      if (playerIds.length > 0) {
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
      }

      if (approvedMatches.length > 0) {
        await prisma.match.updateMany({
          where: { id: { in: approvedMatches.map((m) => m.id) } },
          data: { status: "PROCESSED", processedAt: new Date() },
        });
      }

      await prisma.publishMoment.update({
        where: { id: moment.id },
        data: { publishedAt: new Date() },
      });

      totalProcessed += approvedMatches.length;
      totalPlayers += totalDeltas.size;
    }

    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({
      moments: overdueMoments.length,
      processed: totalProcessed,
      playersUpdated: totalPlayers,
    });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("auto-publish cron error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
