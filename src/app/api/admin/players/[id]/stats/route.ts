import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildConfigMap, getPoints, isApplicable } from "@/lib/points";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { id: playerId } = await params;

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  const [seasonStats, performances, configs] = await Promise.all([
    season
      ? prisma.playerSeasonStats.findUnique({ where: { playerId_seasonId: { playerId, seasonId: season.id } } })
      : null,
    prisma.matchPerformance.findMany({
      where: { playerId },
      include: { match: { select: { id: true, name: true, matchDate: true, clubTeam: true, homeAway: true, goalsScored: true, goalsConceded: true, status: true } } },
      orderBy: { match: { matchDate: "desc" } },
    }),
    prisma.pointsConfig.findMany(),
  ]);

  const configMap = buildConfigMap(configs);
  const pos = player.position;

  const perfs = performances
    .filter((p) => p.match.status === "PROCESSED")
    .map((p) => {
      const m = p.match;
      const won = m.goalsScored > m.goalsConceded;
      const drew = m.goalsScored === m.goalsConceded;
      const cleanSheet = m.goalsConceded === 0;

      let points = 0;
      const breakdown: Record<string, number> = {};

      const add = (key: string, val: number) => { if (val !== 0) { breakdown[key] = val; points += val; } };

      if (p.played) {
        if (p.goals > 0)        add("Doelpunten",      p.goals       * getPoints(configMap, "goal",          pos));
        if (p.penaltyGoals > 0) add("Strafschoppen",   p.penaltyGoals * getPoints(configMap, "penaltyGoal",  pos));
        if (p.assists > 0)      add("Assists",         p.assists      * getPoints(configMap, "assist",        pos));
        if (p.ownGoals > 0)     add("Eigen doelpunten",p.ownGoals     * getPoints(configMap, "ownGoal",       pos));
        if (won)                add("Gewonnen",        getPoints(configMap, "win",    pos));
        if (drew)               add("Gelijkspel",      getPoints(configMap, "draw",   pos));
        if (p.yellowCards > 0)  add("Gele kaarten",   p.yellowCards  * getPoints(configMap, "yellowCard",    pos));
        if (p.redCard)          add("Rode kaart",      getPoints(configMap, "redCard", pos));
        if (cleanSheet && isApplicable(configMap, "cleanSheet", pos))
                                add("Nul gehouden",    getPoints(configMap, "cleanSheet", pos));
        if (isApplicable(configMap, "goalsConceded", pos) && m.goalsConceded > 0)
                                add("Tegendoelpunten", m.goalsConceded * getPoints(configMap, "goalsConceded", pos));
      }

      return {
        matchId:       m.id,
        matchName:     m.name,
        matchDate:     m.matchDate,
        clubTeam:      m.clubTeam,
        homeAway:      m.homeAway,
        goalsScored:   m.goalsScored,
        goalsConceded: m.goalsConceded,
        played:        p.played,
        goals:         p.goals,
        penaltyGoals:  p.penaltyGoals,
        assists:       p.assists,
        ownGoals:      p.ownGoals,
        yellowCards:   p.yellowCards,
        redCard:       p.redCard,
        cleanSheet:    p.played && cleanSheet && isApplicable(configMap, "cleanSheet", pos),
        won:           p.played && won,
        drew:          p.played && drew,
        points,
        breakdown,
      };
    });

  return NextResponse.json({ player, seasonStats, performances: perfs });
}
