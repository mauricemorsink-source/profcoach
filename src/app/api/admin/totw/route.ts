import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { matchIds, formationCode } = body;

  if (!Array.isArray(matchIds) || matchIds.length === 0) {
    return NextResponse.json({ error: "Geen wedstrijden geselecteerd" }, { status: 400 });
  }

  const [matches, formation, configs] = await Promise.all([
    prisma.match.findMany({
      where: { id: { in: matchIds }, status: "PROCESSED" },
      include: {
        performances: {
          where: { played: true },
          include: {
            player: { select: { name: true, shortName: true, position: true, clubTeam: true } },
          },
        },
      },
    }),
    prisma.formation.findUnique({ where: { code: formationCode } }),
    prisma.pointsConfig.findMany(),
  ]);

  if (!formation) {
    return NextResponse.json({ error: "Formatie niet gevonden" }, { status: 400 });
  }

  const configMap = buildConfigMap(configs);

  type PlayerEntry = {
    playerId: string;
    name: string;
    shortName: string | null;
    position: string;
    clubTeam: string;
    points: number;
  };

  const playerMap = new Map<string, PlayerEntry>();

  for (const match of matches) {
    const pointsMap = calculateMatchPoints(match, configMap);
    for (const perf of match.performances) {
      const pts = perf.isExcluded ? 0 : (pointsMap.get(perf.playerId)?.points ?? 0);
      const existing = playerMap.get(perf.playerId);
      if (existing) {
        existing.points += pts;
      } else {
        playerMap.set(perf.playerId, {
          playerId: perf.playerId,
          name: perf.player.name,
          shortName: perf.player.shortName ?? null,
          position: perf.player.position,
          clubTeam: perf.player.clubTeam,
          points: pts,
        });
      }
    }
  }

  function pickTopN(list: PlayerEntry[], n: number): PlayerEntry[] {
    if (list.length <= n) return list;
    const sorted = [...list].sort((a, b) => b.points - a.points);
    const cutoff = sorted[n - 1].points;
    const above = sorted.filter((p) => p.points > cutoff);
    const tied = sorted.filter((p) => p.points === cutoff);
    // Fisher-Yates shuffle zodat gelijkspelers random worden geselecteerd
    for (let i = tied.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tied[i], tied[j]] = [tied[j], tied[i]];
    }
    return [...above, ...tied.slice(0, n - above.length)];
  }

  const byPosition: Record<string, PlayerEntry[]> = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const entry of playerMap.values()) {
    const pos = entry.position as keyof typeof byPosition;
    byPosition[pos]?.push(entry);
  }

  const players = [
    ...pickTopN(byPosition.GK, 1),
    ...pickTopN(byPosition.DEF, formation.defenders),
    ...pickTopN(byPosition.MID, formation.midfielders),
    ...pickTopN(byPosition.ATT, formation.attackers),
  ];

  return NextResponse.json({
    formation: {
      code: formation.code,
      defenders: formation.defenders,
      midfielders: formation.midfielders,
      attackers: formation.attackers,
    },
    players,
  });
}
