import { prisma } from "@/lib/prisma";

export type DeelnemerStanding = {
  id: string;
  userName: string;
  totalPoints: number;
  prevPoints: number;
  delta: number;
};

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
