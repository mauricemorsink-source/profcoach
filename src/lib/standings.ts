import { prisma } from "@/lib/prisma";

export type DeelnemerStanding = {
  id: string;
  userName: string;
  totalPoints: number;
  prevPoints: number;
  delta: number;
};

export type PublishedStandingsData = { deelnemers: DeelnemerStanding[]; stats: TopStats };

export async function getVisibleStandingsPublication(seasonId: string) {
  return prisma.standingsPublication.findFirst({
    where: { seasonId, revealAt: { lte: new Date() } },
    orderBy: { revealAt: "desc" },
  });
}

/**
 * `prevDeelnemers` is de deelnemerslijst van de VORIGE publicatie (niet de laatste
 * verwerkronde — die kunnen uren of dagen uiteen liggen, en er kunnen tussentijds meerdere
 * verwerkrondes gedraaid zijn). Zonder een vorige publicatie (of een nieuwe deelnemer die er
 * toen nog niet bij stond) is er niets om tegen te vergelijken, dus dan is de delta 0.
 */
export async function computeDeelnemersStandings(
  seasonId: string,
  prevDeelnemers?: DeelnemerStanding[]
): Promise<DeelnemerStanding[]> {
  const allStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId },
    select: { playerId: true, totalPoints: true },
  });

  const teamEntries = await prisma.teamEntry.findMany({
    where: {
      seasonId,
      OR: [{ userId: null }, { user: { isParticipant: true } }],
    },
    include: {
      user: { select: { id: true, name: true } },
      players: { select: { playerId: true } },
    },
  });

  const statsMap = new Map(allStats.map((s) => [s.playerId, s]));
  const prevMap = new Map((prevDeelnemers ?? []).map((d) => [d.id, d.totalPoints]));

  return teamEntries
    .map((te) => {
      let totalPoints = 0;
      for (const p of te.players) {
        const stat = statsMap.get(p.playerId);
        if (stat) totalPoints += stat.totalPoints;
      }
      totalPoints += (te.bonusPoints ?? 0) + (te.captainPoints ?? 0);

      const userName = te.user?.name ?? ([te.voornaam, te.achternaam].filter(Boolean).join(" ") || "Anoniem");
      const prevTotal = prevMap.get(te.id);

      return {
        id: te.id,
        userName,
        totalPoints,
        prevPoints: prevTotal ?? totalPoints,
        delta: prevTotal === undefined ? 0 : totalPoints - prevTotal,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export type StatItem = { key: string; name: string; value: number; delta: number };
export type TopStats = { topScorers: StatItem[]; topAssists: StatItem[]; topCleanSheets: StatItem[] };

/**
 * `prevStats` is de statistieken-snapshot van de vorige publicatie. Die bevat alleen de
 * toenmalige top-10 per categorie — een speler die nu voor het eerst in de top 10 staat maar
 * er vorige keer niet in stond, krijgt daarom delta 0 (zijn werkelijke vorige aantal is niet
 * bewaard) in plaats van een geraden of onjuist groot verschil.
 */
export async function computeTopStats(seasonId: string, prevStats?: TopStats): Promise<TopStats> {
  const allStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId },
    include: { player: { select: { name: true, position: true } } },
  });

  function prevValueMap(items?: StatItem[]) {
    return new Map((items ?? []).map((it) => [it.key, it.value]));
  }
  function delta(prevMap: Map<string, number>, playerId: string, value: number) {
    const prev = prevMap.get(playerId);
    return prev === undefined ? 0 : value - prev;
  }

  const prevScorers = prevValueMap(prevStats?.topScorers);
  const prevAssists = prevValueMap(prevStats?.topAssists);
  const prevCleanSheets = prevValueMap(prevStats?.topCleanSheets);

  const topScorers = allStats
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.goals, delta: delta(prevScorers, s.playerId, s.goals) }));

  const topAssists = allStats
    .filter((s) => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.assists, delta: delta(prevAssists, s.playerId, s.assists) }));

  const topCleanSheets = allStats
    .filter((s) => s.player.position === "GK" && s.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.cleanSheets, delta: delta(prevCleanSheets, s.playerId, s.cleanSheets) }));

  return { topScorers, topAssists, topCleanSheets };
}
