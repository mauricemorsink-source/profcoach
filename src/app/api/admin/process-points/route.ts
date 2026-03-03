import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  // Voorkom gelijktijdige verwerking
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.isProcessing) {
    return NextResponse.json({ error: "Verwerking is al bezig, probeer het later opnieuw" }, { status: 409 });
  }

  await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: true } });

  try {
    const season = await prisma.season.findFirst({ where: { isActive: true } });
    if (!season) {
      return NextResponse.json({ error: "Geen actief seizoen gevonden" }, { status: 400 });
    }

    // Haal alle APPROVED wedstrijden op
    const matches = await prisma.match.findMany({
      where: { status: "APPROVED", seasonId: season.id },
      include: {
        performances: {
          include: { player: { select: { position: true } } },
        },
      },
    });

    if (matches.length === 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ processed: 0, playersUpdated: 0 });
    }

    // Haal puntenconfiguratie op
    const configs = await prisma.pointsConfig.findMany();
    const configMap = buildConfigMap(configs);

    // Bereken punten per speler over alle wedstrijden
    const totalDeltas = new Map<string, ReturnType<typeof calculateMatchPoints> extends Map<string, infer V> ? V : never>();

    for (const match of matches) {
      const matchDeltas = calculateMatchPoints(match, configMap);
      for (const [playerId, delta] of matchDeltas) {
        const existing = totalDeltas.get(playerId);
        if (existing) {
          existing.points += delta.points;
          existing.goals += delta.goals;
          existing.penaltyGoals += delta.penaltyGoals;
          existing.assists += delta.assists;
          existing.ownGoals += delta.ownGoals;
          existing.yellowCards += delta.yellowCards;
          existing.redCards += delta.redCards;
          existing.cleanSheets += delta.cleanSheets;
          existing.goalsConceded += delta.goalsConceded;
          existing.wins += delta.wins;
          existing.draws += delta.draws;
          existing.matchesPlayed += delta.matchesPlayed;
        } else {
          totalDeltas.set(playerId, { ...delta });
        }
      }
    }

    // Haal huidige stats op voor prevPoints snapshot
    const playerIds = Array.from(totalDeltas.keys());
    const currentStats = await prisma.playerSeasonStats.findMany({
      where: { playerId: { in: playerIds }, seasonId: season.id },
    });
    const currentStatsMap = new Map(currentStats.map((s) => [s.playerId, s] as [string, typeof currentStats[number]]));

    // Update PlayerSeasonStats
    for (const [playerId, delta] of totalDeltas) {
      const current = currentStatsMap.get(playerId);
      await prisma.playerSeasonStats.upsert({
        where: { playerId_seasonId: { playerId, seasonId: season.id } },
        create: {
          playerId,
          seasonId: season.id,
          prevPoints: 0,
          totalPoints: delta.points,
          goals: delta.goals,
          penaltyGoals: delta.penaltyGoals,
          assists: delta.assists,
          ownGoals: delta.ownGoals,
          yellowCards: delta.yellowCards,
          redCards: delta.redCards,
          cleanSheets: delta.cleanSheets,
          goalsConceded: delta.goalsConceded,
          wins: delta.wins,
          draws: delta.draws,
          matchesPlayed: delta.matchesPlayed,
        },
        update: {
          prevPoints: current?.totalPoints ?? 0,
          totalPoints: { increment: delta.points },
          goals: { increment: delta.goals },
          penaltyGoals: { increment: delta.penaltyGoals },
          assists: { increment: delta.assists },
          ownGoals: { increment: delta.ownGoals },
          yellowCards: { increment: delta.yellowCards },
          redCards: { increment: delta.redCards },
          cleanSheets: { increment: delta.cleanSheets },
          goalsConceded: { increment: delta.goalsConceded },
          wins: { increment: delta.wins },
          draws: { increment: delta.draws },
          matchesPlayed: { increment: delta.matchesPlayed },
        },
      });
    }

    // Markeer wedstrijden als PROCESSED
    await prisma.match.updateMany({
      where: { id: { in: matches.map((m) => m.id) } },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    // Update standingsUpdatedAt
    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({
      processed: matches.length,
      playersUpdated: totalDeltas.size,
    });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("process-points error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
