import { prisma } from "@/lib/prisma";
import DeelnemersTable from "@/components/tussenstand/DeelnemersTable";

export default async function DeelnemersPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });

  let deelnemers: {
    userId: string; userName: string; totalPoints: number; prevPoints: number; delta: number;
  }[] = [];

  if (season) {
    const allStats = await prisma.playerSeasonStats.findMany({
      where: { seasonId: season.id },
      select: { playerId: true, totalPoints: true, prevPoints: true, wins: true },
    });

    const teamEntries = await prisma.teamEntry.findMany({
      where: { seasonId: season.id, userId: { not: null }, user: { isParticipant: true } },
      include: {
        user: { select: { id: true, name: true } },
        players: { select: { playerId: true, slotIndex: true } },
      },
    });

    const statsMap = new Map(allStats.map((s) => [s.playerId, s]));
    const captainActive = settings?.captainEnabled ?? false;
    const captainBonusPerWin = settings?.captainBonusPerWin ?? 5;

    deelnemers = teamEntries
      .filter((te) => te.user !== null)
      .map((te) => {
        const captainPlayerId = captainActive && te.captainSlot !== null
          ? te.players.find((p) => p.slotIndex === te.captainSlot)?.playerId ?? null
          : null;
        let totalPoints = 0;
        let prevPoints = 0;
        for (const p of te.players) {
          const stat = statsMap.get(p.playerId);
          if (stat) {
            totalPoints += stat.totalPoints;
            prevPoints += stat.prevPoints;
            if (p.playerId === captainPlayerId) {
              totalPoints += captainBonusPerWin * (stat.wins ?? 0);
            }
          }
        }
        totalPoints += te.bonusPoints ?? 0;
        return {
          userId: te.user!.id,
          userName: te.user!.name ?? "Anoniem",
          totalPoints,
          prevPoints,
          delta: isFinite(totalPoints - prevPoints) ? totalPoints - prevPoints : 0,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  return <DeelnemersTable deelnemers={deelnemers} />;
}
