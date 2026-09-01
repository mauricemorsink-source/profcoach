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

export async function computeDeelnemersStandings(seasonId: string): Promise<DeelnemerStanding[]> {
  const allStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId },
    select: { playerId: true, totalPoints: true, prevPoints: true, wins: true },
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

  return teamEntries
    .map((te) => {
      let totalPoints = 0;
      let prevPoints = 0;
      for (const p of te.players) {
        const stat = statsMap.get(p.playerId);
        if (stat) {
          totalPoints += stat.totalPoints;
          prevPoints += stat.prevPoints;
        }
      }
      totalPoints += (te.bonusPoints ?? 0) + (te.captainPoints ?? 0);
      prevPoints += (te.prevBonusPoints ?? 0) + (te.prevCaptainPoints ?? 0);

      const userName = te.user?.name ?? ([te.voornaam, te.achternaam].filter(Boolean).join(" ") || "Anoniem");

      return {
        id: te.id,
        userName,
        totalPoints,
        prevPoints,
        delta: isFinite(totalPoints - prevPoints) ? totalPoints - prevPoints : 0,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export type StatItem = { key: string; name: string; value: number; delta: number };
export type TopStats = { topScorers: StatItem[]; topAssists: StatItem[]; topCleanSheets: StatItem[] };

export async function computeTopStats(seasonId: string): Promise<TopStats> {
  const allStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId },
    include: { player: { select: { name: true, position: true } } },
  });

  const topScorers = allStats
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.goals, delta: s.goals - (s.prevGoals ?? 0) }));

  const topAssists = allStats
    .filter((s) => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.assists, delta: s.assists - (s.prevAssists ?? 0) }));

  const topCleanSheets = allStats
    .filter((s) => s.player.position === "GK" && s.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets)
    .slice(0, 10)
    .map((s) => ({ key: s.playerId, name: s.player.name, value: s.cleanSheets, delta: s.cleanSheets - (s.prevCleanSheets ?? 0) }));

  return { topScorers, topAssists, topCleanSheets };
}
