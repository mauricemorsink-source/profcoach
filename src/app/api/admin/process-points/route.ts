import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  // Optional: only process specific match IDs
  let selectedIds: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.matchIds) && body.matchIds.length > 0) {
      selectedIds = body.matchIds as string[];
    }
  } catch {
    // No body or invalid JSON → process all
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

    const approvedWhere = selectedIds
      ? { status: "APPROVED" as const, seasonId: season.id, id: { in: selectedIds } }
      : { status: "APPROVED" as const, seasonId: season.id };

    const correctionWhere = selectedIds
      ? { status: "CORRECTION" as const, seasonId: season.id, id: { in: selectedIds } }
      : { status: "CORRECTION" as const, seasonId: season.id };

    const approvedMatches = await prisma.match.findMany({
      where: approvedWhere,
      include: { performances: { include: { player: { select: { position: true } } } } },
    });

    const correctionMatches = await prisma.match.findMany({
      where: correctionWhere,
      include: { performances: { include: { player: { select: { position: true } } } } },
    });

    if (approvedMatches.length === 0 && correctionMatches.length === 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      return NextResponse.json({ processed: 0, reversed: 0, playersUpdated: 0 });
    }

    type Delta = ReturnType<typeof calculateMatchPoints> extends Map<string, infer V> ? V : never;
    const totalDeltas = new Map<string, Delta>();

    function mergeDelta(playerId: string, delta: Delta, factor: 1 | -1) {
      const existing = totalDeltas.get(playerId);
      if (existing) {
        existing.points        += delta.points        * factor;
        existing.goals         += delta.goals         * factor;
        existing.penaltyGoals  += delta.penaltyGoals  * factor;
        existing.assists       += delta.assists       * factor;
        existing.ownGoals      += delta.ownGoals      * factor;
        existing.yellowCards   += delta.yellowCards   * factor;
        existing.redCards      += delta.redCards      * factor;
        existing.cleanSheets   += delta.cleanSheets   * factor;
        existing.goalsConceded += delta.goalsConceded * factor;
        existing.wins          += delta.wins          * factor;
        existing.draws         += delta.draws         * factor;
        existing.matchesPlayed += delta.matchesPlayed * factor;
      } else {
        totalDeltas.set(playerId, {
          points:        delta.points        * factor,
          goals:         delta.goals         * factor,
          penaltyGoals:  delta.penaltyGoals  * factor,
          assists:       delta.assists       * factor,
          ownGoals:      delta.ownGoals      * factor,
          yellowCards:   delta.yellowCards   * factor,
          redCards:      delta.redCards      * factor,
          cleanSheets:   delta.cleanSheets   * factor,
          goalsConceded: delta.goalsConceded * factor,
          wins:          delta.wins          * factor,
          draws:         delta.draws         * factor,
          matchesPlayed: delta.matchesPlayed * factor,
        });
      }
    }

    for (const match of approvedMatches) {
      for (const [playerId, delta] of calculateMatchPoints(match, configMap)) {
        mergeDelta(playerId, delta, 1);
      }
    }

    for (const match of correctionMatches) {
      for (const [playerId, delta] of calculateMatchPoints(match, configMap)) {
        mergeDelta(playerId, delta, -1);
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

    // Snapshot prevCaptainPoints voor alle TeamEntries van dit seizoen
    await prisma.$executeRaw`
      UPDATE "TeamEntry"
      SET "prevCaptainPoints" = "captainPoints"
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
          // prevPoints is al correct gezet via de raw update hierboven
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

    // Aanvoerdersbonus berekenen per TeamEntry (op basis van wins in deze batch)
    if (settings?.captainEnabled) {
      const captainBonusPerWin = settings.captainBonusPerWin ?? 5;
      const teamEntries = await prisma.teamEntry.findMany({
        where: { seasonId: season.id, captainSlot: { not: null } },
        include: { players: { select: { playerId: true, slotIndex: true } } },
      });

      for (const te of teamEntries) {
        const captainPlayer = te.players.find((p) => p.slotIndex === te.captainSlot);
        if (!captainPlayer) continue;
        const captainDelta = totalDeltas.get(captainPlayer.playerId);
        if (!captainDelta || captainDelta.wins === 0) continue;
        await prisma.teamEntry.update({
          where: { id: te.id },
          data: { captainPoints: { increment: captainBonusPerWin * captainDelta.wins } },
        });
      }
    }

    // APPROVED → PROCESSED
    if (approvedMatches.length > 0) {
      await prisma.match.updateMany({
        where: { id: { in: approvedMatches.map((m) => m.id) } },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    }

    // CORRECTION → hard delete
    for (const match of correctionMatches) {
      await prisma.matchPerformance.deleteMany({ where: { matchId: match.id } });
      await prisma.match.delete({ where: { id: match.id } });
    }

    await prisma.gameSettings.update({
      where: { id: "singleton" },
      data: { standingsUpdatedAt: new Date(), isProcessing: false },
    });

    return NextResponse.json({
      processed: approvedMatches.length,
      reversed: correctionMatches.length,
      playersUpdated: totalDeltas.size,
    });
  } catch (error) {
    await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
    console.error("process-points error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
