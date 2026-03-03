import type { PointsConfig, MatchPerformance, Player, Match } from "@prisma/client";

export type PerformanceWithPlayer = MatchPerformance & {
  player: Pick<Player, "position">;
};

export type MatchWithPerformances = Match & {
  performances: PerformanceWithPlayer[];
};

type ConfigMap = Record<string, PointsConfig>;

function getPoints(configMap: ConfigMap, actionId: string, position: string): number {
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

function isApplicable(configMap: ConfigMap, actionId: string, position: string): boolean {
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

    // Doelpunten (normaal, excl. penalty)
    const normalGoals = perf.goals - perf.penaltyGoals;
    if (normalGoals > 0) pts += normalGoals * getPoints(configMap, "goal", pos);

    // Strafschop-doelpunten
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

    // Rode kaart
    if (perf.redCard) pts += getPoints(configMap, "redCard", pos);

    // Nul houden (alleen van toepassing voor GK en DEF)
    if (cleanSheet && isApplicable(configMap, "cleanSheet", pos)) {
      pts += getPoints(configMap, "cleanSheet", pos);
    }

    // Tegendoelpunten (alleen van toepassing voor GK en DEF)
    if (isApplicable(configMap, "goalsConceded", pos) && match.goalsConceded > 0) {
      pts += match.goalsConceded * getPoints(configMap, "goalsConceded", pos);
    }

    deltaMap.set(perf.playerId, {
      points: pts,
      goals: perf.goals,
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
