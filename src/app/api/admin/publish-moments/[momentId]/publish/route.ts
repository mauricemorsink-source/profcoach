import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ momentId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { momentId } = await params;

  let excludedPerformances: { playerId: string; matchId: string }[] = [];
  let conflictsResolved = false;
  try {
    const body = await req.json();
    if (Array.isArray(body?.excludedPerformances)) {
      excludedPerformances = body.excludedPerformances;
    }
    if (body?.conflictsResolved === true) {
      conflictsResolved = true;
    }
  } catch {
    // No body → no exclusions
  }
  const excludedSet = new Set(excludedPerformances.map((e) => `${e.matchId}:${e.playerId}`));

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
      include: {
        performances: {
          include: {
            player: { select: { name: true, position: true, clubTeam: true, altTeam: true } },
          },
        },
      },
    });

    if (approvedMatches.length === 0) {
      await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
      await prisma.publishMoment.update({ where: { id: momentId }, data: { publishedAt: new Date() } });
      return NextResponse.json({ processed: 0, playersUpdated: 0 });
    }

    // Pre-calculate points per match (needed for conflict 409 response and processing)
    const matchPointsMaps = new Map<string, ReturnType<typeof calculateMatchPoints>>();
    for (const match of approvedMatches) {
      matchPointsMaps.set(match.id, calculateMatchPoints(match, configMap));
    }

    // Server-side conflict check: only when admin hasn't gone through the modal yet.
    if (!conflictsResolved) {
      const playerMatchMap = new Map<string, {
        player: { name: string; position: string; clubTeam: string; altTeam: string | null };
        matches: {
          matchId: string; matchName: string; matchDate: string; matchClubTeam: string;
          isOriginalTeam: boolean; goals: number; penaltyGoals: number; assists: number;
          ownGoals: number; yellowCards: number; redCard: boolean; points: number;
        }[];
      }>();

      for (const match of approvedMatches) {
        const matchPointsMap = matchPointsMaps.get(match.id)!;
        for (const perf of match.performances) {
          if (!perf.played) continue;
          if (excludedSet.has(`${match.id}:${perf.playerId}`)) continue;
          const delta = matchPointsMap.get(perf.playerId);
          const entry = {
            matchId: match.id,
            matchName: match.name,
            matchDate: match.matchDate.toISOString(),
            matchClubTeam: match.clubTeam,
            isOriginalTeam: match.clubTeam === perf.player.clubTeam,
            goals: perf.goals,
            penaltyGoals: perf.penaltyGoals,
            assists: perf.assists,
            ownGoals: perf.ownGoals,
            yellowCards: perf.yellowCards,
            redCard: perf.redCard,
            points: delta?.points ?? 0,
          };
          const existing = playerMatchMap.get(perf.playerId);
          if (existing) {
            existing.matches.push(entry);
          } else {
            playerMatchMap.set(perf.playerId, {
              player: {
                name: perf.player.name,
                position: perf.player.position,
                clubTeam: perf.player.clubTeam,
                altTeam: perf.player.altTeam,
              },
              matches: [entry],
            });
          }
        }
      }

      const unresolvedConflicts = [];
      for (const [playerId, data] of playerMatchMap) {
        if (data.matches.length >= 2) unresolvedConflicts.push({ playerId, ...data });
      }
      if (unresolvedConflicts.length > 0) {
        await prisma.gameSettings.update({ where: { id: "singleton" }, data: { isProcessing: false } });
        return NextResponse.json({ error: "conflicts", conflicts: unresolvedConflicts }, { status: 409 });
      }
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
      for (const [playerId, delta] of matchPointsMaps.get(match.id)!) {
        if (excludedSet.has(`${match.id}:${playerId}`)) {
          // Excluded by conflict resolution: goals/assists still count for stats, but no points.
          mergeDelta(playerId, {
            points: 0, matchesPlayed: 0, wins: 0, draws: 0,
            cleanSheets: 0, goalsConceded: 0,
            goals: delta.goals,
            penaltyGoals: delta.penaltyGoals,
            assists: delta.assists,
            ownGoals: delta.ownGoals,
            yellowCards: delta.yellowCards,
            redCards: delta.redCards,
          });
          continue;
        }
        mergeDelta(playerId, delta);
      }
    }

    // Snapshot prev* for all players before updating
    await prisma.$executeRaw`
      UPDATE "PlayerSeasonStats"
      SET "prevPoints"      = "totalPoints",
          "prevGoals"       = goals,
          "prevAssists"     = assists,
          "prevCleanSheets" = "cleanSheets"
      WHERE "seasonId" = ${season.id}
    `;

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

    // Captain bonus: for each team entry whose captain's team won a match in this moment
    if (settings?.captainEnabled && (settings.captainBonusPerWin ?? 0) > 0) {
      const teamEntries = await prisma.teamEntry.findMany({
        where: { seasonId: season.id, captainSlot: { not: null } },
        include: {
          players: {
            include: { player: { select: { clubTeam: true, altTeam: true } } },
          },
        },
      });

      for (const entry of teamEntries) {
        if (entry.captainSlot === null) continue;
        const captainSlotPlayer = entry.players.find((p) => p.slotIndex === entry.captainSlot);
        if (!captainSlotPlayer) continue;
        const captainTeam = captainSlotPlayer.player.altTeam ?? captainSlotPlayer.player.clubTeam;
        const wins = approvedMatches.filter(
          (m) => m.clubTeam === captainTeam && m.goalsScored > m.goalsConceded
        ).length;
        if (wins > 0) {
          await prisma.teamEntry.update({
            where: { id: entry.id },
            data: { captainPoints: { increment: wins * settings.captainBonusPerWin } },
          });
        }
      }
    }

    // Persist exclusions so TOTW and future reads know which performances don't count for points
    for (const exc of excludedPerformances) {
      await prisma.matchPerformance.updateMany({
        where: { matchId: exc.matchId, playerId: exc.playerId },
        data: { isExcluded: true },
      });
    }

    await prisma.match.updateMany({
      where: { id: { in: approvedMatches.map((m) => m.id) } },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

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
