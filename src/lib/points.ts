import type { PointsConfig, MatchPerformance, Player, Match } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PerformanceWithPlayer = MatchPerformance & {
  player: Pick<Player, "position">;
};

export type MatchWithPerformances = Match & {
  performances: PerformanceWithPlayer[];
};

type ConfigMap = Record<string, PointsConfig>;

export function getPoints(configMap: ConfigMap, actionId: string, position: string): number {
  const cfg = configMap[actionId];
  if (!cfg) return 0;
  switch (position) {
    case "GK":  return cfg.gkPoints  ?? 0;
    case "DEF": return cfg.defPoints ?? 0;
    case "MID": return cfg.midPoints ?? 0;
    case "ATT": return cfg.attPoints ?? 0;
    default:    return 0;
  }
}

export function isApplicable(configMap: ConfigMap, actionId: string, position: string): boolean {
  const cfg = configMap[actionId];
  if (!cfg) return false;
  switch (position) {
    case "GK":  return cfg.gkPoints  !== null;
    case "DEF": return cfg.defPoints !== null;
    case "MID": return cfg.midPoints !== null;
    case "ATT": return cfg.attPoints !== null;
    default:    return false;
  }
}

export type PlayerDelta = {
  points: number;
  goals: number;
  penaltyGoals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  goalsConceded: number;
  wins: number;
  draws: number;
  matchesPlayed: number;
};

export function calculateMatchPoints(
  match: MatchWithPerformances,
  configMap: ConfigMap
): Map<string, PlayerDelta> {
  const deltaMap = new Map<string, PlayerDelta>();

  const won = match.goalsScored > match.goalsConceded;
  const drew = match.goalsScored === match.goalsConceded;
  const cleanSheet = match.goalsConceded === 0;

  for (const perf of match.performances) {
    if (!perf.played) continue;

    const pos = perf.player.position;
    let pts = 0;

    // Alle doelpunten krijgen basis doelpuntpunten (incl. strafschoppen)
    if (perf.goals > 0) pts += perf.goals * getPoints(configMap, "goal", pos);

    // Strafschop-doelpunten krijgen extra bonus bovenop het basis doelpunt
    if (perf.penaltyGoals > 0) pts += perf.penaltyGoals * getPoints(configMap, "penaltyGoal", pos);

    // Assists
    if (perf.assists > 0) pts += perf.assists * getPoints(configMap, "assist", pos);

    // Eigen doelpunten
    if (perf.ownGoals > 0) pts += perf.ownGoals * getPoints(configMap, "ownGoal", pos);

    // Gewonnen / gelijkgespeeld
    if (won) pts += getPoints(configMap, "win", pos);
    if (drew) pts += getPoints(configMap, "draw", pos);

    // Gele kaarten
    if (perf.yellowCards > 0) pts += perf.yellowCards * getPoints(configMap, "yellowCard", pos);

    // Rode kaart: bij een tweede gele kaart (yellowCards >= 2) is de rode kaart het
    // automatische gevolg van de kaarten-optelling, geen aparte overtreding — dus geen
    // extra rodekaart-aftrek bovenop de gele kaarten. Bij een losse (directe of na één
    // gele kaart) rode kaart telt de rodekaart-aftrek wel gewoon mee.
    if (perf.redCard && perf.yellowCards < 2) pts += getPoints(configMap, "redCard", pos);

    // Nul houden (alleen van toepassing voor GK en DEF)
    if (cleanSheet && isApplicable(configMap, "cleanSheet", pos)) {
      pts += getPoints(configMap, "cleanSheet", pos);
    }

    // Tegendoelpunten (alleen van toepassing voor GK en DEF), met eventueel een maximum
    // aantal minpunten per wedstrijd ongeacht hoeveel goals er daadwerkelijk tegen komen.
    if (isApplicable(configMap, "goalsConceded", pos) && match.goalsConceded > 0) {
      let concededPts = match.goalsConceded * getPoints(configMap, "goalsConceded", pos);
      const cap = configMap["goalsConceded"]?.capPerMatch;
      if (cap != null) concededPts = Math.max(concededPts, cap);
      pts += concededPts;
    }

    deltaMap.set(perf.playerId, {
      points: pts,
      goals: perf.goals + perf.penaltyGoals,
      penaltyGoals: perf.penaltyGoals,
      assists: perf.assists,
      ownGoals: perf.ownGoals,
      yellowCards: perf.yellowCards,
      redCards: perf.redCard ? 1 : 0,
      cleanSheets: cleanSheet && isApplicable(configMap, "cleanSheet", pos) ? 1 : 0,
      goalsConceded: isApplicable(configMap, "goalsConceded", pos) ? match.goalsConceded : 0,
      wins: won ? 1 : 0,
      draws: drew ? 1 : 0,
      matchesPlayed: 1,
    });
  }

  return deltaMap;
}

export function buildConfigMap(configs: PointsConfig[]): ConfigMap {
  return Object.fromEntries(configs.map((c) => [c.id, c]));
}

/**
 * Telt de puntendeltas van meerdere wedstrijd-groepen bij elkaar op (factor 1 = toepassen,
 * -1 = terugdraaien) en schrijft het resultaat weg naar PlayerSeasonStats — inclusief de
 * prev*-snapshot en optionele aanvoerdersbonus. Gedeeld door /api/admin/process-points
 * (handmatig verwerken) en /api/cron/auto-publish (geplande publicatie), die verder
 * identieke logica hadden staan.
 */
export async function applyMatchPointsToSeason(
  seasonId: string,
  configMap: ConfigMap,
  matchGroups: { matches: MatchWithPerformances[]; factor: 1 | -1 }[],
  captainBonus: { enabled: boolean; pointsPerWin: number } | null
): Promise<number> {
  const totalDeltas = new Map<string, PlayerDelta>();

  function mergeDelta(playerId: string, delta: PlayerDelta, factor: 1 | -1) {
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

  for (const group of matchGroups) {
    for (const match of group.matches) {
      for (const [playerId, delta] of calculateMatchPoints(match, configMap)) {
        mergeDelta(playerId, delta, group.factor);
      }
    }
  }

  // Snapshot prev* = huidige waarden voor ALLE spelers → delta wordt 0 voor wie niet speelde
  await prisma.$executeRaw`
    UPDATE "PlayerSeasonStats"
    SET "prevPoints"      = "totalPoints",
        "prevGoals"       = goals,
        "prevAssists"     = assists,
        "prevCleanSheets" = "cleanSheets"
    WHERE "seasonId" = ${seasonId}
  `;

  // Snapshot prevCaptainPoints voor alle TeamEntries van dit seizoen
  await prisma.$executeRaw`
    UPDATE "TeamEntry"
    SET "prevCaptainPoints" = "captainPoints"
    WHERE "seasonId" = ${seasonId}
  `;

  const playerIds = Array.from(totalDeltas.keys());
  const currentStats = await prisma.playerSeasonStats.findMany({
    where: { playerId: { in: playerIds }, seasonId },
  });
  const currentStatsMap = new Map(currentStats.map((s) => [s.playerId, s] as [string, typeof currentStats[number]]));

  for (const [playerId, delta] of totalDeltas) {
    const current = currentStatsMap.get(playerId);
    await prisma.playerSeasonStats.upsert({
      where: { playerId_seasonId: { playerId, seasonId } },
      create: {
        playerId, seasonId,
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
  if (captainBonus?.enabled) {
    const teamEntries = await prisma.teamEntry.findMany({
      where: { seasonId, captainSlot: { not: null } },
      include: { players: { select: { playerId: true, slotIndex: true } } },
    });

    for (const te of teamEntries) {
      const captainPlayer = te.players.find((p) => p.slotIndex === te.captainSlot);
      if (!captainPlayer) continue;
      const captainDelta = totalDeltas.get(captainPlayer.playerId);
      if (!captainDelta || captainDelta.wins === 0) continue;
      await prisma.teamEntry.update({
        where: { id: te.id },
        data: { captainPoints: { increment: captainBonus.pointsPerWin * captainDelta.wins } },
      });
    }
  }

  return totalDeltas.size;
}
