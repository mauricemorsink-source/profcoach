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
export type PlayerStatSnapshot = { goals: number; assists: number; cleanSheets: number };
export type TopStats = {
  topScorers: StatItem[];
  topAssists: StatItem[];
  topCleanSheets: StatItem[];
  /** Doelpunten/assists/clean sheets van ELKE speler met stats bij deze publicatie, niet
   * alleen de toenmalige top 10 — zodat een speler die nu voor het eerst in een top 10 komt
   * (bijv. eerste doelpunt ooit) ook een kloppende delta krijgt in plaats van altijd 0. */
  snapshot: Record<string, PlayerStatSnapshot>;
};

/**
 * `prevStats` is de statistieken-snapshot van de vorige publicatie, met de waarden van ALLE
 * spelers op dat moment (niet alleen wie toen in de top 10 stond). Een speler zonder snapshot
 * (bijv. pas na die publicatie toegevoegd) krijgt delta 0, want zijn werkelijke vorige aantal
 * is niet bekend.
 */
export async function computeTopStats(seasonId: string, prevStats?: TopStats): Promise<TopStats> {
  const allStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId },
    include: { player: { select: { name: true, position: true } } },
  });

  const prevSnapshot = prevStats?.snapshot ?? {};
  function delta(key: keyof PlayerStatSnapshot, playerId: string, value: number) {
    const prev = prevSnapshot[playerId]?.[key];
    return prev === undefined ? 0 : value - prev;
  }

  const topScorers = allStats
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.goals, delta: delta("goals", s.playerId, s.goals) }));

  const topAssists = allStats
    .filter((s) => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.assists, delta: delta("assists", s.playerId, s.assists) }));

  const topCleanSheets = allStats
    .filter((s) => s.player.position === "GK" && s.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.cleanSheets, delta: delta("cleanSheets", s.playerId, s.cleanSheets) }));

  const snapshot: Record<string, PlayerStatSnapshot> = {};
  for (const s of allStats) {
    snapshot[s.playerId] = { goals: s.goals, assists: s.assists, cleanSheets: s.cleanSheets };
  }

  return { topScorers, topAssists, topCleanSheets, snapshot };
}
