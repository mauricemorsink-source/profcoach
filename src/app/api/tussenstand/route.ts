import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  const settings = await prisma.gameSettings.findUnique({ where: { id: "singleton" } });

  if (!season) {
    return NextResponse.json({
      updatedAt: null,
      deelnemers: [],
      statistieken: { topScorers: [], topAssists: [], topPoints: [], cleanSheets: [] },
    });
  }

  // Haal alle PlayerSeasonStats op
  const allStats = await prisma.playerSeasonStats.findMany({
    where: { seasonId: season.id },
    include: { player: { select: { name: true, position: true, clubTeam: true } } },
  });

  // Haal deelnemers op met hun teamsamenstelling
  const teamEntries = await prisma.teamEntry.findMany({
    where: { seasonId: season.id, userId: { not: null } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      players: { select: { playerId: true } },
    },
  });

  const statsMap = new Map(allStats.map((s) => [s.playerId, s]));

  // Bereken totaal per deelnemer
  const deelnemers = teamEntries
    .filter((te) => te.user !== null)
    .map((te) => {
      const playerIds = te.players.map((p) => p.playerId);
      let totalPoints = 0;
      let prevPoints = 0;
      for (const pid of playerIds) {
        const stat = statsMap.get(pid);
        if (stat) {
          totalPoints += stat.totalPoints;
          prevPoints += stat.prevPoints;
        }
      }
      return {
        userId: te.user!.id,
        userName: te.user!.name ?? te.user!.email,
        totalPoints,
        prevPoints,
        delta: totalPoints - prevPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Statistieken
  const statsWithPlayer = allStats.map((s) => ({
    playerId: s.playerId,
    playerName: s.player.name,
    position: s.player.position,
    clubTeam: s.player.clubTeam,
    totalPoints: s.totalPoints,
    prevPoints: s.prevPoints,
    goals: s.goals,
    assists: s.assists,
    cleanSheets: s.cleanSheets,
  }));

  const topScorers = [...statsWithPlayer]
    .sort((a, b) => b.goals - a.goals)
    .filter((s) => s.goals > 0)
    .slice(0, 10)
    .map((s) => ({ ...s, delta: s.goals }));

  const topAssists = [...statsWithPlayer]
    .sort((a, b) => b.assists - a.assists)
    .filter((s) => s.assists > 0)
    .slice(0, 10)
    .map((s) => ({ ...s, delta: s.assists }));

  const topPoints = [...statsWithPlayer]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .filter((s) => s.totalPoints > 0)
    .slice(0, 10)
    .map((s) => ({ ...s, delta: s.totalPoints - s.prevPoints }));

  const topCleanSheets = [...statsWithPlayer]
    .filter((s) => s.position === "GK" && s.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets)
    .slice(0, 10)
    .map((s) => ({ ...s, delta: s.cleanSheets }));

  return NextResponse.json({
    updatedAt: settings?.standingsUpdatedAt ?? null,
    deelnemers,
    statistieken: {
      topScorers,
      topAssists,
      topPoints,
      cleanSheets: topCleanSheets,
    },
  });
}
