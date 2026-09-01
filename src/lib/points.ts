import type { PointsConfig, MatchPerformance, Player, Match } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PerformanceWithPlayer = MatchPerformance & {
  player: Pick<Player, "position">;
};

export type MatchWithPerformances = Match & {
  performances: PerformanceWithPlayer[];
};

type ConfigMap = Record<string, PointsConfig>;

export type MatchForGuestConflictCheck = Match & {
  performances: (MatchPerformance & { player: Pick<Player, "name" | "position" | "clubTeam"> })[];
};

export type GuestAppearanceMatch = {
  matchId: string;
  matchName: string;
  matchClubTeam: string;
  isOwnTeam: boolean;
  counts: boolean;
  points: number;
};

export type GuestDoubleAppearance = {
  playerId: string;
  playerName: string;
  playerPosition: string;
  day: string;
  ambiguous: boolean;
  matches: GuestAppearanceMatch[];
};

/**
 * Groepeert alle prestaties per speler PER DAG (niet per hele verwerkbatch — een admin kan
 * in één keer meerdere weken tegelijk verwerken, en dan zijn wedstrijden van verschillende
 * weken géén "dezelfde ronde"). Regel: een prestatie bij het elftal waar een speler op
 * papier staat (player.clubTeam) telt altijd. Speelt hij die dag óók als gastspeler bij een
 * ander elftal, dan is dat automatisch op te lossen (de gastwedstrijd telt niet mee). Alleen
 * wanneer dat niet eenduidig is (geen van de wedstrijden die dag is zijn eigen elftal, bv.
 * twee verschillende gastoptredens) is het ambigu — dat is zo zeldzaam dat het geen
 * automatische afhandeling verdient buiten de handmatige publiceerroute (die daar een
 * conflictscherm voor toont).
 */
export function findGuestDoubleAppearances(
  matches: MatchForGuestConflictCheck[],
  configMap: ConfigMap
): GuestDoubleAppearance[] {
  type Entry = {
    matchId: string; matchName: string; matchClubTeam: string; isOwnTeam: boolean;
    playerId: string; playerName: string; playerPosition: string; points: number;
  };
  const byKey = new Map<string, Entry[]>();
  for (const match of matches) {
    const day = match.matchDate.toISOString().slice(0, 10);
    // Punten alsof deze wedstrijd wél meetelt (isExcluded genegeerd) — puur om aan de admin
    // te laten zien wat elke wedstrijd voor deze speler zou opleveren, om een keuze te maken.
    const pointsMap = calculateMatchPoints(
      { ...match, performances: match.performances.map((p) => ({ ...p, isExcluded: false })) },
      configMap
    );
    for (const perf of match.performances) {
      if (!perf.played) continue;
      const key = `${perf.playerId}|${day}`;
      const list = byKey.get(key) ?? [];
      list.push({
        matchId: match.id,
        matchName: match.name,
        matchClubTeam: match.clubTeam,
        isOwnTeam: match.clubTeam === perf.player.clubTeam,
        playerId: perf.playerId,
        playerName: perf.player.name,
        playerPosition: perf.player.position,
        points: pointsMap.get(perf.playerId)?.points ?? 0,
      });
      byKey.set(key, list);
    }
  }

  const result: GuestDoubleAppearance[] = [];
  for (const [key, entries] of byKey) {
    if (entries.length < 2) continue;
    const day = key.slice(key.indexOf("|") + 1);
    const ownTeamEntries = entries.filter((e) => e.isOwnTeam);
    const resolvable = ownTeamEntries.length === 1;
    result.push({
      playerId: entries[0].playerId,
      playerName: entries[0].playerName,
      playerPosition: entries[0].playerPosition,
      day,
      ambiguous: !resolvable,
      matches: entries.map((e) => ({
        matchId: e.matchId,
        matchName: e.matchName,
        matchClubTeam: e.matchClubTeam,
        isOwnTeam: e.isOwnTeam,
        counts: resolvable ? e.isOwnTeam : false,
        points: e.points,
      })),
    });
  }
  return result;
}

export function findAutoExcludableGuestPerformances(
  matches: MatchForGuestConflictCheck[],
  configMap: ConfigMap
): { matchId: string; playerId: string }[] {
  const toExclude: { matchId: string; playerId: string }[] = [];
  for (const appearance of findGuestDoubleAppearances(matches, configMap)) {
    if (appearance.ambiguous) continue;
    for (const m of appearance.matches) {
      if (!m.counts) toExclude.push({ matchId: m.matchId, playerId: appearance.playerId });
    }
  }
  return toExclude;
}

/**
 * Past findAutoExcludableGuestPerformances toe: zet isExcluded zowel in-memory (zodat
 * calculateMatchPoints, dat hierna in dezelfde aanroep draait, de juiste waarde ziet) als
 * in de database (voor consistentie bij een latere terugdraai/verwijdering en voor TOTW).
 * Gebruikt door de cron- en handmatige verwerk-routes, die geen conflictscherm hebben.
 */
export async function applyAutoExcludableGuestPerformances(
  matches: MatchForGuestConflictCheck[],
  configMap: ConfigMap
): Promise<number> {
  const toExclude = findAutoExcludableGuestPerformances(matches, configMap);
  if (toExclude.length === 0) return 0;

  const excludeKeys = new Set(toExclude.map((e) => `${e.matchId}:${e.playerId}`));
  for (const match of matches) {
    for (const perf of match.performances) {
      if (excludeKeys.has(`${match.id}:${perf.playerId}`)) perf.isExcluded = true;
    }
  }

  await prisma.matchPerformance.updateMany({
    where: { OR: toExclude.map((e) => ({ matchId: e.matchId, playerId: e.playerId })) },
    data: { isExcluded: true },
  });

  return toExclude.length;
}

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

    // Uitgesloten prestaties (conflictresolutie bij een gastspeler die dezelfde publicatie-
    // ronde in twee wedstrijden speelde): tellen wel mee voor statistieken (doelpunten,
    // assists, kaarten, clean sheets), maar niet voor punten/wedstrijden-gespeeld/winst —
    // exact zoals bij het oorspronkelijk verwerken. Zo blijft een latere terugdraai/
    // verwijdering van deze wedstrijd consistent: er wordt nooit meer afgetrokken dan ooit
    // is toegekend.
    const excluded = perf.isExcluded;

    deltaMap.set(perf.playerId, {
      points: excluded ? 0 : pts,
      goals: perf.goals + perf.penaltyGoals,
      penaltyGoals: perf.penaltyGoals,
      assists: perf.assists,
      ownGoals: perf.ownGoals,
      yellowCards: perf.yellowCards,
      redCards: perf.redCard ? 1 : 0,
      cleanSheets: cleanSheet && isApplicable(configMap, "cleanSheet", pos) ? 1 : 0,
      goalsConceded: !excluded && isApplicable(configMap, "goalsConceded", pos) ? match.goalsConceded : 0,
      wins: !excluded && won ? 1 : 0,
      draws: !excluded && drew ? 1 : 0,
      matchesPlayed: excluded ? 0 : 1,
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
