import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateMatchPoints, buildConfigMap } from "@/lib/points";
import { adviseFormation, type ByPosition, type PlayerEntry } from "@/lib/totw";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await req.json();
  const { matchIds, formationCode, adviseOnly } = body;

  if (!Array.isArray(matchIds) || matchIds.length === 0) {
    return NextResponse.json({ error: "Geen wedstrijden geselecteerd" }, { status: 400 });
  }

  const [matches, formations, configs] = await Promise.all([
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
    prisma.formation.findMany({ orderBy: { code: "asc" } }),
    prisma.pointsConfig.findMany(),
  ]);

  const configMap = buildConfigMap(configs);
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

  const byPosition: ByPosition = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const entry of playerMap.values()) {
    byPosition[entry.position as keyof ByPosition]?.push(entry);
  }

  const { evaluations, recommendedCode } = adviseFormation(byPosition, formations);
  const advice = evaluations.map((e) => ({
    code: e.code,
    defenders: e.defenders,
    midfielders: e.midfielders,
    attackers: e.attackers,
    total: e.total,
    complete: e.complete,
    tiedOut: e.tiedOut.length,
  }));

  if (adviseOnly) {
    return NextResponse.json({ advice, recommendedCode });
  }

  const chosen = evaluations.find((e) => e.code === (formationCode ?? recommendedCode));
  if (!chosen) {
    return NextResponse.json({ error: "Formatie niet gevonden" }, { status: 400 });
  }

  return NextResponse.json({
    formation: {
      code: chosen.code,
      defenders: chosen.defenders,
      midfielders: chosen.midfielders,
      attackers: chosen.attackers,
    },
    players: chosen.picked,
    tiedOut: chosen.tiedOut,
    total: chosen.total,
    recommendedCode,
    advice,
  });
}
